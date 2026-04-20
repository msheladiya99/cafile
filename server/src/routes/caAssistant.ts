import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { AssistantChat } from '../models/AssistantChat';
import { AssistantDocument } from '../models/AssistantDocument';
import { AssistantNote } from '../models/AssistantNote';
import { assistantAiService } from '../services/assistantAi.service';
import { ocrService } from '../services/ocr.service';
import { storageService } from '../services/storage.service';
import fs from 'fs/promises';

const pdfParseRaw = require('pdf-parse');
const pdfParse = typeof pdfParseRaw === 'function' ? pdfParseRaw : pdfParseRaw.default || pdfParseRaw.PDFParse;

const router = Router();

// Require auth for all
router.use(authenticate);

// 1. Chat History List
router.get('/history', async (req: AuthRequest, res: Response) => {
    try {
        const chats = await AssistantChat.find({ userId: req.user!._id })
            .select('-messages')
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ data: chats });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// 2. Fetch Single Chat
router.get('/chat/:id', async (req: AuthRequest, res: Response) => {
    try {
        const chat = await AssistantChat.findOne({ _id: req.params.id, userId: req.user!._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// 3. Main Chat Endpoint
router.post('/chat', async (req: AuthRequest, res: Response) => {
    try {
        const { message, chatId } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        let chat;
        if (chatId) {
            chat = await AssistantChat.findOne({ _id: chatId, userId: req.user!._id });
        }
        if (!chat) {
            chat = new AssistantChat({
                userId: req.user!._id,
                firmId: req.firmId,
                title: message.substring(0, 40) + '...',
                messages: []
            });
        }

        // Add user message
        chat.messages.push({ role: 'user', content: message, timestamp: new Date() });
        await chat.save();

        // Query AI
        // format expected by AI: { role, content }
        const formattedMessages = chat.messages.map(m => ({ role: m.role, content: m.content }));
        
        const aiResponse = await assistantAiService.chatWithAssistant(
            formattedMessages, 
            String(req.firmId || req.user!._id)
        );

        // Save AI response
        chat.messages.push({ role: 'assistant', content: aiResponse || 'Sorry, I could not generate a response.', timestamp: new Date() });
        await chat.save();

        res.json({ reply: aiResponse, chatId: chat._id });
    } catch (e: any) {
        console.error('Chat Error:', e);
        res.status(500).json({ message: 'Failed to process chat: ' + e.message });
    }
});

// 4. Draft Generator Endpoint
router.post('/draft', async (req: AuthRequest, res: Response) => {
    try {
        const { topic, draftType, details } = req.body; // e.g., draftType: "Notice Reply"
        if (!topic || !draftType) return res.status(400).json({ message: 'Topic and draftType required' });

        const instructionMessage = {
            role: 'user',
            content: `Topic: ${topic}\nDetails: ${details || 'None'}`
        };

        const aiResponse = await assistantAiService.chatWithAssistant(
            [instructionMessage], 
            String(req.firmId || req.user!._id),
            draftType // passing draftType as customDraftMode
        );

        res.json({ draft: aiResponse });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

// 5. Upload Document for Knowledge Base
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const { path: filePath, originalname, mimetype } = req.file;
        const buffer = await fs.readFile(filePath);

        // Extract Text
        let text = '';
        if (mimetype === 'application/pdf') {
            try {
                let data = await pdfParse(buffer);
                text = (data?.text || '').trim();
            } catch (e) {
                console.warn('pdf-parse failed, falling back to ocr', e);
            }
        }
        
        // OCR fallback if text is too short or it's an image
        if (text.length < 50 || mimetype.startsWith('image/')) {
            try {
                const ocrRes = await ocrService.extractText(buffer, mimetype);
                text = ocrRes.text;
            } catch (e) {
                console.warn('OCR failed', e);
            }
        }

        if (text.length < 10) {
            await fs.unlink(filePath).catch(()=>{});
            return res.status(400).json({ message: 'Could not extract sufficient text from document.' });
        }

        // Upload to S3/Drive via storageService (which handles AWS S3 if configured)
        // Ignoring actual upload to cloud for speed in this prototype if S3 isn't set, just mock URL
        let fileUrl = 'local-path';
        try {
            const uploaded = await (storageService as any).uploadFile(buffer, originalname, mimetype);
            if (uploaded?.url) fileUrl = uploaded.url;
        } catch(e) { console.warn('Cloud upload skipped/failed'); }

        const doc = await AssistantDocument.create({
            userId: req.user!._id,
            firmId: req.firmId,
            title: originalname,
            fileUrl,
            mimeType: mimetype,
            textContext: text,
            isProcessed: false
        });

        // Trigger Pinecone Embedding asynchronously to avoid blocking response
        assistantAiService.processAndEmbedDocument(String(doc._id), text, String(req.firmId || req.user!._id))
            .then(async (result) => {
                doc.summary = result.summary;
                doc.isProcessed = true;
                await doc.save();
            })
            .catch(console.error);

        // Cleanup temp file
        await fs.unlink(filePath).catch(()=>{});

        res.json({ message: 'Document uploaded and processing started.', documentId: doc._id });
    } catch (e: any) {
        if (req.file) await fs.unlink(req.file.path).catch(()=>{});
        res.status(500).json({ message: e.message });
    }
});

// 6. Manual Note Embedding (Knowledge Base)
router.post('/embed', async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, tags } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'Title and content required.' });

        const note = await AssistantNote.create({
            userId: req.user!._id,
            firmId: req.firmId,
            title,
            content,
            tags: tags || []
        });

        // Embed
        await assistantAiService.processAndEmbedDocument(String(note._id), `Title: ${title}\n\n${content}`, String(req.firmId || req.user!._id));

        res.json({ message: 'Note saved and added to Knowledge Base.', noteId: note._id });
    } catch (e: any) {
        res.status(500).json({ message: e.message });
    }
});

export default router;
