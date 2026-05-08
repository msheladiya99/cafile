import { Request, Response, NextFunction } from 'express';
import { sendSlackAlert } from '../utils/slackNotifier';
import { logger } from '../utils/logger';

export const slackErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log the error locally
    logger.error(`API Error: ${err.message}`, { 
        endpoint: req.originalUrl, 
        method: req.method, 
        stack: err.stack 
    });

    // Send Slack Notification
    sendSlackAlert(err, req).catch(console.error);

    // Determine status code
    const statusCode = err.status || err.statusCode || 500;
    
    // Send response
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
