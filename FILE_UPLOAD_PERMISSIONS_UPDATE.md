# File Upload Permissions Update

## Summary
Updated the file upload and management system to allow **STAFF** to upload files and **MANAGER** to access all uploaded files.

## Changes Made

### Backend Changes (`server/src/routes/files.ts`)

#### 1. **File Upload Permission** (Line 78)
- **Before**: Only `ADMIN` could upload files
- **After**: `ADMIN`, `MANAGER`, and `STAFF` can upload files
```typescript
// OLD
router.post('/upload', authenticate, requireAdmin, upload.single('file'), ...)

// NEW
router.post('/upload', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), upload.single('file'), ...)
```

#### 2. **File Access Control** (Lines 17-22)
- **Updated**: Clarified that all staff roles (ADMIN, MANAGER, STAFF, INTERN) have access to view files
- **Manager Access**: Managers can now view all client files, not just their own
```typescript
// Admin, Manager, Staff, and Intern always have access
if (req.user!.role !== 'CLIENT') {
    return next();
}
```

#### 3. **File Deletion Permission** (Line 474)
- **Before**: Only `ADMIN` could delete files
- **After**: `ADMIN`, `MANAGER`, and `STAFF` can delete files
```typescript
router.delete('/:id', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), ...)
```

#### 4. **Additional Permissions Updated**
The following routes were also updated to allow MANAGER and STAFF access:
- **Create Shareable Link** (Line 548): `ADMIN`, `MANAGER`, `STAFF`
- **Archive Files** (Line 612): `ADMIN`, `MANAGER`, `STAFF`
- **Update File Tags** (Line 638): `ADMIN`, `MANAGER`, `STAFF`
- **Check Duplicate Files** (Line 703): `ADMIN`, `MANAGER`, `STAFF`

#### 5. **File Listing Access** (Lines 513-521)
- **Updated**: Added comment clarifying that MANAGER can access all files
- Clients can only access their own files
- All staff roles can access any client's files

### Frontend
No changes required. The frontend already allows all staff roles to access the "Upload Files" and "Manage Files" menu items in the AdminLayout.

## Role Permissions Summary

| Action | ADMIN | MANAGER | STAFF | INTERN | CLIENT |
|--------|-------|---------|-------|--------|--------|
| Upload Files | ✅ | ✅ | ✅ | ❌ | ❌ |
| View All Files | ✅ | ✅ | ✅ | ✅ | Own Only |
| Delete Files | ✅ | ✅ | ✅ | ❌ | ❌ |
| Archive Files | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Shareable Links | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update File Tags | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update File Notes | ✅ | ✅ | ✅ | ✅ | Own Only |
| Star/Unstar Files | ✅ | ✅ | ✅ | ✅ | Own Only |

## Testing Recommendations

1. **Test STAFF Upload**:
   - Login as a STAFF user
   - Navigate to "Upload Files"
   - Upload a file for a client
   - Verify the file is uploaded successfully

2. **Test MANAGER Access**:
   - Login as a MANAGER user
   - Navigate to "Manage Files"
   - Select different clients
   - Verify you can see all files for all clients

3. **Test STAFF File Management**:
   - Login as a STAFF user
   - Upload a file
   - Delete the file
   - Archive/unarchive files
   - Update file tags

4. **Test INTERN Restrictions**:
   - Login as an INTERN user
   - Verify they can view files but cannot upload or delete

## Notes
- The existing file upload route in `admin.ts` (line 133) already had the correct permissions for ADMIN, MANAGER, and STAFF
- All changes maintain backward compatibility
- No database migrations required
- The changes align with the existing permission structure in the analytics routes
