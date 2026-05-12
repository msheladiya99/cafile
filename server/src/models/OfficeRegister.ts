import mongoose, { Document, Schema } from 'mongoose';

export interface IOfficeRegister extends Document {
    firmId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    documentType: string;
    description: string;
    receivedByName: string;
    returnDate: Date;
    remarks?: string;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const officeRegisterSchema = new Schema<IOfficeRegister>({
    firmId: {
        type: Schema.Types.ObjectId,
        ref: 'Firm',
        required: true,
        index: true
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true
    },
    documentType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    receivedByName: {
        type: String,
        required: true,
        trim: true
    },
    returnDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    remarks: {
        type: String,
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

officeRegisterSchema.index({ firmId: 1, clientId: 1 });
officeRegisterSchema.index({ firmId: 1, returnDate: -1 });

export const OfficeRegister = mongoose.model<IOfficeRegister>('OfficeRegister', officeRegisterSchema);
