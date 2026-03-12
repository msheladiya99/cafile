import { Schema, Types, Query, Aggregate } from 'mongoose';
import { getFirmId } from './context';

export const tenantPlugin = (schema: Schema) => {
    // Only apply to schemas that have a firmId field
    if (!schema.path('firmId')) {
        return;
    }

    // Middleware to automatically filter by firmId
    schema.pre(/^find/, function (this: Query<any, any>, next: any) {
        const firmId = getFirmId();
        const filter = this.getFilter();
        // Skip if firmId is already set or if explicitly excluded
        if (firmId && !filter.firmId) {
            this.where({ firmId });
        }
        next();
    });

    schema.pre('aggregate', function (this: Aggregate<any>, next: any) {
        const firmId = getFirmId();
        if (firmId) {
            this.pipeline().unshift({ $match: { firmId: new Types.ObjectId(firmId) } });
        }
        next();
    });

    // Handle save middleware to ensure firmId is set
    schema.pre('save', function (this: any, next: any) {
        const firmId = getFirmId();
        if (firmId && !this.firmId) {
            this.firmId = new Types.ObjectId(firmId);
        }
        next();
    });
};
