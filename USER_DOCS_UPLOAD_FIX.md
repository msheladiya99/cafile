# USER_DOCS Upload Fix

## Issue
When trying to upload files with the "User Documents" category, users were getting a "Missing required fields" error.

## Root Cause
The `/api/files/upload` route had two issues:
1. **Required year for all categories**: The validation required `year` field even for USER_DOCS category
2. **No USER_DOCS handling**: The category folder logic only handled ITR, GST, and ACCOUNTING categories, causing USER_DOCS uploads to fail with "Invalid category" error

## Solution

### Changes Made to `server/src/routes/files.ts`

#### 1. Made Year Optional for USER_DOCS (Lines 87-94)
**Before:**
```typescript
if (!clientId || !year || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
}
```

**After:**
```typescript
if (!clientId || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
}

// Year is required for all categories except USER_DOCS
if (category !== 'USER_DOCS' && !year) {
    return res.status(400).json({ message: 'Year is required for this category' });
}
```

#### 2. Added USER_DOCS Category Support (Lines 122-169)
Added special handling for USER_DOCS category that:
- Creates a `USER_DOCS` folder in the client's root Google Drive folder
- Uploads files directly to this folder without year-based organization
- Returns immediately after successful upload

**Implementation:**
```typescript
// For USER_DOCS, upload directly to client root folder without year organization
if (category === 'USER_DOCS') {
    // Create or get USER_DOCS folder in client root
    let userDocsFolderId: string | undefined;
    
    try {
        const clientFolders = await driveService.listFiles(client.driveFolderId!);
        userDocsFolderId = clientFolders.find(f => f.name === 'USER_DOCS' && f.mimeType === 'application/vnd.google-apps.folder')?.id;
        
        if (!userDocsFolderId) {
            userDocsFolderId = await driveService.createFolder('USER_DOCS', client.driveFolderId!);
        }
    } catch (error) {
        console.error('Error creating USER_DOCS folder:', error);
        return res.status(500).json({ message: 'Failed to create USER_DOCS folder' });
    }

    // Upload file directly to USER_DOCS folder
    const driveFile = await driveService.uploadFile(
        uploadedFile.buffer,
        customFileName,
        uploadedFile.mimetype,
        userDocsFolderId
    );

    // Create file record in database
    const fileRecord = new File({
        clientId,
        category,
        fileName: customFileName,
        originalFileName,
        fileSize: uploadedFile.size,
        uploadedBy: req.user!._id,
        driveFileId: driveFile.fileId,
        driveWebViewLink: driveFile.webViewLink,
        storedIn: 'drive',
    });

    await fileRecord.save();

    return res.status(201).json({
        message: 'File uploaded to Google Drive successfully',
        file: fileRecord,
        driveLink: driveFile.webViewLink,
    });
}
```

## Google Drive Folder Structure

### For ITR, GST, ACCOUNTING:
```
Client Name/
├── ITR/
│   └── FY 2026-27/
│       └── files...
├── GST/
│   └── FY 2026-27/
│       └── April/
│           └── GSTR-1/
│               └── files...
└── ACCOUNTING/
    └── FY 2026-27/
        └── files...
```

### For USER_DOCS:
```
Client Name/
└── USER_DOCS/
    └── files... (no year organization)
```

## Testing

### Test Case 1: Upload USER_DOCS
1. Select a client
2. Select "User Documents" as Document Type
3. Upload a file
4. **Expected**: File uploads successfully without requiring year

### Test Case 2: Upload ITR/GST/ACCOUNTING
1. Select a client
2. Select "Income Tax Records", "GST Compliance", or "Accounting & Audit"
3. Try to upload without selecting year
4. **Expected**: Error "Year is required for this category"
5. Select a year and upload
6. **Expected**: File uploads successfully

## Verification
- ✅ TypeScript compilation successful
- ✅ No breaking changes to existing functionality
- ✅ USER_DOCS files stored in Google Drive
- ✅ Year validation works correctly for all categories

## Related Files
- `server/src/routes/files.ts` - Main upload route (modified)
- `server/src/routes/admin.ts` - Alternative upload route (already supports USER_DOCS for local storage)
- `client/src/pages/admin/UploadFile.tsx` - Frontend upload form
- `client/src/services/adminService.ts` - API service calling `/files/upload`
