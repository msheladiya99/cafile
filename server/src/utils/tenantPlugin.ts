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
        const filter = this.getFilter() || {};

        // Skip if firmId is already set or if explicitly searching by ID (findById)
        // We use a more robust check here as mongoose filters can be complex
        if (
            'firmId' in filter || 
            '_id' in filter || 
            (filter as any).$and?.some((cond: any) => 'firmId' in cond || '_id' in cond)
        ) {
            return;
        }

        if (firmId) {
            if (firmId === 'ROOT') {
                // Root records have firmId: null
                this.where({ firmId: null });
            } else {
                this.where({ firmId });
            }
        } else {
            // SECURITY: Blocking queries if context is missing for isolated models
            console.warn(`[TenantPlugin] Security block: Missing firmId for model ${this.model.modelName}.`);
            this.where({ _id: null });
        }
    });

    schema.pre('aggregate', function (this: Aggregate<any>) {
        const firmId = getFirmId();
        if (firmId) {
            const matchValue = firmId === 'ROOT' ? null : new Types.ObjectId(firmId);
            this.pipeline().unshift({ $match: { firmId: matchValue } });
        } else {
            console.warn(`[TenantPlugin] Security block: Missing firmId for aggregate.`);
            this.pipeline().unshift({ $match: { _id: null } });
        }
    });

    // Ensure firmId is set on creation/validation
    schema.pre('validate', function (this: any) {
        const firmId = getFirmId();
        if (firmId && !this.firmId) {
            if (firmId === 'ROOT') {
                this.firmId = null;
            } else {
                this.firmId = new Types.ObjectId(firmId);
            }
        }
    });
};
