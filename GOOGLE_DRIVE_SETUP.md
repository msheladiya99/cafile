# Google Drive Integration Setup Guide

Follow these steps to configure Google Drive storage for your CA Office Portal.

## 1. Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown at the top and select **"New Project"**.
3.  Name it (e.g., `ca-office-portal`) and click **Create**.
4.  Select the newly created project.

## 2. Enable Google Drive API
1.  In the left sidebar, go to **APIs & Services > Library**.
2.  Search for **"Google Drive API"**.
3.  Click on it and click **Enable**.

## 3. Create a Service Account
1.  Go to **APIs & Services > Credentials**.
2.  Click **+ CREATE CREDENTIALS** and select **Service Account**.
3.  **Step 1:** Give it a name (e.g., `drive-bot`). Click **Create and Continue**.
4.  **Step 2:** (Optional) Grant this service account access to project. You can skip this or choose generic "Viewer". Click **Continue**.
5.  **Step 3:** Click **Done**.

## 4. Generate Keys
1.  You should now see your Service Account in the list (e.g., `drive-bot@...`).
2.  Click the **pencil icon** (Edit) or click on the email address.
3.  Go to the **Keys** tab.
4.  Click **Add Key > Create new key**.
5.  Select **JSON** and click **Create**.
6.  A JSON file will automatically download to your computer. **Keep this safe!**

## 5. Configure Application (`.env`)
Open the downloaded JSON file with a text editor. You need two values:
-   `client_email`
-   `private_key`

Update your `server/.env` file with these values:

```env
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

> **Note:** For the private key, you must include the `-----BEGIN...` and `-----END...` parts. If pasting into `.env`, ensure it is all on one line with `\n` for newlines, OR wrapped in quotes depending on your parser. (The provided `.env` example uses quotes and explicit `\n`).

## 6. Setup Drive Folder & Permissions (CRITICAL STEP)
The Service Account needs permission to access your Google Drive folder.

1.  Go to your Google Drive (`drive.google.com`).
2.  Create a new folder (e.g., `CA Office Files`).
3.  Open the folder and copy the **Folder ID** from the URL.
    -   Example URL: `https://drive.google.com/drive/folders/1ABC...`
    -   Folder ID: `1ABC...`
4.  Add this ID to your `.env`:
    ```env
    GOOGLE_DRIVE_ROOT_FOLDER_ID=1ABC...
    ```
5.  **Share the Folder:**
    -   Right-click the folder > **Share**.
    -   Paste the **Service Account Email** (from step 5).
    -   Select **Editor** role.
    -   Uncheck "Notify people" (optional).
    -   Click **Share**.

## 7. Restart Server
After updating the `.env` file, restart your server to apply the changes:
```bash
npm run dev
```

## Troubleshooting
-   **"Service Accounts do not have storage quota"**: You skipped Step 6 (Sharing). The bot is trying to upload to its own empty drive instead of your folder.
-   **"Invalid Grant"**: Your system time is wrong, or the private key in `.env` is malformed.
