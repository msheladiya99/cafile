import mongoose from 'mongoose';
import { TaskMaster } from './src/models/TaskMaster';
import { TaskCategory } from './src/models/TaskCategory';
import { User } from './src/models/User';
import { Firm } from './src/models/Firm';
import { connectDB } from './src/config/database';
import dotenv from 'dotenv';

dotenv.config();

// ── Finexo Task Types ─────────────────────────────────────────────────────────
const TASK_TYPES = [
    // GST
    { taskName: 'GSTR-1 (Monthly)',         category: 'GST',          frequency: 'Monthly',   dueDays: 11  },
    { taskName: 'GSTR-1 (Quarterly)',        category: 'GST',          frequency: 'Quarterly', dueDays: 13  },
    { taskName: 'GSTR-1A (Monthly)',         category: 'GST',          frequency: 'Monthly',   dueDays: 5   },
    { taskName: 'GSTR-1A (Quarterly)',       category: 'GST',          frequency: 'Quarterly', dueDays: 5   },
    { taskName: 'GSTR-3B (Monthly)',         category: 'GST',          frequency: 'Monthly',   dueDays: 20  },
    { taskName: 'GSTR-3B (Quarterly)',       category: 'GST',          frequency: 'Quarterly', dueDays: 22  },
    { taskName: 'GSTR-4',                   category: 'GST',          frequency: 'Yearly',    dueDays: 91  },
    { taskName: 'GSTR-6',                   category: 'GST',          frequency: 'Monthly',   dueDays: 10  },
    { taskName: 'GSTR-7',                   category: 'GST',          frequency: 'Monthly',   dueDays: 10  },
    { taskName: 'GSTR-8',                   category: 'GST',          frequency: 'Monthly',   dueDays: 10  },
    { taskName: 'GSTR-9',                   category: 'GST',          frequency: 'Yearly',    dueDays: 275 },
    { taskName: 'GSTR-9C',                  category: 'GST',          frequency: 'Yearly',    dueDays: 275 },
    { taskName: 'CMP-08',                   category: 'GST',          frequency: 'Quarterly', dueDays: 18  },
    { taskName: 'IFF',                      category: 'GST',          frequency: 'Monthly',   dueDays: 11  },
    { taskName: 'PMT-06',                   category: 'GST',          frequency: 'Monthly',   dueDays: 25  },

    // Income Tax
    { taskName: 'Advance Tax',              category: 'Income Tax',   frequency: 'Quarterly', dueDays: -16 },
    { taskName: 'Advance Tax - One Instalment', category: 'Income Tax', frequency: 'Yearly',  dueDays: -16 },
    { taskName: 'ITR - Unaudited',          category: 'Income Tax',   frequency: 'Yearly',    dueDays: 122 },
    { taskName: 'ITR - Income Tax Audit',   category: 'Income Tax',   frequency: 'Yearly',    dueDays: 214 },
    { taskName: 'ITR - Stat Audit',         category: 'Income Tax',   frequency: 'Yearly',    dueDays: 214 },
    { taskName: 'TDS Return - Salary',      category: 'Income Tax',   frequency: 'Quarterly', dueDays: 31  },
    { taskName: 'TDS Return - Non Salary',  category: 'Income Tax',   frequency: 'Quarterly', dueDays: 31  },
    { taskName: 'TDS Return - Non Resident',category: 'Income Tax',   frequency: 'Quarterly', dueDays: 31  },
    { taskName: 'TCS Return',               category: 'Income Tax',   frequency: 'Quarterly', dueDays: 31  },
    { taskName: 'SFT',                      category: 'Income Tax',   frequency: 'Yearly',    dueDays: 61  },

    // MCA
    { taskName: 'AOC-4',                   category: 'MCA',          frequency: 'Yearly',    dueDays: 213 },
    { taskName: 'MGT-7',                   category: 'MCA',          frequency: 'Yearly',    dueDays: 243 },
    { taskName: 'DPT-3',                   category: 'MCA',          frequency: 'Yearly',    dueDays: 91  },
    { taskName: 'Form 11',                 category: 'MCA',          frequency: 'Yearly',    dueDays: 61  },
    { taskName: 'Form 8',                  category: 'MCA',          frequency: 'Yearly',    dueDays: 214 },
];

const CATEGORY_COLORS: Record<string, string> = {
    'GST':        '#10b981',
    'Income Tax': '#3b82f6',
    'MCA':        '#8b5cf6',
};

async function seed() {
    await connectDB();
    console.log('✅ Connected to DB');

    // 1. Find the firm
    const firm = await Firm.findOne({});
    if (!firm) { console.error('❌ No firm found'); process.exit(1); }
    console.log(`📍 Firm: ${firm.firmName} (${firm._id})`);

    // 2. Find admin user for this firm
    const admin = await User.findOne({ firmId: firm._id, role: { $in: ['ADMIN', 'MANAGER'] } });
    if (!admin) { console.error('❌ No admin user found for firm'); process.exit(1); }
    console.log(`👤 Admin: ${admin.name} (${admin._id})`);

    // 3. Create categories if they don't exist
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    const categoryNames = [...new Set(TASK_TYPES.map(t => t.category))];

    for (const catName of categoryNames) {
        let cat = await TaskCategory.findOne({ name: catName, firmId: firm._id });
        if (!cat) {
            cat = new TaskCategory({
                name: catName,
                color: CATEGORY_COLORS[catName] || '#667eea',
                firmId: firm._id,
                createdBy: admin._id,
                status: 'Active'
            });
            await cat.save();
            console.log(`  ✅ Created category: ${catName}`);
        } else {
            console.log(`  ♻️  Category exists: ${catName}`);
        }
        categoryMap[catName] = cat._id as mongoose.Types.ObjectId;
    }

    // 4. Create TaskMasters for each task type
    let created = 0;
    let skipped = 0;

    for (const t of TASK_TYPES) {
        // Check if already exists
        const exists = await TaskMaster.findOne({ taskName: t.taskName, firmId: firm._id });
        if (exists) {
            console.log(`  ⏭️  Skip (exists): ${t.taskName}`);
            skipped++;
            continue;
        }

        const tm = new TaskMaster({
            taskName: t.taskName,
            mode: 'Recurrence',
            category: categoryMap[t.category],
            department: t.category === 'MCA' ? 'Compliance' : t.category === 'Income Tax' ? 'Income Tax' : 'GST',
            frequency: t.frequency,
            firmId: firm._id,
            createdBy: admin._id,
            status: 'Active',
            udin: false,
            billingAmount: 0,
            estimatedHours: 1,
            subtasks: []
        });
        await tm.save();
        console.log(`  ✅ Created: ${t.taskName} [${t.category} | ${t.frequency}]`);
        created++;
    }

    console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
