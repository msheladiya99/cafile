import cron from 'node-cron';
import mongoose from 'mongoose';
import { TaskApplicability } from '../models/TaskApplicability';
import { TaskMaster } from '../models/TaskMaster';
import { Task } from '../models/Task';

export const generateTasks = async () => {
    console.log('[TaskCron] Starting automated recurring task generation...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all active applicabilities where startDate is in the past or today
        const applicabilities = await TaskApplicability.find({
            status: 'Active',
            startDate: { $lte: today },
        });

        let generatedCount = 0;

        for (const app of applicabilities) {
            // Determine if a task needs to be generated
            const lastGen = app.lastGeneratedDate ? new Date(app.lastGeneratedDate) : null;
            if (lastGen) lastGen.setHours(0, 0, 0, 0);
            
            const start = new Date(app.startDate);
            start.setHours(0, 0, 0, 0);

            const getNextDate = (date: Date, freq: string) => {
                const next = new Date(date);
                switch (freq.toLowerCase()) {
                    case 'daily': next.setDate(next.getDate() + 1); break;
                    case 'weekly': next.setDate(next.getDate() + 7); break;
                    case 'fortnightly': next.setDate(next.getDate() + 14); break;
                    case 'monthly': next.setMonth(next.getMonth() + 1); break;
                    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
                    case 'half yearly': next.setMonth(next.getMonth() + 6); break;
                    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
                    default: next.setFullYear(next.getFullYear() + 100);
                }
                return next;
            };

            let currentGenDate = lastGen ? new Date(lastGen) : new Date(start);
            let tasksToGenerateDates: Date[] = [];

            if (!lastGen) {
                if (today >= currentGenDate) {
                    tasksToGenerateDates.push(new Date(currentGenDate));
                }
            } else {
                let nextGen = getNextDate(currentGenDate, app.frequency);
                let loopCount = 0;
                while (today >= nextGen && loopCount < 50) {
                    tasksToGenerateDates.push(new Date(nextGen));
                    currentGenDate = nextGen;
                    nextGen = getNextDate(currentGenDate, app.frequency);
                    loopCount++;
                }
            }

            if (tasksToGenerateDates.length > 0) {
                const master = await TaskMaster.findById(app.taskMasterId);
                if (!master || master.status !== 'Active') continue;

                let assignedTo: mongoose.Types.ObjectId[] = [];
                if (master.workingUser) {
                    assignedTo.push(master.workingUser);
                } else if (master.users && master.users.length > 0) {
                    assignedTo = master.users;
                }

                for (const genDate of tasksToGenerateDates) {
                    // Idempotency check: see if a task for this specific cycle date already exists
                    const existingTask = await Task.findOne({
                        taskMasterId: master._id,
                        clientId: app.clientId,
                        clientGroupId: app.clientGroupId,
                        firmId: app.firmId,
                        startDate: genDate,
                    });

                    if (existingTask) continue; // Already generated

                    const dueDate = new Date(genDate);
                    dueDate.setDate(dueDate.getDate() + (master.dueDays || 0));

                    const checklist = (master.subtasks || []).map((st) => ({
                        id: new mongoose.Types.ObjectId().toHexString(),
                        text: st.name,
                        completed: false,
                    }));

                    const newTask = new Task({
                        title: master.taskName,
                        description: master.description,
                        category: 'CLIENT_WORK',
                        createdBy: app.createdBy,
                        assignedTo: assignedTo,
                        clientId: app.clientId,
                        clientGroupId: app.clientGroupId,
                        billingType: app.clientId ? 'SINGLE_CLIENT' : (app.clientGroupId ? 'GROUP' : 'SINGLE_CLIENT'),
                        firmId: app.firmId,
                        multiFirmId: master.multiFirmId,
                        billingAmount: master.billingAmount,
                        status: 'PENDING',
                        priority: 'MEDIUM',
                        targetDate: dueDate,
                        startDate: genDate,
                        estimatedHours: master.estimatedHours || 1,
                        checklist: checklist,
                        taskMasterId: master._id,
                        frequency: app.frequency,
                        department: master.department,
                        reportingManager: master.reportingManager,
                        tags: master.tags || []
                    });

                    await newTask.save();
                    generatedCount++;
                }
                
                // Update applicability to the last date we processed
                app.lastGeneratedDate = tasksToGenerateDates[tasksToGenerateDates.length - 1];
                await app.save();
            }
        }

        console.log(`[TaskCron] Completed. Generated ${generatedCount} recurring tasks.`);
    } catch (error) {
        console.error('[TaskCron] Error generating tasks:', error);
    }
};

export const startTaskCronJob = () => {
    // Run at 1:00 AM every day
    cron.schedule('0 1 * * *', async () => {
        await generateTasks();
    });
    
    // Also run once on startup after a delay
    setTimeout(() => {
        generateTasks();
    }, 15000);
    
    console.log('[TaskCron] Scheduled task generation job.');
};
