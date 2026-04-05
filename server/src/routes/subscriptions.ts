import express from 'express';
import mongoose from 'mongoose';
import { Plan } from '../models/Plan';
import { Addon } from '../models/Addon';
import { Firm } from '../models/Firm';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authenticate as authenticateUser } from '../middleware/auth';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

// GET all active plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true, isCustom: false }).sort({ yearlyPrice: 1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching plans' });
    }
});

// GET custom plan for firm
router.get('/plans/custom', authenticateUser, async (req, res) => {
    try {
        const firmId = (req as any).user.firmId;
        if (!firmId) return res.status(400).json({ message: 'No firm associated' });

        const customPlan = await Plan.findOne({ isCustom: true, isActive: true, customFirmId: firmId });
        res.json(customPlan);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching custom plan' });
    }
});

// GET all active addons
router.get('/addons', async (req, res) => {
    try {
        const addons = await Addon.find({ isActive: true });
        res.json(addons);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching addons' });
    }
});

// CREATE Subscription Order (Mocked)
router.post('/create-subscription', authenticateUser, async (req, res) => {
    try {
        const { planId, addons } = req.body;
        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        // In a real app we'd create a Razorpay subscription (Plan + Addons)
        // Mock Response:
        
        // Mock standard order so frontend Razorpay flow works
        const amount = plan.yearlyPrice; // In real life, calculate base + addons
        
        const options = {
            amount: amount * 100, // amount in smallest currency unit
            currency: 'INR',
            receipt: 'receipt_order_' + Date.now(),
        };

        let order;
        if (process.env.RAZORPAY_KEY_ID) {
            order = await razorpay.orders.create(options);
        } else {
            // Mock Order
            order = {
                id: 'order_mock_' + Date.now(),
                amount: options.amount,
                currency: 'INR'
            };
        }

        res.json({ order, key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating subscription' });
    }
});

// Verify Payment and update Firm
router.post('/verify-payment', authenticateUser, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId, addonsJson } = req.body;
        
        let isValid = true;
        
        // Real verification if env exists
        if (process.env.RAZORPAY_KEY_SECRET) {
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                            .update(body.toString())
                                            .digest('hex');
            if(expectedSignature !== razorpay_signature) {
                isValid = false;
            }
        }

        if (!isValid) return res.status(400).json({ message: 'Invalid payment signature' });

        const firmId = (req as any).user.firmId;
        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const firm = await Firm.findById(firmId);
        if (!firm) return res.status(404).json({ message: 'Firm not found' });

        // Set Subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        firm.subscription = {
            planId: plan._id as mongoose.Types.ObjectId,
            status: 'active',
            startDate,
            endDate,
            razorpaySubscriptionId: razorpay_order_id
        };
        firm.plan = plan.name; // Keep ref sync

        // Save Addons
        if (addonsJson) {
            const parsedAddons = JSON.parse(addonsJson);
            firm.addons = []; // Clear old or append? For now let's just set
            for (let a of parsedAddons) {
                firm.addons.push({
                    addonId: a.addonId,
                    quantity: a.quantity || 1,
                    purchaseDate: startDate,
                    expiryDate: endDate
                });
            }
        }

        await firm.save();

        res.json({ message: 'Subscription successfully activated!', firm });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying payment' });
    }
});

export default router;
