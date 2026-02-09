import { Router, Response } from 'express';
import { File } from '../models/File';
import mongoose from 'mongoose';
import { AuthRequest, authenticate, requireClient } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// All client routes require authentication and client role
router.use(authenticate, requireClient);

// Get client's files
router.get('/files', async (req: AuthRequest, res: Response) => {
    try {
        const { year, category } = req.query;

        // Client can only see their own files
        const query: any = { clientId: req.user!.clientId };
        if (year) query.year = year;
        if (category) query.category = category;

        const files = await File.find(query)
            .select('-filePath') // Don't expose file path to client
            .sort({ uploadedAt: -1 });

        res.json(files);
    } catch (error) {
        console.error('Get client files error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available years
router.get('/years', async (req: AuthRequest, res: Response) => {
    try {
        const years = await File.distinct('year', { clientId: req.user!.clientId });
        res.json(years.sort().reverse());
    } catch (error) {
        console.error('Get years error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download file
router.get('/download/:fileId', async (req: AuthRequest, res: Response) => {
    try {
        const { fileId } = req.params;

        const file = await File.findById(fileId);
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Verify client owns this file
        if (file.clientId.toString() !== req.user!.clientId) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        // Check if file exists
        if (!fs.existsSync(file.filePath)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }

        // Get file extension
        const ext = path.extname(file.originalFileName).toLowerCase();

        // Set content type based on file extension
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') {
            contentType = 'application/pdf';
        } else if (ext === '.xlsx' || ext === '.xls') {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (ext === '.docx' || ext === '.doc') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        // Set content type header
        res.setHeader('Content-Type', contentType);

        // Send file with correct filename
        res.download(file.filePath, file.fileName);
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get file categories with counts
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const stats = await File.aggregate([
            { $match: { clientId: new mongoose.Types.ObjectId(req.user!.clientId) } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
