import { Schema, Types, Query, Aggregate } from 'mongoose';
import { getFirmId } from './context';

export const tenantPlugin = (schema: Schema) => {
    // Only apply to schemas that have a firmId field
    if (!schema.path('firmId')) {
        return;
    }

    // Middleware to automatically filter by firmId for Read operations
    const queryMethods = [
        /^find/,
        'countDocuments',
        'estimatedDocumentCount',
        'updateOne',
        'updateMany',
        'deleteOne',
        'deleteMany',
        'findOneAndUpdate',
        'findOneAndDelete',
        'findOneAndReplace'
    ];

    schema.pre(queryMethods as any, function (this: Query<any, any>) {
        const firmId = getFirmId();
        const filter = this.getFilter();

        // Skip if firmId is already set or if explicitly excluded by ID search
        if (filter.hasOwnProperty('firmId') || filter.hasOwnProperty('_id')) {
            return;
        }

        if (firmId) {
            this.where({ firmId });
        } else {
            // SECURITY: Blocking queries if context is missing for isolated models
            console.warn(`[TenantPlugin] Security block: Missing firmId for model ${this.model.modelName}.`);
            this.where({ _id: null });
        }
    });

    schema.pre('aggregate', function (this: Aggregate<any>) {
        const firmId = getFirmId();
        if (firmId) {
            // Unshift match to the beginning of the pipeline
            this.pipeline().unshift({ $match: { firmId: new Types.ObjectId(firmId) } });
        } else {
            console.warn(`[TenantPlugin] Security block: Missing firmId for aggregate.`);
            this.pipeline().unshift({ $match: { _id: null } });
        }
    });

    // Ensure firmId is set on creation/validation
    schema.pre('validate', function (this: any) {
        const firmId = getFirmId();
        if (firmId && !this.firmId) {
            this.firmId = new Types.ObjectId(firmId);
        }
    });
};
