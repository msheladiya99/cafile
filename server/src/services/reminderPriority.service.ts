export type ReminderPriority = 'LOW' | 'MEDIUM' | 'HIGH';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function diffDays(target: Date, base = new Date()) {
    return Math.ceil((startOfDay(target).getTime() - startOfDay(base).getTime()) / DAY_MS);
}

export function calculateReminderPriority(dueDate: Date, base = new Date()): ReminderPriority {
    const daysUntilDue = diffDays(dueDate, base);
    if (daysUntilDue <= 2) return 'HIGH';
    if (daysUntilDue <= 7) return 'MEDIUM';
    return 'LOW';
}
