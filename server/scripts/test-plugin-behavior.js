const mongoose = require('mongoose');
const { AsyncLocalStorage } = require('async_hooks');
require('dotenv').config();

// Simulation of the context and plugin
const requestContext = new AsyncLocalStorage();
const getFirmId = () => requestContext.getStore()?.firmId;

const tenantPlugin = (schema) => {
    schema.pre(/^find/, function() {
        const firmId = getFirmId();
        if (firmId) {
            console.log(`[SIM] Applying firmId: ${firmId} to ${this.model.modelName}`);
            this.where({ firmId });
        }
    });
};

async function testPlugin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Register model with plugin
        const MultiFirmSchema = new mongoose.Schema({ firmId: mongoose.Schema.Types.ObjectId, firmName: String });
        MultiFirmSchema.plugin(tenantPlugin);
        const MultiFirm = mongoose.model('TestMultiFirm', MultiFirmSchema, 'multifirms');

        // Test with paresh-co ID
        const pareshId = '69b6a4cb3d59e2a4de5e11e2';
        console.log(`Testing with firmId: ${pareshId}`);
        
        await requestContext.run({ firmId: pareshId }, async () => {
            const results = await MultiFirm.find().lean();
            console.log(`Results found: ${results.length}`);
            results.forEach(r => console.log(` - ${r.firmName} | FirmId: ${r.firmId}`));
        });

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

testPlugin();
