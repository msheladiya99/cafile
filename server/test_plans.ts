import dotenv from 'dotenv';
import { Firm } from './src/models/Firm.js';
import { connectDB } from './src/config/database.js';

dotenv.config();

async function main() {
    await connectDB();
    
    // Migrate existing firms
    await Firm.updateMany({ plan: 'Free' }, { $set: { plan: 'Starter' } });
    await Firm.updateMany({ plan: 'Basic' }, { $set: { plan: 'Professional' } });
    await Firm.updateMany({ plan: 'Standard' }, { $set: { plan: 'Enterprise' } });
    await Firm.updateMany({ plan: 'Pro' }, { $set: { plan: 'Pro Cloud' } });
    await Firm.updateMany({ plan: 'Enterprise' }, { $set: { plan: 'Enterprise Cloud' } });
    
    const firms = await Firm.find({});
    console.log("FIRMS UPDATED. CURRENT PLANS:");
    firms.forEach(f => {
        console.log(`- ${f.firmName} (subdomain: ${f.subdomain}): Plan = ${f.plan}`);
    });
    
    process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
