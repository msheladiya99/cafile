const XLSX = require('../client/node_modules/xlsx');
const path = require('path');

try {
    const filePath = path.join(__dirname, '../09 DECEMBER 2025 Monthly_Performance_Report.xls');
    const workbook = XLSX.readFile(filePath);
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const allRecords = [];
    
    // Find all starting indexes where row[0] === 'Dept. Name'
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row[0] === 'Dept. Name') {
            const startIdx = i;
            
            // Parse Report Month
            const headerRow = data[startIdx];
            const reportMonthIdx = headerRow.findIndex(val => val && String(val).trim().toLowerCase() === 'report month');
            let reportMonthStr = '';
            if (reportMonthIdx !== -1) {
                for (let c = reportMonthIdx + 1; c < headerRow.length; c++) {
                    if (headerRow[c]) {
                        reportMonthStr = String(headerRow[c]).trim();
                        break;
                    }
                }
            }
            
            let year = new Date().getFullYear();
            let month = new Date().getMonth();
            if (reportMonthStr) {
                const parts = reportMonthStr.split('-');
                if (parts.length === 2) {
                    const monthStr = parts[0].trim();
                    const yearStr = parts[1].trim();
                    const parsedYear = parseInt(yearStr);
                    if (!isNaN(parsedYear)) year = parsedYear;
                    
                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    const monthShortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    const parsedMonth = parseInt(monthStr);
                    if (!isNaN(parsedMonth)) {
                        month = parsedMonth - 1;
                    } else {
                        const lcaseMonth = monthStr.toLowerCase();
                        let mIdx = monthNames.indexOf(lcaseMonth);
                        if (mIdx === -1) mIdx = monthShortNames.indexOf(lcaseMonth.substring(0, 3));
                        if (mIdx !== -1) month = mIdx;
                    }
                }
            }
            
            // Parse Employee Code and Name
            const empRow = data[startIdx + 1];
            if (!empRow) continue;
            
            const empcodeLabelIdx = empRow.findIndex(val => val && String(val).trim().toLowerCase() === 'empcode');
            let employeeCode = '';
            if (empcodeLabelIdx !== -1) {
                for (let c = empcodeLabelIdx + 1; c < empRow.length; c++) {
                    if (empRow[c]) {
                        employeeCode = String(empRow[c]).trim();
                        break;
                    }
                }
            }
            
            const nameLabelIdx = empRow.findIndex(val => val && String(val).trim().toLowerCase() === 'name');
            let employeeName = '';
            if (nameLabelIdx !== -1) {
                for (let c = nameLabelIdx + 1; c < empRow.length; c++) {
                    if (empRow[c]) {
                        employeeName = String(empRow[c]).trim();
                        break;
                    }
                }
            }
            
            // Parse Days row
            const daysRow = data[startIdx + 2];
            if (!daysRow) continue;
            const colToDayMap = {};
            for (let c = 1; c < daysRow.length; c++) {
                const val = parseInt(daysRow[c]);
                if (!isNaN(val) && val >= 1 && val <= 31) {
                    colToDayMap[c] = val;
                }
            }
            
            // Find IN, OUT, Status rows
            let inRow = null;
            let outRow = null;
            let statusRow = null;
            for (let r = startIdx + 3; r <= startIdx + 10; r++) {
                const rData = data[r];
                if (!rData) continue;
                const label = String(rData[0]).trim().toUpperCase();
                if (label === 'IN') inRow = rData;
                else if (label === 'OUT') outRow = rData;
                else if (label === 'STATUS') statusRow = rData;
            }
            
            // Generate records
            Object.keys(colToDayMap).forEach(col => {
                const day = colToDayMap[col];
                const statusVal = statusRow ? String(statusRow[col]).trim() : '';
                if (!statusVal) return;
                
                const inTimeVal = inRow ? String(inRow[col]).trim() : '';
                const outTimeVal = outRow ? String(outRow[col]).trim() : '';
                
                const cleanInTime = (inTimeVal && inTimeVal !== '--:--') ? inTimeVal : '';
                const cleanOutTime = (outTimeVal && outTimeVal !== '--:--') ? outTimeVal : '';
                
                // Build local date to avoid timezone shift
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                let cleanStatus = 'Present';
                if (statusVal.toUpperCase() === 'A') cleanStatus = 'Absent';
                else if (statusVal.toUpperCase() === 'WO') cleanStatus = 'Weekly Off';
                
                allRecords.push({
                    employeeCode,
                    employeeName,
                    date: dateString,
                    inTime: cleanInTime || undefined,
                    outTime: cleanOutTime || undefined,
                    status: cleanStatus,
                    description: `Excel Import status: ${statusVal}`
                });
            });
        }
    }
    
    console.log('Successfully Parsed Records Count:', allRecords.length);
    console.log('Sample Records:');
    allRecords.slice(0, 10).forEach((rec, idx) => {
        console.log(`Record ${idx}:`, rec);
    });
    
} catch (e) {
    console.error('Error parsing excel:', e);
}

