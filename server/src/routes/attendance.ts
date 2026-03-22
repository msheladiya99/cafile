import express from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import Attendance from '../models/Attendance';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(requireStaff);

// Create new attendance
router.post('/', async (req, res) => {
    try {
        const { employee, date, inTime, outTime, description } = req.body;

        const newAttendance = new Attendance({
            firmId: (req as any).firmId,
            employee,
            date,
            inTime,
            outTime,
            description
        });

        const savedAttendance = await newAttendance.save();

        // Populate employee details for response
        await savedAttendance.populate('employee', 'firstName lastName name');

        res.status(201).json(savedAttendance);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Get all attendance with optional filters
router.get('/', async (req, res) => {
    try {
        const { employee, startDate, endDate } = req.query;
        const filter: any = { firmId: (req as any).firmId };

        if (employee) {
            filter.employee = employee;
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) {
                // Find by local date (ignores timezone matching for ISO query)
                filter.date.$gte = new Date(startDate as string);
            }
            if (endDate) {
                filter.date.$lte = new Date(endDate as string);
            }
        }

        const attendanceRecords = await Attendance.find(filter)
            .populate('employee', 'firstName lastName name')
            .sort({ date: -1, inTime: -1 });

        res.json(attendanceRecords);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


// Form 108 - Monthly summary for a given employee & year
router.get('/form108', async (req, res) => {
    try {
        const { employee, year } = req.query;

        if (!employee || !year) {
            return res.status(400).json({ message: 'employee and year are required' });
        }

        const yearNum = parseInt(year as string);
        const startDate = new Date(yearNum, 0, 1);       // Jan 1
        const endDate = new Date(yearNum, 11, 31, 23, 59, 59); // Dec 31

        const records = await Attendance.find({
            firmId: (req as any).firmId,
            employee,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Group by month and sum hours
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const monthMap: Record<number, { totalMinutes: number; days: Set<string> }> = {};

        for (const rec of records) {
            const month = new Date(rec.date).getMonth(); // 0-11
            if (!monthMap[month]) {
                monthMap[month] = { totalMinutes: 0, days: new Set() };
            }

            if (rec.inTime && rec.outTime) {
                const [inH, inM] = rec.inTime.split(':').map(Number);
                const [outH, outM] = rec.outTime.split(':').map(Number);
                let diff = (outH * 60 + outM) - (inH * 60 + inM);
                if (diff < 0) diff += 24 * 60;
                monthMap[month].totalMinutes += diff;
            }

            // Track distinct working days
            const dateKey = new Date(rec.date).toISOString().split('T')[0];
            monthMap[month].days.add(dateKey);
        }

        const summary = monthNames.map((name, idx) => {
            const data = monthMap[idx];
            if (!data) return { month: name, totalHours: '0h 0m', calculatedDays: 0 };
            const hours = Math.floor(data.totalMinutes / 60);
            const mins = data.totalMinutes % 60;
            return {
                month: name,
                totalHours: `${hours}h ${mins}m`,
                calculatedDays: data.days.size
            };
        });

        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Update attendance
router.put('/:id', async (req, res) => {
    try {
        const { employee, date, inTime, outTime, description } = req.body;

        const updated = await Attendance.findOneAndUpdate(
            { _id: req.params.id, firmId: (req as any).firmId },
            { employee, date, inTime, outTime, description },
            { new: true }
        ).populate('employee', 'firstName lastName name');

        if (!updated) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Delete attendance
router.delete('/:id', async (req, res) => {
    try {
        const deletedAttendance = await Attendance.findOneAndDelete({ _id: req.params.id, firmId: (req as any).firmId });
        if (!deletedAttendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }
        res.json({ message: 'Attendance record deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
