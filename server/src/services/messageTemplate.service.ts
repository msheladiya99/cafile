const tokenMap: Record<string, string[]> = {
    ClientName: ['ClientName', 'clientName', 'name'],
    DueDate: ['DueDate', 'dueDate'],
    ComplianceType: ['ComplianceType', 'complianceType', 'reminderType'],
    FirmName: ['FirmName', 'firmName'],
    DaysRemaining: ['DaysRemaining', 'daysRemaining'],
};

export function renderReminderTemplate(template: string, variables: Record<string, string | number | undefined>) {
    let output = template;

    for (const [canonical, aliases] of Object.entries(tokenMap)) {
        const value = variables[canonical] ?? aliases.map((alias) => variables[alias]).find((v) => v !== undefined);
        if (value === undefined) continue;
        output = output.replace(new RegExp(`\\{${canonical}\\}`, 'g'), String(value));
        output = output.replace(new RegExp(`\\{\\{${canonical}\\}\\}`, 'g'), String(value));
    }

    for (const [key, value] of Object.entries(variables)) {
        if (value === undefined) continue;
        output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }

    return output;
}

export const defaultTemplates = {
    normal: 'Dear {ClientName}, your {ComplianceType} is due on {DueDate}. Please share the required documents.',
    overdue: 'Urgent: Dear {ClientName}, your {ComplianceType} due on {DueDate} is overdue. Please respond immediately to avoid penalties.',
    missed: 'Alert: You may have missed your {ComplianceType} filing due on {DueDate}. Please contact our office urgently.',
};
