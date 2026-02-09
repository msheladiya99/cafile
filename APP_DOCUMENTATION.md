# 📘 CA Office Portal - Application Documentation

## 📋 Overview
The **CA Office Portal** is a comprehensive practice management solution designed specifically for Chartered Accountant offices. It bridges the gap between the CA firm and its clients by providing a secure, professional platform for document exchange, communication, and practice management.

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite, Material UI (MUI)
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas (Cloud) using Mongoose ODM
- **Storage:** Google Drive API (for secure, unlimited file storage)
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)

### Key Security Features
- **Data Isolation:** Clients can strictly access *only* their own data.
- **Secure Storage:** All files are stored in your private Google Drive, not on the server.
- **Encryption:** Passwords are hashed using Bcrypt.
- **Access Control:** Differentiated access for Admins, Staff, and Clients.

---

## 👥 User Roles

### 1. Admin (CA / Owner)
- **Full System Access:** Can view and manage everything.
- **Staff Management:** Create and manage staff accounts and permissions.
- **Configuration:** Manage global settings and billing.

### 2. Staff (Employees)
- **Client Management:** Can view and manage clients.
- **Document Handling:** Upload and manage client files.
- **Communication:** Send messages and notices.
- *Restricted from sensitive admin settings.*

### 3. Client (End User)
- **Dashboard:** View personal summary and status.
- **My Files:** Download tax returns, assessment orders, and other docs.
- **Communication:** View notices and chat with the CA office.
- **Invoices:** View and download invoices.
- *Read-only access to documents (cannot delete or modify).*

---

## 📖 Feature Manual

### 1. Client Management
*Located in: Sidebar > Clients*
- **Add Client:** Create new client profiles with email, phone, and PAN details.
- **Credentials:** The system auto-generates secure login credentials for clients.
- **Client Profile:** View complete history, contact info, and associated files.

### 2. Document Management & Google Drive
*Located in: Sidebar > Upload Files / Manage Files*
- **Google Drive Integration:** All files are uploaded directly to a designated folder in your Google Drive. This ensures:
    - 🔒 Ownership of your data.
    - 📁 Easy backup and access outside the portal.
    - 🚀 No server storage limits.
- **Smart Upload:**
    - **Drag & Drop:** Modern interface for easy file uploading.
    - **Categorization:** Tag files by **Year** (e.g., 2024-25) and **Category** (ITR, GST, Accounting, etc.).
    - **Notifications:** Clients are notified (system status) when new files are available.

### 3. Communication Hub
*Located in: Sidebar > Messages / Notices*
- **Direct Messaging:** Real-time chat interface to communicate with specific clients.
- **Notices:** Broadcast important updates (e.g., "Tax Deadline Approaching") to **all clients** or specific groups.

### 4. Practice Management
*Located in: Sidebar > Reminders / Billing / Staff*
- **Reminders:** Set internal deadlines for staff (e.g., "File GST for Client X").
- **Billing:** Generate and track invoices for services rendered.
- **Staff Management:** Onboard team members and assign specific roles.

### 5. Reporting
*Located in: Sidebar > Dashboard / Reports*
- **Monthly Reports:** Generate summaries of new clients and uploads.
- **Analytics:** View visual breakdowns of practice performance (files uploaded, active clients).

---

## 🚀 Setup & Deployment
*For detailed technical instructions, please refer to `DEPLOYMENT.md`.*

### Quick Start
1. **Database:** Ensure MongoDB Atlas connection string is set in `.env`.
2. **Storage:** Configure Google Drive API credentials (OAuth2 or Service Account).
3. **Run Locally:**
   ```bash
   # Start Server
   cd server && npm run dev
   
   # Start Client
   cd client && npm run dev
   ```

---

## ❓ Frequently Asked Questions

**Q: Where are the files actually stored?**
A: They are stored in your connected Google Drive account. You can view them by logging into Google Drive directly as well.

**Q: Can clients upload files?**
A: By default, the portal is designed for *delivery* (CA -> Client). Client upload capability can be enabled if required (refer to project settings).

**Q: What happens if I lose internet connectivity?**
A: The app requires an active internet connection to authenticate users and fetch data from the cloud database and Google Drive.
