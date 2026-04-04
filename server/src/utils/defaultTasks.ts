/**
 * 30 Default CA Task Templates
 * ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
 * These are seeded into every new firm at creation time.
 * Grouped by category for automatic category creation.
 */

export interface DefaultTask {
    taskName: string;
    category: string;       // category name ΓÇö auto-created if not exists
    categoryColor: string;  // color for the category
    mode: string;
    frequency?: string;
    dueDays?: number;
    estimatedHours: number;
    recurringTask: boolean;
    typeOfClient: string[];
    description?: string;
    udin: boolean;
}

export const DEFAULT_TASK_CATEGORIES: { name: string; color: string }[] = [
    { name: 'Income Tax',          color: '#3b82f6' },
    { name: 'GST',                 color: '#10b981' },
    { name: 'Accounting',          color: '#8b5cf6' },
    { name: 'ROC / Company Law',   color: '#f59e0b' },
    { name: 'Audit',               color: '#ef4444' },
    { name: 'Other Compliance',    color: '#64748b' },
];

export const DEFAULT_TASKS: DefaultTask[] = [
    // ΓöÇΓöÇ Income Tax ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    {
        taskName: 'ITR Filing ΓÇö Individual',
        category: 'Income Tax', categoryColor: '#3b82f6',
        mode: 'Offline', frequency: 'Yearly', dueDays: 31,
        estimatedHours: 3, recurringTask: true,
        typeOfClient: ['Individual'],
        description: 'Prepare and file Income Tax Return for Individual clients.',
        udin: false,
    },
    {
        taskName: 'ITR Filing ΓÇö Business / Firm',
        category: 'Income Tax', categoryColor: '#3b82f6',
        mode: 'Offline', frequency: 'Yearly', dueDays: 31,
        estimatedHours: 5, recurringTask: true,
        typeOfClient: ['Firm', 'LLP'],
        description: 'Prepare and file ITR for Partnership Firm / LLP.',
        udin: false,
    },
    {
        taskName: 'ITR Filing ΓÇö Company',
        category: 'Income Tax', categoryColor: '#3b82f6',
        mode: 'Offline', frequency: 'Yearly', dueDays: 31,
        estimatedHours: 8, recurringTask: true,
        typeOfClient: ['Company'],
        description: 'Prepare and file ITR for Private / Public Limited Company.',
        udin: true,
    },
    {
        taskName: 'Advance Tax Computation',
        category: 'Income Tax', categoryColor: '#3b82f6',
        mode: 'Offline', frequency: 'Quarterly', dueDays: 15,
        estimatedHours: 2, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Calculate and pay advance tax for the quarter.',
        udin: false,
    },
    {
        taskName: 'TDS Return Filing (24Q / 26Q)',
        category: 'Income Tax', categoryColor: '#3b82f6',
        mode: 'Online', frequency: 'Quarterly', dueDays: 31,
        estimatedHours: 3, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Prepare and file TDS returns ΓÇö 24Q (salary) and 26Q (non-salary).',
        udin: false,
    },
    {
        taskName: 'Form 15CA / 15CB',
        category: 'Income Tax', categoryColor: '#3b82f6',
        mode: 'Online', dueDays: 7,
        estimatedHours: 2, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Certificate for foreign remittance under FEMA/Income Tax.',
        udin: true,
    },
    // ΓöÇΓöÇ GST ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    {
        taskName: 'GSTR-1 Filing',
        category: 'GST', categoryColor: '#10b981',
        mode: 'Online', frequency: 'Monthly', dueDays: 11,
        estimatedHours: 2, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'File outward supply details ΓÇö GSTR-1 by 11th of each month.',
        udin: false,
    },
    {
        taskName: 'GSTR-3B Filing',
        category: 'GST', categoryColor: '#10b981',
        mode: 'Online', frequency: 'Monthly', dueDays: 20,
        estimatedHours: 2, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'File monthly summary return GSTR-3B with tax payment.',
        udin: false,
    },
    {
        taskName: 'GSTR-9 Annual Return',
        category: 'GST', categoryColor: '#10b981',
        mode: 'Online', frequency: 'Yearly', dueDays: 31,
        estimatedHours: 6, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Annual GST return filing ΓÇö GSTR-9.',
        udin: false,
    },
    {
        taskName: 'GST Registration',
        category: 'GST', categoryColor: '#10b981',
        mode: 'Online', dueDays: 7,
        estimatedHours: 2, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'New GST registration for client.',
        udin: false,
    },
    {
        taskName: 'GST Reconciliation (GSTR-2B vs Books)',
        category: 'GST', categoryColor: '#10b981',
        mode: 'Offline', frequency: 'Monthly', dueDays: 20,
        estimatedHours: 3, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Reconcile ITC as per GSTR-2B with books of accounts.',
        udin: false,
    },
    {
        taskName: 'GST Notice Reply',
        category: 'GST', categoryColor: '#10b981',
        mode: 'Online', dueDays: 15,
        estimatedHours: 4, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Prepare and submit reply to GST department notices.',
        udin: false,
    },
    // ΓöÇΓöÇ Accounting ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    {
        taskName: 'Monthly Bookkeeping',
        category: 'Accounting', categoryColor: '#8b5cf6',
        mode: 'Offline', frequency: 'Monthly', dueDays: 10,
        estimatedHours: 4, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Record all transactions in Tally / accounting software.',
        udin: false,
    },
    {
        taskName: 'Bank Reconciliation Statement',
        category: 'Accounting', categoryColor: '#8b5cf6',
        mode: 'Offline', frequency: 'Monthly', dueDays: 10,
        estimatedHours: 2, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Reconcile bank statement with books of accounts.',
        udin: false,
    },
    {
        taskName: 'Finalization of Accounts',
        category: 'Accounting', categoryColor: '#8b5cf6',
        mode: 'Offline', frequency: 'Yearly', dueDays: 60,
        estimatedHours: 10, recurringTask: true,
        typeOfClient: ['Firm', 'Company', 'LLP'],
        description: 'Prepare final P&L, Balance Sheet and notes to accounts.',
        udin: false,
    },
    {
        taskName: 'Payroll Processing',
        category: 'Accounting', categoryColor: '#8b5cf6',
        mode: 'Offline', frequency: 'Monthly', dueDays: 5,
        estimatedHours: 2, recurringTask: true,
        typeOfClient: ['Firm', 'Company'],
        description: 'Process monthly payroll, salary slips, PF/ESI workings.',
        udin: false,
    },
    // ΓöÇΓöÇ ROC / Company Law ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    {
        taskName: 'Annual Return Filing (MGT-7)',
        category: 'ROC / Company Law', categoryColor: '#f59e0b',
        mode: 'Online', frequency: 'Yearly', dueDays: 60,
        estimatedHours: 4, recurringTask: true,
        typeOfClient: ['Company'],
        description: 'File MGT-7 (Annual Return) with ROC.',
        udin: false,
    },
    {
        taskName: 'Financial Statement Filing (AOC-4)',
        category: 'ROC / Company Law', categoryColor: '#f59e0b',
        mode: 'Online', frequency: 'Yearly', dueDays: 30,
        estimatedHours: 3, recurringTask: true,
        typeOfClient: ['Company'],
        description: 'File AOC-4 (Financial Statements) with ROC.',
        udin: false,
    },
    {
        taskName: 'ROC Compliance ΓÇö LLP (Form 8 & 11)',
        category: 'ROC / Company Law', categoryColor: '#f59e0b',
        mode: 'Online', frequency: 'Yearly', dueDays: 30,
        estimatedHours: 3, recurringTask: true,
        typeOfClient: ['LLP'],
        description: 'File Form 8 (Statement of Account) and Form 11 (Annual Return) for LLP.',
        udin: false,
    },
    {
        taskName: 'Company Incorporation',
        category: 'ROC / Company Law', categoryColor: '#f59e0b',
        mode: 'Online', dueDays: 15,
        estimatedHours: 6, recurringTask: false,
        typeOfClient: ['Company'],
        description: 'New Private Limited Company incorporation ΓÇö SPICe+ filing.',
        udin: false,
    },
    {
        taskName: 'Director KYC (DIR-3 KYC)',
        category: 'ROC / Company Law', categoryColor: '#f59e0b',
        mode: 'Online', frequency: 'Yearly', dueDays: 30,
        estimatedHours: 1, recurringTask: true,
        typeOfClient: ['Company', 'LLP'],
        description: 'Annual DIR-3 KYC filing for all directors / designated partners.',
        udin: false,
    },
    // ΓöÇΓöÇ Audit ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    {
        taskName: 'Tax Audit (Form 3CA-3CD / 3CB-3CD)',
        category: 'Audit', categoryColor: '#ef4444',
        mode: 'Offline', frequency: 'Yearly', dueDays: 30,
        estimatedHours: 16, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Conduct tax audit and file Form 3CA-CD / 3CB-CD.',
        udin: true,
    },
    {
        taskName: 'Statutory Audit',
        category: 'Audit', categoryColor: '#ef4444',
        mode: 'Offline', frequency: 'Yearly', dueDays: 60,
        estimatedHours: 20, recurringTask: true,
        typeOfClient: ['Company'],
        description: 'Statutory audit of company under Companies Act 2013.',
        udin: true,
    },
    {
        taskName: 'Internal Audit',
        category: 'Audit', categoryColor: '#ef4444',
        mode: 'Offline', frequency: 'Quarterly',
        estimatedHours: 8, recurringTask: true,
        typeOfClient: ['Company', 'Firm'],
        description: 'Internal audit of business processes and internal controls.',
        udin: false,
    },
    {
        taskName: 'GST Audit (GSTR-9C)',
        category: 'Audit', categoryColor: '#ef4444',
        mode: 'Online', frequency: 'Yearly', dueDays: 31,
        estimatedHours: 10, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Reconciliation statement and audit certification ΓÇö GSTR-9C.',
        udin: true,
    },
    // ΓöÇΓöÇ Other Compliance ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    {
        taskName: 'PF / ESIC Monthly Return',
        category: 'Other Compliance', categoryColor: '#64748b',
        mode: 'Online', frequency: 'Monthly', dueDays: 15,
        estimatedHours: 1, recurringTask: true,
        typeOfClient: ['Firm', 'Company'],
        description: 'Monthly PF ECR and ESIC return filing.',
        udin: false,
    },
    {
        taskName: 'Professional Tax (PT) Filing',
        category: 'Other Compliance', categoryColor: '#64748b',
        mode: 'Online', frequency: 'Monthly', dueDays: 15,
        estimatedHours: 1, recurringTask: true,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Monthly Professional Tax filing and payment.',
        udin: false,
    },
    {
        taskName: 'MSME Registration (Udyam)',
        category: 'Other Compliance', categoryColor: '#64748b',
        mode: 'Online', dueDays: 7,
        estimatedHours: 1, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Udyam Registration for Micro, Small and Medium Enterprises.',
        udin: false,
    },
    {
        taskName: 'Import Export Code (IEC) Registration',
        category: 'Other Compliance', categoryColor: '#64748b',
        mode: 'Online', dueDays: 7,
        estimatedHours: 2, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Apply for IEC from DGFT portal.',
        udin: false,
    },
    {
        taskName: 'Trademark Registration',
        category: 'Other Compliance', categoryColor: '#64748b',
        mode: 'Online', dueDays: 15,
        estimatedHours: 3, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'File trademark application on IP India portal.',
        udin: false,
    },
    {
        taskName: 'Notice / Assessment Reply (IT / GST)',
        category: 'Other Compliance', categoryColor: '#64748b',
        mode: 'Online', dueDays: 15,
        estimatedHours: 6, recurringTask: false,
        typeOfClient: ['Individual', 'Firm', 'Company'],
        description: 'Prepare and submit reply to Income Tax / GST department notices.',
        udin: false,
    },
];
