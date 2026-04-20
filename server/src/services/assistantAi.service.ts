import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { AssistantDocument } from '../models/AssistantDocument';
import mongoose from 'mongoose';

export class AssistantAiService {
    private openai: OpenAI;
    private pinecone: Pinecone | null = null;
    private indexName = process.env.PINECONE_INDEX || 'ca-assistant';

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
        this.openai = new OpenAI({
            apiKey: apiKey,
            // Use openrouter base url if we are using openrouter key, otherwise default openai
            baseURL: apiKey?.startsWith('sk-or') ? 'https://openrouter.ai/api/v1' : undefined,
        });

        if (process.env.PINECONE_API_KEY) {
            this.pinecone = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
            });
        }
    }

    private getModelOptions() {
        // Use user's preference or fallback
        if (process.env.OPENAI_API_KEY) {
            return { chatModel: 'gpt-4o', embedModel: 'text-embedding-3-small' };
        }
        return { 
            chatModel: process.env.OPENROUTER_TAX_MODEL || 'openai/gpt-4o-mini',
            // Defaulting to OpenAI embeddings if they provide a standard key, but OpenRouter doesn't support embedding conventionally.
            // Assuming they will set OPENAI_API_KEY if they actually want Pinecone embeddings.
            embedModel: 'text-embedding-3-small' 
        };
    }

    /**
     * Chunk text into smaller pieces for embedding
     */
    private chunkText(text: string, chunkSize = 1000): string[] {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Process a document: Extract text (done prior), summarize, embed, and store in Pinecone
     */
    async processAndEmbedDocument(docId: string, textContext: string, firmId: string) {
        if (!this.pinecone) {
            console.warn('Pinecone not configured. Skipping embeddings.');
            return { summary: 'Pinecone not configured. Text saved in database only.' };
        }

        const { embedModel, chatModel } = this.getModelOptions();

        // 1. Generate Summary
        const summaryRes = await this.openai.chat.completions.create({
            model: chatModel,
            messages: [{
                role: 'user', 
                content: `Summarize this tax document/circular in 3 bullet points focusing on impact for Chartered Accountants:\n\n${textContext.substring(0, 3000)}`
            }]
        });
        const summary = summaryRes.choices[0].message.content || 'Summary generated.';

        // 2. Chunk & Embed
        try {
            const chunks = this.chunkText(textContext);
            const index = this.pinecone.index(this.indexName);
            
            const vectors = await Promise.all(chunks.map(async (chunk, i) => {
                // Warning: OpenRouter does not support embeddings. This requires OPENAI_API_KEY to be set.
                // If using OpenRouter, you must explicitly pass OPENAI_API_KEY for embeddings or use a free huggingface embedding API.
                // We assume OPENAI_API_KEY is available as requested.
                const embedRes = await this.openai.embeddings.create({
                    model: embedModel,
                    input: chunk,
                });
                return {
                    id: `${docId}-${i}`,
                    values: embedRes.data[0].embedding,
                    metadata: {
                        docId,
                        firmId,
                        text: chunk
                    }
                };
            }));

            // 3. Store in Pinecone
            await index.upsert(vectors as any);
        } catch (e: any) {
            console.error('Embedding failed (Requires OPENAI_API_KEY):', e.message);
        }

        return { summary };
    }

    /**
     * Answer a CA query using RAG + System Prompt
     */
    async chatWithAssistant(messages: any[], firmId: string, customDraftMode?: string) {
        let retrievalContext = '';
        
        // Use the last user message as query for RAG
        const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === 'user');

        if (this.pinecone && lastUserMessage) {
            try {
                const { embedModel } = this.getModelOptions();
                const embedRes = await this.openai.embeddings.create({
                    model: embedModel,
                    input: lastUserMessage.content,
                });
                
                const index = this.pinecone.index(this.indexName);
                const queryRes = await index.query({
                    vector: embedRes.data[0].embedding,
                    topK: 3,
                    includeMetadata: true,
                    filter: { firmId: { $eq: firmId } }
                });

                if (queryRes.matches.length > 0) {
                    retrievalContext = '\n\nRELEVANT CONTEXT FROM UPLOADED DOCUMENTS:\n' + 
                        queryRes.matches.map(m => m.metadata?.text).join('\n---\n');
                }
            } catch (e: any) {
                console.error('RAG query failed:', e.message);
            }
        }

        const modeInstruction = customDraftMode 
            ? `\n\nDRAFT MODE: Format the output as a professional ${customDraftMode}. Complete structural elements (Subject line, Salutation, Body, Sign-off).` 
            : `\n\nAlways answer strictly in this format (use bold headers and double line breaks):
**Section:** [Relevant Section/Rule]

**Explanation:** [Short explanation of the provision]

**Example:** [Practical example]

**Risk/Note:** [Warning or compliance risk]`;

        const systemPrompt = `You are an expert Indian Chartered Accountant and tax assistant.
Knowledge domain: Income Tax Act (1961), GST Act (2017), Companies Act, TDS, and general Indian compliance.
${modeInstruction}${retrievalContext}`;

        const finalMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const { chatModel } = this.getModelOptions();
        const res = await this.openai.chat.completions.create({
            model: chatModel,
            messages: finalMessages,
            temperature: 0.2,
        });

        return res.choices[0].message.content;
    }
}

export const assistantAiService = new AssistantAiService();
