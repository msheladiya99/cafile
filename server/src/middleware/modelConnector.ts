import { Request, Response, NextFunction } from 'express';
import { getTenantModel, rawUserSchema } from '../services/dbManager';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { File } from '../models/File';
import { Task } from '../models/Task';
import { ActivityLog } from '../models/ActivityLog';
import { ClientGroup } from '../models/ClientGroup';
import { ITStatus } from '../models/ITStatus';
import { SubMaster } from '../models/SubMaster';
import Reminder from '../models/Reminder';
import Invoice from '../models/Invoice';
import { TaskMaster } from '../models/TaskMaster';
import { TaskCategory } from '../models/TaskCategory';
import { TaskApplicability } from '../models/TaskApplicability';
import Attendance from '../models/Attendance';
import Settings from '../models/Settings';
import { FirmMaster } from '../models/FirmMaster';
import { FirmDocument } from '../models/FirmDocument';
import { MultiFirm } from '../models/MultiFirm';
import { TaxDetail } from '../models/TaxDetail';
import { Currency } from '../models/Currency';
import { DSC } from '../models/DSC';
import EmailTemplate from '../models/EmailTemplate';
import { Expense } from '../models/Expense';
import { ExpenseSettlement } from '../models/ExpenseSettlement';
import Service from '../models/Service';


/**
 * Middleware that attaches tenant-aware models to the request object.
 * This ensures that personal DB tenants interact with their own MongoDB cluster.
 */
export const modelConnector = (req: any, res: Response, next: NextFunction) => {
    req.models = {
        // Special case: User usually avoids tenantPlugin in personal DB context
        User: getTenantModel(req, 'User', User, rawUserSchema),
        Client: getTenantModel(req, 'Client', Client),
        File: getTenantModel(req, 'File', File),
        Task: getTenantModel(req, 'Task', Task),
        ActivityLog: getTenantModel(req, 'ActivityLog', ActivityLog),
        ClientGroup: getTenantModel(req, 'ClientGroup', ClientGroup),
        ITStatus: getTenantModel(req, 'ITStatus', ITStatus),
        SubMaster: getTenantModel(req, 'SubMaster', SubMaster),
        Reminder: getTenantModel(req, 'Reminder', Reminder),
        Invoice: getTenantModel(req, 'Invoice', Invoice),
        TaskMaster: getTenantModel(req, 'TaskMaster', TaskMaster),
        TaskCategory: getTenantModel(req, 'TaskCategory', TaskCategory),
        TaskApplicability: getTenantModel(req, 'TaskApplicability', TaskApplicability),
        Attendance: getTenantModel(req, 'Attendance', Attendance),
        Settings: getTenantModel(req, 'Settings', Settings),
        FirmMaster: getTenantModel(req, 'FirmMaster', FirmMaster),
        FirmDocument: getTenantModel(req, 'FirmDocument', FirmDocument),
        MultiFirm: getTenantModel(req, 'MultiFirm', MultiFirm),
        TaxDetail: getTenantModel(req, 'TaxDetail', TaxDetail),
        Currency: getTenantModel(req, 'Currency', Currency),
        DSC: getTenantModel(req, 'DSC', DSC),
        EmailTemplate: getTenantModel(req, 'EmailTemplate', EmailTemplate),
        Expense: getTenantModel(req, 'Expense', Expense),
        ExpenseSettlement: getTenantModel(req, 'ExpenseSettlement', ExpenseSettlement),
        Service: getTenantModel(req, 'Service', Service),
    };


    next();
};
