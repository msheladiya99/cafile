import express from 'express';
import { authenticate, requireStaff } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(requireStaff);

// Download format
router.get('/format', async (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, '../../../09 DECEMBER 2025 Monthly_Performance_Report.xls');
        if (fs.existsSync(filePath)) {
            res.download(filePath, '09 DECEMBER 2025 Monthly_Performance_Report.xls');
        } else {
            res.status(404).json({ message: 'Format template file not found on server.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// Bulk save attendance records from parsed Excel
router.post('/bulk', async (req, res) => {
    try {
        const { Attendance, User: UserModel } = (req as any).models;
        const { records } = req.body; // Array of { employeeCode, employeeName, date, inTime, outTime, status, description }

        if (!Array.isArray(records) || records.length === 0) {
            res.status(400).json({ message: 'No records provided' });
            return;
        }

        const firmId = (req as any).firmId;

        // Fetch all staff members of this firm
        const employees = await UserModel.find({
            firmId,
            role: { $in: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'] }
        }).select('_id firstName lastName name employeeCode').lean();

        // Build mapping: employeeCode -> ID, name -> ID
        const employeeMap: Record<string, string> = {};
        for (const emp of employees) {
            if (emp.employeeCode) {
                employeeMap[emp.employeeCode.trim()] = emp._id.toString();
            }
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
            employeeMap[fullName] = emp._id.toString();
            if (emp.name) {
                employeeMap[emp.name.trim().toLowerCase()] = emp._id.toString();
            }
        }

        const toInsert = [];
        const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (let i = 0; i < records.length; i++) {
            const r = records[i];
            const codeKey = r.employeeCode ? String(r.employeeCode).trim() : '';
            const nameKey = r.employeeName ? String(r.employeeName).trim().toLowerCase() : '';

            const employeeId = employeeMap[codeKey] || employeeMap[nameKey];

            if (!employeeId) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Employee not found for Code '${codeKey}' or Name '${r.employeeName}'`);
                continue;
            }

            if (!r.date) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Date is required`);
                continue;
            }

            toInsert.push({
                firmId,
                employee: employeeId,
                date: new Date(r.date),
                inTime: r.inTime || undefined,
                outTime: r.outTime || undefined,
                status: r.status || 'Present',
                description: r.description || 'Imported from performance sheet',
                workHours: r.workHours || '00:00',
                breakTime: r.breakTime || '00:00',
                overtime: r.overtime || '00:00',
            });
            results.successful++;
        }

        if (toInsert.length > 0) {
            // Delete pre-existing records to overwrite them and prevent duplicate logs
            const deletePromises = toInsert.map(item =>
                Attendance.deleteMany({
                    firmId,
                    employee: item.employee,
                    date: item.date
                })
            );
            await Promise.all(deletePromises);

            await Attendance.insertMany(toInsert);
        }

        res.json({
            message: `Processed ${records.length} records`,
            ...results
        });

    } catch (error: any) {
        console.error('Attendance bulk import error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// Create new attendance
router.post('/', async (req, res) => {
    try {
        const { Attendance } = (req as any).models;
        const { employee, date, inTime, outTime, description, status, workHours, breakTime, overtime } = req.body;

        const newAttendance = new Attendance({
            firmId: (req as any).firmId,
            employee,
            date,
            inTime,
            outTime,
            description,
            status,
            workHours,
            breakTime,
            overtime
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
        const { Attendance } = (req as any).models;
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
        const { Attendance } = (req as any).models;
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
        const { Attendance } = (req as any).models;
        const { employee, date, inTime, outTime, description, status, workHours, breakTime, overtime } = req.body;

        const updated = await Attendance.findOneAndUpdate(
            { _id: req.params.id, firmId: (req as any).firmId },
            { employee, date, inTime, outTime, description, status, workHours, breakTime, overtime },
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

// Bulk delete attendance records
router.post('/delete-bulk', async (req, res) => {
    try {
        const { Attendance } = (req as any).models;
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No record IDs provided' });
        }

        const result = await Attendance.deleteMany({
            _id: { $in: ids },
            firmId: (req as any).firmId
        });

        res.json({ message: `Successfully deleted ${result.deletedCount} attendance records` });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// Delete attendance
router.delete('/:id', async (req, res) => {
    try {
        const { Attendance } = (req as any).models;
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
