import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ─── Redis connection (shared) ────────────────────────────────────────────────

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// ─── Queue ────────────────────────────────────────────────────────────────────

export const parseQueue = new Queue('bank-statement-parsing', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50  },
    },
});

// ─── Progress store (in-memory, cleared by SSE consumers) ────────────────────
// Maps statementId → latest progress event
// This is shared in the same process since parse.worker.ts is imported into server.ts

export interface ProgressEvent {
    step:     string;
    label:    string;
    progress: number;   // 0–100
    timestamp: number;
}

const progressStore = new Map<string, ProgressEvent[]>();

export function pushProgress(statementId: string, event: ProgressEvent): void {
    const existing = progressStore.get(statementId) || [];
    existing.push(event);
    progressStore.set(statementId, existing);
}

export function drainProgress(statementId: string): ProgressEvent[] {
    const events = progressStore.get(statementId) || [];
    progressStore.delete(statementId);
    return events;
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

export const enqueueParsingTask = async (data: {
    statementId:      string;
    firmId:           string;
    clientId:         string;
    fileBufferBase64: string;   // kept for API compat, worker reads from Drive
    fileName:         string;
    mimeType:         string;
}) => {
    const job = await parseQueue.add('process-statement', data, {
        jobId: `stmt_${data.statementId}`,  // idempotent job ID
    });
    return job;
};
