import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
    employee: mongoose.Types.ObjectId;
    date: Date;
    inTime?: string;
    outTime?: string;
    description?: string;
    status?: string;
    workHours?: string;
    breakTime?: string;
    overtime?: string;
    createdAt: Date;
    updatedAt: Date;
    firmId: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        employee: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee is required']
        },
        date: {
            type: Date,
            required: [true, 'Date is required']
        },
        inTime: {
            type: String,
        },
        outTime: {
            type: String,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            default: 'Present'
        },
        workHours: {
            type: String,
            default: '00:00'
        },
        breakTime: {
            type: String,
            default: '00:00'
        },
        overtime: {
            type: String,
            default: '00:00'
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
