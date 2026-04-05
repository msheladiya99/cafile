import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Plan } from './models/Plan';
import { Addon } from './models/Addon';
import { connectDB } from './config/database';

dotenv.config();

const defaultPlans = [
    {
        name: 'Starter',
        yearlyPrice: 0,
        limits: { clients: 10, staff: 1, storageGB: 0 },
        features: {
            clientManagement: true, manualTask: true, autoTask: false, advancedAutoTask: false,
            billing: false, advancedBilling: false, cloudStorage: false, dscTracking: false,
            autoDscTracking: false, reminderAutomation: false, whatsappAPI: false, smsReminder: false,
            clientPortal: false, roleBasedAccess: false, dedicatedDatabase: false, prioritySupport: false
        },
        isActive: true,
        isCustom: false
    },
    {
        name: 'Professional',
        yearlyPrice: 4999,
        limits: { clients: 300, staff: 2, storageGB: 0 },
        features: {
            clientManagement: true, manualTask: true, autoTask: true, advancedAutoTask: false,
            billing: true, advancedBilling: false, cloudStorage: false, dscTracking: true,
            autoDscTracking: false, reminderAutomation: true, whatsappAPI: false, smsReminder: false,
            clientPortal: true, roleBasedAccess: false, dedicatedDatabase: false, prioritySupport: false
        },
        isActive: true,
        isCustom: false
    },
    {
        name: 'Enterprise',
        yearlyPrice: 6999,
        limits: { clients: 1000, staff: 10, storageGB: 0 },
        features: {
            clientManagement: true, manualTask: true, autoTask: true, advancedAutoTask: true,
            billing: true, advancedBilling: true, cloudStorage: false, dscTracking: true,
            autoDscTracking: true, reminderAutomation: true, whatsappAPI: true, smsReminder: true,
            clientPortal: true, roleBasedAccess: true, dedicatedDatabase: true, prioritySupport: true
        },
        isActive: true,
        isCustom: false
    },
    {
        name: 'Pro Cloud',
        yearlyPrice: 6499,
        limits: { clients: 500, staff: 5, storageGB: 100 },
        features: {
            clientManagement: true, manualTask: true, autoTask: true, advancedAutoTask: false,
            billing: true, advancedBilling: true, cloudStorage: true, dscTracking: true,
            autoDscTracking: false, reminderAutomation: true, whatsappAPI: true, smsReminder: false,
            clientPortal: true, roleBasedAccess: false, dedicatedDatabase: false, prioritySupport: false
        },
        isActive: true,
        isCustom: false
    },
    {
        name: 'Enterprise Cloud',
        yearlyPrice: 9999,
        limits: { clients: 1000, staff: 10, storageGB: 300 },
        features: {
            clientManagement: true, manualTask: true, autoTask: true, advancedAutoTask: true,
            billing: true, advancedBilling: true, cloudStorage: true, dscTracking: true,
            autoDscTracking: true, reminderAutomation: true, whatsappAPI: true, smsReminder: true,
            clientPortal: true, roleBasedAccess: true, dedicatedDatabase: true, prioritySupport: true
        },
        isActive: true,
        isCustom: false
    },
    {
        name: 'Custom',
        yearlyPrice: 0,
        limits: { clients: 0, staff: 0, storageGB: 0 },
        features: {
            clientManagement: true, manualTask: true, autoTask: false, advancedAutoTask: false,
            billing: false, advancedBilling: false, cloudStorage: false, dscTracking: false,
            autoDscTracking: false, reminderAutomation: false, whatsappAPI: false, smsReminder: false,
            clientPortal: false, roleBasedAccess: false, dedicatedDatabase: false, prioritySupport: false
        },
        isActive: false, /* manually activated on use */
        isCustom: true
    }
];

const addons = [
    { name: 'Extra Cloud Storage (50GB)', description: '+50GB Storage', type: 'STORAGE', yearlyPrice: 2000, value: 50, isActive: true },
    { name: 'Extra Cloud Storage (100GB)', description: '+100GB Storage', type: 'STORAGE', yearlyPrice: 3500, value: 100, isActive: true },
    { name: 'Personal Database (MongoDB)', description: 'Dedicated DB Connection', type: 'DATABASE', yearlyPrice: 5000, isActive: true },
    { name: 'WhatsApp API Integration', description: 'WhatsApp notifications', type: 'WHATSAPP', yearlyPrice: 2999, isActive: true },
    { name: 'Advanced Reports', description: 'Advanced Reporting capabilities', type: 'REPORTS', yearlyPrice: 1999, isActive: true },
    { name: 'DSC Bulk Management', description: 'Manage DSCs in bulk', type: 'DSC', yearlyPrice: 1499, isActive: true },
];

const run = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Delete old plans and addons
        await Plan.deleteMany({});
        await Addon.deleteMany({});

        // Insert new
        await Plan.insertMany(defaultPlans);
        await Addon.insertMany(addons);

        console.log('Seeded plans and addons successfully');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
