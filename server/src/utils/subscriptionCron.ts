import cron from 'node-cron';
import { Firm } from '../models/Firm';
import { sendEmail } from './email';

export const startSubscriptionCronJob = () => {
    // Run daily at midnight 
    cron.schedule('0 0 * * *', async () => {
        console.log('Running subscription cron job...');
        try {
            const firms = await Firm.find({ status: 'active', 'subscription.endDate': { $exists: true } });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const firm of firms) {
                if (firm.subscription && firm.subscription.endDate) {
                    const endDate = new Date(firm.subscription.endDate);
                    endDate.setHours(0, 0, 0, 0);

                    const timeDiff = endDate.getTime() - today.getTime();
                    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    if (daysDiff === 7) {
                        await sendEmail(
                            firm.email,
                            'Action Required: Your Subscription expires in 7 days',
                            `<h2>Subscription Reminder</h2>
                                   <p>Dear ${firm.firmName},</p>
                                   <p>Your MyCAFile subscription will expire in 7 days. Please renew your plan to avoid interruption of services.</p>`
                        );
                    } else if (daysDiff === 1) {
                         await sendEmail(
                            firm.email,
                            'URGENT: Your Subscription expires TOMORROW',
                            `<h2>Subscription Reminder</h2>
                                   <p>Dear ${firm.firmName},</p>
                                   <p>Your MyCAFile subscription will expire tomorrow. Renew immediately to prevent account restrictions.</p>`
                        );
                    } else if (daysDiff === 0 || daysDiff < 0) {
                        if (firm.subscription.status !== 'expired') {
                            firm.subscription.status = 'expired';
                            // Restrict them to minimal plan or just expire
                            await firm.save();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error running subscription cron:', error);
        }
    });
};
