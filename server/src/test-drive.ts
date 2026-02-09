import { getDriveService } from './services/googleDrive';

async function testGoogleDrive() {
    try {
        console.log('🔍 Testing Google Drive connection...');

        const driveService = getDriveService();

        // Test 1: List files in root
        console.log('📁 Listing files in root folder...');
        const files = await driveService.listFiles();
        console.log(`✅ Found ${files.length} files/folders in root`);

        // Test 2: Create a test folder
        console.log('📂 Creating test folder...');
        const testFolderId = await driveService.createFolder('CA-Office-Test-' + Date.now());
        console.log(`✅ Test folder created with ID: ${testFolderId}`);

        // Test 3: Upload a test file
        console.log('📄 Uploading test file...');
        const testContent = Buffer.from('This is a test file from CA Office Portal');
        const uploadResult = await driveService.uploadFile(
            testContent,
            'test-file.txt',
            'text/plain',
            testFolderId
        );
        console.log(`✅ Test file uploaded: ${uploadResult.fileId}`);
        console.log(`🔗 View link: ${uploadResult.webViewLink}`);

        console.log('\n✅ Google Drive is working correctly!');
        console.log('📝 Note: Files are in the service account\'s drive.');
        console.log('🔗 Use the web view links to access files.');

    } catch (error) {
        console.error('❌ Google Drive test failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
    }
}

// Run the test
testGoogleDrive();
