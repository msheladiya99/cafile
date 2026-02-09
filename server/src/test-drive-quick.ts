import { getDriveService } from './services/googleDrive';

async function quickTest() {
    try {
        console.log('🔍 Testing Google Drive connection...\n');

        // Test 1: Initialize service
        console.log('Step 1: Initializing Drive service...');
        const driveService = getDriveService();
        console.log('✅ Drive service initialized\n');

        // Test 2: List files in root folder
        console.log('Step 2: Listing files in root folder...');
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || 'root';
        console.log('Using folder ID:', rootFolderId);

        const files = await driveService.listFiles(rootFolderId);
        console.log(`✅ Found ${files.length} items in folder\n`);

        if (files.length > 0) {
            console.log('Files/Folders:');
            files.slice(0, 5).forEach(f => {
                console.log(`  - ${f.name} (${f.mimeType})`);
            });
        }

        // Test 3: Try to create a test folder
        console.log('\nStep 3: Creating test folder...');
        const testFolderName = 'TEST-' + Date.now();
        const testFolderId = await driveService.createFolder(testFolderName, rootFolderId);
        console.log(`✅ Test folder created: ${testFolderName}`);
        console.log(`   Folder ID: ${testFolderId}\n`);

        console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
        console.log('\nGoogle Drive is working correctly!');
        console.log('The upload should work now.\n');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED!\n');
        console.error('Error:', error.message);

        if (error.response) {
            console.error('\nAPI Response:');
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.code) {
            console.error('\nError Code:', error.code);
        }

        console.error('\n📋 Troubleshooting:');
        console.error('1. Check that the folder is shared with the service account');
        console.error('2. Verify the folder ID is correct');
        console.error('3. Make sure Google Drive API is enabled');
        console.error('4. Check that credentials are valid\n');
    }
}

// Run the test
quickTest();
