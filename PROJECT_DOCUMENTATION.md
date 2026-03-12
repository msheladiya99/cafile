# 🏢 CA Office Portal – Full Project Documentation

> **Version:** 1.0.0 | **Stack:** React + TypeScript (Frontend) · Node.js + Express + MongoDB (Backend) · Google Drive (File Storage)

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Application Structure](#4-application-structure)
5. [Features – Detailed Guide](#5-features--detailed-guide)
   - 5.1 [Authentication (Login)](#51-authentication-login)
   - 5.2 [Dashboard](#52-dashboard)
   - 5.3 [Client Management (Client Master)](#53-client-management-client-master)
   - 5.4 [File Management (Manage Files / Upload File)](#54-file-management-manage-files--upload-file)
   - 5.5 [Billing & Invoicing](#55-billing--invoicing)
   - 5.6 [Reminders](#56-reminders)
   - 5.7 [Task Management](#57-task-management)
   - 5.8 [Employee Management](#58-employee-management)
   - 5.9 [Attendance](#59-attendance)
   - 5.10 [Timesheet](#510-timesheet)
   - 5.11 [Firm Master](#511-firm-master)
   - 5.12 [Notices](#512-notices)
   - 5.13 [Analytics](#513-analytics)
   - 5.14 [Monthly Reports](#514-monthly-reports)
   - 5.15 [File Register](#515-file-register)
   - 5.16 [Client Portal (Client Role)](#516-client-portal-client-role)
   - 5.17 [Settings](#517-settings)
6. [Database Models](#6-database-models)
7. [API Reference](#7-api-reference)
8. [How to Run the App](#8-how-to-run-the-app)

---

## 1. Project Overview

The **CA Office Portal** is a full-stack web application designed for Chartered Accountant (CA) firms to manage their day-to-day operations. It provides:

- 👥 **Multi-role access** — Admin, Manager, Staff, Intern, and Client portals
- 📁 **Document management** — Upload, organize, and view client documents synced with Google Drive
- 💰 **Billing & Invoicing** — Create, track, and manage invoices with payment recording
- ✅ **Task management** — Kanban-style task board with time tracking and analytics
- 🕐 **Attendance & Timesheets** — Track employee check-ins and work hours
- 📢 **Reminders & Notices** — ITR, GST, Accounting deadline reminders and office notices
- 🏛️ **Firm Master** — Manage CA firm profile, partners, logos, bank details

---

## 2. Tech Stack

| Layer                | Technology                                  |
| -------------------- | ------------------------------------------- |
| **Frontend**         | React 18 + TypeScript + Vite                |
| **UI Library**       | Material UI (MUI) v5                        |
| **State Management** | React Query (TanStack Query)                |
| **Backend**          | Node.js + Express.js + TypeScript           |
| **Database**         | MongoDB + Mongoose ODM                      |
| **Authentication**   | JWT (JSON Web Tokens)                       |
| **File Storage**     | Google Drive API (primary) + Local fallback |
| **Deployment**       | Vercel (frontend + serverless backend)      |

---

## 3. User Roles & Permissions

The system has **5 roles** with increasing levels of access:

### Role Summary

| Feature                            | ADMIN | MANAGER |     STAFF     |    INTERN     |  CLIENT  |
| ---------------------------------- | :---: | :-----: | :-----------: | :-----------: | :------: |
| Dashboard (full firm analytics)    |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Client Master (create/edit/delete) |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Client Master (view)               |  ✅   |   ✅    |      ✅       |      ✅       |    ❌    |
| File Upload (any client)           |  ✅   |   ✅    |      ✅       |      ❌       |    ❌    |
| File View (own files only)         |  ❌   |   ❌    |      ❌       |      ❌       |    ✅    |
| Billing – create invoice           |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Billing – view invoices            |  ✅   |   ✅    |      ✅       |      ❌       | ✅ (own) |
| Task – create & assign             |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Task – execute (timer, progress)   |  ✅   |   ✅    |      ✅       |      ✅       |    ❌    |
| Task – view all                    |  ✅   |   ✅    | Assigned only | Assigned only |    ❌    |
| Employee Management                |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Attendance (manage all)            |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Attendance (view own)              |  ✅   |   ✅    |      ✅       |      ✅       |    ❌    |
| Firm Master                        |  ✅   |   ❌    |      ❌       |      ❌       |    ❌    |
| Notices (create)                   |  ✅   |   ✅    |      ❌       |      ❌       |    ❌    |
| Analytics                          |  ✅   |   ✅    |    Limited    |      ❌       |    ❌    |
| Settings                           |  ✅   |   ❌    |      ❌       |      ❌       |    ❌    |
| Reminders (create/manage)          |  ✅   |   ✅    |      ✅       |      ❌       |    ❌    |

### Role Descriptions

- **ADMIN** — Full system access. Can manage everything including firm settings, employee creation, all billing, and analytics.
- **MANAGER** — Same as Admin except cannot access Firm Master and Settings. Manages clients, tasks, billing, staff.
- **STAFF** — Can view clients, upload files, execute assigned tasks, add attendance entries.
- **INTERN** — Very limited: can only view assigned tasks, start/stop timer on their tasks.
- **CLIENT** — External client portal: can view their own invoices, files, and profile.

---

## 4. Application Structure

```
itr-app/
├── client/                        # React Frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx           # Login page (all roles)
│       │   ├── admin/              # Admin/Manager/Staff/Intern pages
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Clients.tsx
│       │   │   ├── Billing.tsx
│       │   │   ├── ClientLedger.tsx
│       │   │   ├── ManageFiles.tsx
│       │   │   ├── UploadFile.tsx
│       │   │   ├── FileRegister.tsx
│       │   │   ├── Reminders.tsx
│       │   │   ├── Tasks.tsx
│       │   │   ├── MonthlyReports.tsx
│       │   │   ├── FirmMaster.tsx
│       │   │   ├── client_process/
│       │   │   │   ├── ClientMaster.tsx     # Full client profile editor
│       │   │   │   ├── ClientList.tsx
│       │   │   │   ├── ClientContactDetail.tsx
│       │   │   │   └── AddGroupList.tsx
│       │   │   └── employee/
│       │   │       ├── EmployeeMaster.tsx
│       │   │       ├── EmployeeList.tsx
│       │   │       ├── EmployeeLoginDetail.tsx
│       │   │       ├── EmpTaskSchedule.tsx
│       │   │       ├── Form108.tsx
│       │   │       ├── FreeEmployeeList.tsx
│       │   │       ├── attendance/
│       │   │       │   ├── AddAttendance.tsx
│       │   │       │   └── AttendanceList.tsx
│       │   │       └── timesheet/
│       │   │           ├── TaskWiseTimesheet.tsx
│       │   │           ├── SubtaskWiseTimesheet.tsx
│       │   │           └── EntryWiseTimesheet.tsx
│       │   └── client/            # Client portal pages
│       │       ├── Dashboard.tsx
│       │       ├── Invoices.tsx
│       │       ├── MyFiles.tsx
│       │       └── ProfileSettings.tsx
│       └── services/              # API service functions
│
└── server/                        # Express Backend
    └── src/
        ├── models/                # MongoDB schemas
        ├── routes/                # REST API routes
        ├── middleware/            # Auth middleware
        └── services/             # Business logic (Google Drive etc.)
```

---

## 5. Features – Detailed Guide

---

### 5.1 Authentication (Login)

**URL:** `/login`  
**Accessible by:** All users

#### How It Works

1. Enter **Username** and **Password** on the login page.
2. The system authenticates via `POST /api/auth/login`.
3. On success, a **JWT token** is stored locally.
4. The user is **redirected based on their role**:
   - `ADMIN / MANAGER / STAFF / INTERN` → `/admin/dashboard`
   - `CLIENT` → `/client/dashboard`

#### Session

- A **session timer** is shown in the top navigation bar counting elapsed time.
- Logging out clears the token and redirects to login.

---

### 5.2 Dashboard

**URL:** `/admin/dashboard`  
**Accessible by:** ADMIN, MANAGER, STAFF

#### What It Shows

The Dashboard is the **home page** after login. It gives a real-time overview of the firm's operations.

| Section                | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| **Summary Cards**      | Total Clients, Active Tasks, Pending Invoices, Overdue Reminders   |
| **Task Status Chart**  | Doughnut/bar chart showing PENDING / STARTED / UNDER_REVIEW / DONE |
| **Recent Activity**    | Latest client additions, file uploads, invoice creation            |
| **Upcoming Reminders** | Next 7 days' ITR / GST / Accounting deadlines                      |
| **Staff Workload**     | How many tasks each staff member currently has                     |
| **Overdue Overview**   | Tasks and reminders past deadline                                  |

#### How to Use

- **Admin/Manager** sees the full firm-wide dashboard.
- **Staff** sees a personal dashboard focusing on their own assigned tasks and reminders.

---

### 5.3 Client Management (Client Master)

**URLs:** `/admin/clients` → opens `ClientMaster`  
**Accessible by:** ADMIN, MANAGER (edit), STAFF (view only)

#### What It Does

Maintains the complete profile of every client the firm serves.

#### Client Profile Fields

| Tab / Section          | Fields                                                                         |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Basic Info**         | Client Code, Name, Email, Phone, Birth Date                                    |
| **Identifiers**        | Group, IT Status, Master Type (Individual / Company / HUF / Firm…), Sub-Master |
| **Address**            | Address, Country, State, City, Postal Code                                     |
| **Compliance**         | PAN Number, Aadhar Number, GST Number                                          |
| **Tax & Registration** | TRN No, Licence No, Incorporation Dates                                        |
| **Contact Info**       | Alternate Phone, Fax, Multiple Contacts (with designation)                     |
| **Assignment**         | Support Employee (assigned staff), Financial Year                              |
| **Office File**        | Physical File Number, Rack Location                                            |
| **Legal Documents**    | Upload documents linked to the client (stored on Google Drive)                 |
| **Extra Fields**       | 7 customizable extra fields (labels set in Firm Master)                        |

#### How to Use

**Creating a New Client:**

1. Go to `Clients` in the sidebar.
2. Click **"Add New Client"**.
3. Fill in the required fields: Name, Email, Phone.
4. Fill in compliance details: PAN, GST, Aadhar.
5. Assign a **Support Employee**.
6. Upload any **Legal Documents** (these are uploaded to Google Drive).
7. Click **Save**.

**Editing a Client:**

1. Search for the client in the list.
2. Click the client row to open `ClientMaster`.
3. Edit any field and click **Update Client**.

**Google Drive Integration:**

- When a client is created, Google Drive folders are auto-created:
  - 📁 `[ClientName]/` (root)
    - 📁 `ITR/`
    - 📁 `GST/`
    - 📁 `Accounting/`
- All file uploads for this client go into the corresponding Drive sub-folder.

---

### 5.4 File Management (Manage Files / Upload File)

**URLs:** `/admin/manage-files`, `/admin/upload-file`  
**Accessible by:** ADMIN, MANAGER, STAFF (upload & view), CLIENT (own files only via client portal)

#### Categories

Files are organized into 4 categories:

| Category       | Description                        |
| -------------- | ---------------------------------- |
| **ITR**        | Income Tax Return documents        |
| **GST**        | GST filings and returns            |
| **ACCOUNTING** | Accounting records, balance sheets |
| **USER_DOCS**  | Miscellaneous user documents       |

#### Uploading a File

1. Go to **Upload File** from the sidebar.
2. Select the **Client**.
3. Choose the **Category** (ITR / GST / Accounting / User Docs).
4. (Optional) Select **Year** and **Month**.
5. Choose the **document type**.
6. Upload the file — it is uploaded to **Google Drive** in the client's corresponding folder.
7. The file record is saved in MongoDB with Drive file ID and view link.

#### Managing Files

1. Go to **Manage Files** from the sidebar.
2. **Filter** by Client, Category, Year, or Tags.
3. Options per file:
   - 👁 **View** — Opens the file in Google Drive
   - ⭐ **Star** — Mark as important
   - 🗂 **Archive** — Archive the file
   - 🏷 **Tags** — Add searchable tags
   - 📝 **Notes** — Add a note to the file
   - 🗑 **Delete** — Remove from Drive and database

#### File Register

**URL:** `/admin/file-register`  
Provides a **read-only register** view of all uploaded files across all clients, sorted by date.

---

### 5.5 Billing & Invoicing

**URL:** `/admin/billing`  
**Accessible by:** ADMIN, MANAGER (create/edit), STAFF (view), CLIENT (own invoices)

#### How Invoicing Works

##### Creating an Invoice

1. Go to **Billing** from the sidebar.
2. Click **"New Invoice"**.
3. Choose **Billing Type**:
   - `Single Client` — Invoice for one client
   - `Client Group` — Invoice for a group of clients
4. Select the **Client** (or Client Group).
5. Select the **Firm** (if multi-firm).
6. Add **Line Items** (services):
   - Service Name, Description, Quantity, Unit Price → Amount auto-calculated
7. Set **Tax %** and it auto-calculates the total.
8. Set the **Due Date**.
9. Add optional **Notes**.
10. Click **Create Invoice**.

##### Invoice Status Flow

```
PENDING → PARTIAL → PAID
           ↓
        CANCELLED
```

- **PENDING** — No payment recorded
- **PARTIAL** — Some payment received (balance > 0)
- **PAID** — Fully paid (balance = 0)
- **CANCELLED** — Manually cancelled

##### Recording a Payment

1. Open an existing invoice.
2. Click **"Record Payment"**.
3. Enter the amount, date, and payment method:
   - `CASH`, `BANK_TRANSFER`, `UPI`, `CHEQUE`, `OTHER`
4. Add a transaction ID or note (optional).
5. Save — the invoice status auto-updates based on paid amount vs. total.

#### Client Ledger

**URL:** `/admin/client-ledger`  
Shows a full payment history and outstanding balances per client. Filter by client and date range.

---

### 5.6 Reminders

**URL:** `/admin/reminders`  
**Accessible by:** ADMIN, MANAGER, STAFF

#### What Are Reminders?

Reminders are deadline alerts linked to specific clients. They are used for:

- **ITR** — Income Tax Return filing deadlines
- **GST** — GST return deadlines
- **ACCOUNTING** — Accounting submission deadlines
- **OTHER** — Any other custom reminder

#### Creating a Reminder

1. Go to **Reminders** from the sidebar.
2. Click **"Add Reminder"**.
3. Fill in:
   - **Client** (linked)
   - **Title** — e.g., "Q3 GST Filing"
   - **Description**
   - **Due Date**
   - **Type** — ITR / GST / Accounting / Other
   - **Priority** — Low / Medium / High
   - **Notify Before** — Days before due date to trigger notification (default: 7)
4. Save.

#### Reminder Status Flow

```
PENDING → COMPLETED
    ↓
 OVERDUE (auto-set if due date passes)
```

#### Dashboard Integration

Upcoming reminders appear on the **Dashboard** in the "Upcoming Deadlines" widget, color-coded by priority.

---

### 5.7 Task Management

**URL:** `/admin/tasks`  
**Accessible by:** ADMIN, MANAGER (full), STAFF (assigned tasks), INTERN (assigned tasks, read-mostly)

#### Overview

A Kanban-style board for managing the firm's work tasks, with full time tracking and analytics.

#### Task Lifecycle

```
PENDING (To Do)
    ↓
STARTED (In Progress)  ←── Can return from UNDER_REVIEW (counts as revision)
    ↓
UNDER_REVIEW (Review)
    ↓
DONE (Completed)
```

#### Creating a Task (Admin/Manager)

1. Go to **Tasks** from the sidebar.
2. Click **"Create Task"**.
3. Fill in:
   - **Title** (required)
   - **Description**
   - **Category**: `Client Work / Internal / Review / Follow-Up / Filing / Other`
   - **Priority**: `Low / Medium / High / Urgent`
   - **Target Date** (deadline, required)
   - **Estimated Hours** (required)
   - **Assign To** — one or more staff members
   - **Link to Client** (optional)
   - **Tags** (optional)
   - **Checklist items** (optional step-by-step subtasks)
4. Click **"Create Task"** — appears on the Kanban board.

#### Working on a Task (Staff/Intern)

1. Navigate to **Tasks** — you see only tasks assigned to you.
2. Click a task card to open it.
3. **Start Timer** — starts tracking your work time. Status auto-changes to `STARTED`.
4. Work on the task. Update the **Progress %** slider as you go.
5. Check off **Checklist items** as completed.
6. Add **Comments** for collaboration.
7. **Stop Timer** — records the work session duration.
8. When complete, change status to **UNDER_REVIEW**.

#### Kanban Board Columns

```
┌─────────────────────────────────────────────────────────────┐
│  TO DO (PENDING)  │  IN PROGRESS (STARTED)  │  REVIEW  │  DONE  │
│                   │                         │          │        │
│  Task Card        │  Task Card              │  Task    │  Task  │
│  - Priority badge │  - Timer running ⏱      │  Card    │  Card  │
│  - Due date       │  - Progress bar         │          │        │
│  - Assignees      │  - Time: est vs actual  │          │        │
└─────────────────────────────────────────────────────────────┘
```

#### Task Card Shows

- 🔴 Priority badge (Low / Medium / High / Urgent)
- ⚠️ Overdue indicator (red, if past deadline)
- 📁 Linked client name
- 📊 Progress bar (0–100%)
- ⏱ Timer status and actual vs. estimated time
- 📅 Target date
- 🏷 Tags
- 👥 Assigned user avatars
- 💬 Comments count
- ✅ Checklist completion ratio

#### Time Tracking Details

| Metric                | Description                               |
| --------------------- | ----------------------------------------- |
| **Estimated Hours**   | Set when task is created                  |
| **Actual Time Spent** | Sum of all timer sessions (in minutes)    |
| **Efficiency**        | `(Estimated Hours / Actual Hours) × 100%` |
| **> 100%**            | Task done faster than expected ✅         |
| **= 100%**            | Perfect estimation 🎯                     |
| **< 100%**            | Took longer than expected ⚠️              |

#### Analytics (Admin/Manager)

- Tasks by Status (chart)
- Overdue tasks count
- Completion rate %
- Average efficiency
- Workload per staff member
- Average revision count (quality metric)

---

### 5.8 Employee Management

**URL:** `/admin/employees`  
**Accessible by:** ADMIN, MANAGER

#### Employee Master

A comprehensive profile for each employee/staff member of the firm.

##### Basic Information

- First Name, Last Name, Employee Code
- Email, Mobile, Birth Date
- Designation, Joining Date, Leaving Date
- Monthly Salary / Rate Per Hours
- Status (Active / Inactive)
- Reference, Description

##### Address Details

- Address, Country, State, City, Postal Code

##### Emergency Contact

- Emergency Contact Name, Relationship, Phone

##### Identity & Compliance

- PF Number, ESI Number, Aadhar Number, Driving Licence

##### Travel Documents

- **Passport**: Number, Authority, Date From/To
- **Visa**: Number, Authority, Date From/To
- **EID**: Number, Authority, Date From/To

##### Bank Details

- Bank Name, Branch, Account Number, Account Holder Name, IFSC Code, Bank Address

##### Documents

Employees can have uploaded documents stored on Google Drive:

- Document Type, Date, Format, File Label, Description
- Returnable flag
- Google Drive file link

#### How to Create an Employee

1. Go to **Employees → Employee Master**.
2. Click **"Add Employee"**.
3. Fill in the required fields (Name, Email, Employee Code).
4. Fill in all relevant tabs (Employment, Personal, Bank, Documents).
5. Set **Status** to Active.
6. Click **Save**.

> **Note:** Saving an employee also creates a **login account** for them with the role set to STAFF (configurable).

#### Employee Login Details

Manage login credentials for employees via **Employee Login Detail** page.

#### Employee List

View all employees, filter by designation/status, search by name.

#### Free Employee List

Shows employees who are currently not assigned to any active tasks (available for assignment).

#### Form 108

Generate Form 108 (statutory form) for employees.

---

### 5.9 Attendance

**URLs:** `/admin/employees/attendance/add`, `/admin/employees/attendance/list`  
**Accessible by:** ADMIN, MANAGER (full), STAFF (view own)

#### What It Tracks

Daily attendance records for each employee:

- **Employee** (linked)
- **Date**
- **In Time** (clock-in)
- **Out Time** (clock-out)
- **Status**: `Present / Absent / Half Day / Leave`
- **Description** (optional notes)

#### Adding Attendance

1. Go to **Employees → Add Attendance**.
2. Select the **Employee**.
3. Enter the **Date**.
4. Enter **In Time** and **Out Time**.
5. Set **Status** and optional **Description**.
6. Click **Save**.

#### Viewing / Editing Attendance

1. Go to **Employees → Attendance List**.
2. Filter by Employee and Date range.
3. Click the **Edit** (✏️) icon on any record to update it.
4. Save changes.

---

### 5.10 Timesheet

**URLs:** `/admin/employees/timesheet/*`  
**Accessible by:** ADMIN, MANAGER, STAFF

Three views for analyzing how time was spent on tasks:

#### 1. Task-Wise Timesheet

Shows total time spent per **task** across all employees or a specific employee.

#### 2. Subtask-Wise Timesheet

Breaks down time per **checklist item** within each task.

#### 3. Entry-Wise Timesheet

Shows individual timer **start/stop sessions** in a detailed log format.

#### How to Use

1. Navigate to **Employees → Timesheet → [View Type]**.
2. Select **Employee** (or leave blank for all).
3. Set **Date Range**.
4. Click **Filter** to load results.
5. View the detailed time breakdown in the table.

---

### 5.11 Firm Master

**URL:** `/admin/firm-master`  
**Accessible by:** ADMIN only

#### What It Manages

The complete profile of the CA firm itself — used across invoices, documents, and branding.

##### Basic Information

- Firm Name, Short Name, Firm Type
- Address, Country, State, City, Postal Code
- Mobile, Email, Landline

##### Bank Details

- Bank Name, Branch, Account Number, IFSC, IBAN, SWIFT, MICR, PAN

##### Registration

- GSTIN, Membership No., Membership Date
- FRN (Firm Registration Number), FRN Date
- Licence No., Licence Authority

##### Branding & Configuration

- **Logo** — Upload firm logo (shown on invoices)
- **Signature** — Upload digital signature image
- **Invoice Template** — Choose `template1` or `template2`
- **Invoice Prefix** — e.g., `INV-` → generates `INV-001`
- **Client Code Prefix** — e.g., `CA` → generates `CA001`
- **Show Logo on Invoice** — toggle

##### Communication

- Invoice Emails, Support Emails, Support Mobile
- Social: Website, Facebook, Twitter, Google+, PMS App URL

##### Partners

Manage Firm Partners with:

- Name, Designation
- ICAI Membership Number
- Joining Date
- Signature Image (per partner)
- Status (Active / Inactive)

##### Extra Fields

7 customizable extra fields with custom labels (used in Client Master).

##### Timer Settings

- **Auto Close Hours** — How many idle hours before a timer auto-stops (default: 10 hours).

---

### 5.12 Notices

**Accessible by:** ADMIN, MANAGER (create), All staff (view)

#### What Are Notices?

System-wide announcements shown on the dashboard to all logged-in staff.

#### Notice Types

| Type        | Color / Icon | Use Case              |
| ----------- | ------------ | --------------------- |
| **INFO**    | Blue         | General announcements |
| **WARNING** | Yellow       | Caution messages      |
| **URGENT**  | Red          | Critical alerts       |
| **SUCCESS** | Green        | Positive updates      |

#### Creating a Notice

1. From the dashboard, click **"Create Notice"** (Admin/Manager only).
2. Enter:
   - **Title**
   - **Message**
   - **Type**
   - **Expires At** (optional — auto-hides after this date)
3. Save. The notice appears on all staff dashboards immediately.

---

### 5.13 Analytics

**URL:** `/admin/analytics`  
**Accessible by:** ADMIN, MANAGER

#### Metrics Available

| Section               | Metrics                                             |
| --------------------- | --------------------------------------------------- |
| **Revenue**           | Monthly invoiced amounts, collected vs. outstanding |
| **Clients**           | New clients per month, active vs. inactive          |
| **Tasks**             | Status breakdown, overdue count, completion rate    |
| **Staff Performance** | Tasks per staff, hours logged, efficiency scores    |
| **File Activity**     | Files uploaded per category per month               |
| **Reminders**         | Completed vs. overdue reminders                     |

#### Date Range Filter

All analytics can be filtered by a custom start and end date.

---

### 5.14 Monthly Reports

**URL:** `/admin/monthly-reports`  
**Accessible by:** ADMIN, MANAGER

Generates a summary report for a selected **month and year**, showing:

- Total clients served
- Invoices issued and collected
- Tasks completed
- Staff work hours

---

### 5.15 File Register

**URL:** `/admin/file-register`  
**Accessible by:** ADMIN, MANAGER, STAFF

A **read-only register** table listing every uploaded file across all clients, including:

- Client Name
- File Category
- File Name
- Upload Date
- Uploaded By
- Storage Location (Drive / Local)

Useful for auditing and tracking all documents in one place.

---

### 5.16 Client Portal (CLIENT Role)

When a user with the **CLIENT** role logs in, they are redirected to `/client/dashboard` instead of the admin panel.

#### Client Dashboard

- Shows their profile summary (name, PAN, GST)
- Upcoming payment dues
- Recent file uploads by the CA firm for their account

#### My Files

- View all documents uploaded for their account
- Filter by Category (ITR / GST / Accounting)
- Click to open the file directly on Google Drive

#### Invoices

- View all invoices raised for them
- See payment status: PENDING / PARTIAL / PAID
- Download invoice PDF (if enabled)

#### Profile Settings

- Update their own contact information
- Change password

---

### 5.17 Settings

**URL:** `/admin/settings`  
**Accessible by:** ADMIN only

Application-level settings:

- System preferences
- Notification settings
- Tax configuration (default tax % for invoices)

---

## 6. Database Models

### 6.1 User (Employee / Staff)

| Field                               | Type              | Description                               |
| ----------------------------------- | ----------------- | ----------------------------------------- |
| `username`                          | String            | Unique login ID                           |
| `role`                              | Enum              | ADMIN / MANAGER / STAFF / INTERN / CLIENT |
| `name`, `email`, `phone`            | String            | Basic contact info                        |
| `employeeCode`                      | String            | Employee code                             |
| `designation`                       | String            | Job title                                 |
| `joiningDate`                       | String            | Date of joining                           |
| `monthlySalary`                     | String            | Monthly salary                            |
| `ratePerHours`                      | String            | Hourly rate                               |
| `pfNumber`, `esiNumber`             | String            | Statutory IDs                             |
| `aadharNumber`                      | String            | Aadhaar number                            |
| `bankName`, `accountNo`, `ifscCode` | String            | Bank details                              |
| `passport`, `visa`, `eid`           | Boolean + details | Travel documents                          |
| `documents[]`                       | Array             | Uploaded documents (Drive linked)         |

### 6.2 Client

| Field                                    | Type              | Description                       |
| ---------------------------------------- | ----------------- | --------------------------------- |
| `name`, `email`, `phone`                 | String            | Primary contact                   |
| `clientCode`                             | String            | Auto-generated client code        |
| `panNumber`, `gstNumber`, `aadharNumber` | String            | Compliance IDs                    |
| `groupName`                              | Ref → ClientGroup | Client group                      |
| `itStatus`                               | Ref → ITStatus    | IT filing status                  |
| `masterType`                             | String            | Individual / Company / HUF / Firm |
| `supportEmployee`                        | Ref → User        | Assigned staff                    |
| `driveFolderId`                          | String            | Google Drive root folder ID       |
| `driveItrFolderId`                       | String            | ITR subfolder ID                  |
| `driveGstFolderId`                       | String            | GST subfolder ID                  |
| `multipleContacts[]`                     | Array             | Additional contact persons        |
| `legalDocuments[]`                       | Array             | Legal document files              |

### 6.3 File

| Field              | Type         | Description                        |
| ------------------ | ------------ | ---------------------------------- |
| `clientId`         | Ref → Client | Owner client                       |
| `category`         | Enum         | ITR / GST / ACCOUNTING / USER_DOCS |
| `year`, `month`    | String       | Filing period                      |
| `fileName`         | String       | Stored filename                    |
| `driveFileId`      | String       | Google Drive file ID               |
| `driveWebViewLink` | String       | Shareable Drive URL                |
| `storedIn`         | Enum         | 'drive' or 'local'                 |
| `tags[]`           | Array        | Searchable tags                    |
| `isStarred`        | Boolean      | Starred flag                       |
| `isArchived`       | Boolean      | Archived flag                      |

### 6.4 Invoice

| Field                            | Type         | Description                                |
| -------------------------------- | ------------ | ------------------------------------------ |
| `invoiceNumber`                  | String       | Unique invoice number (e.g. INV-001)       |
| `billingType`                    | Enum         | SINGLE_CLIENT / CLIENT_GROUP               |
| `clientId`                       | Ref → Client | Billed client                              |
| `items[]`                        | Array        | Line items (name, qty, unit price, amount) |
| `subtotal`, `tax`, `totalAmount` | Number       | Amounts                                    |
| `paidAmount`, `balanceAmount`    | Number       | Payment tracking                           |
| `status`                         | Enum         | PENDING / PAID / PARTIAL / CANCELLED       |
| `dueDate`                        | Date         | Payment deadline                           |
| `payments[]`                     | Array        | Payment records (method, amount, date)     |

### 6.5 Task

| Field                  | Type         | Description                                                  |
| ---------------------- | ------------ | ------------------------------------------------------------ |
| `title`, `description` | String       | Task details                                                 |
| `category`             | Enum         | CLIENT_WORK / INTERNAL / REVIEW / FOLLOW_UP / FILING / OTHER |
| `status`               | Enum         | PENDING / STARTED / UNDER_REVIEW / DONE / CANCELLED          |
| `priority`             | Enum         | LOW / MEDIUM / HIGH / URGENT                                 |
| `assignedTo[]`         | Ref → User[] | Assigned staff                                               |
| `clientId`             | Ref → Client | Linked client                                                |
| `targetDate`           | Date         | Deadline                                                     |
| `estimatedHours`       | Number       | Planned duration                                             |
| `actualTimeSpent`      | Number       | Minutes logged                                               |
| `timeEntries[]`        | Array        | Timer sessions (start, end, duration)                        |
| `progressPercentage`   | Number       | 0–100%                                                       |
| `revisionCount`        | Number       | Times sent back for revision                                 |
| `comments[]`           | Array        | Team comments                                                |
| `checklist[]`          | Array        | Subtask checklist items                                      |

### 6.6 Attendance

| Field         | Type       | Description                         |
| ------------- | ---------- | ----------------------------------- |
| `employee`    | Ref → User | Employee                            |
| `date`        | Date       | Attendance date                     |
| `inTime`      | String     | Check-in time                       |
| `outTime`     | String     | Check-out time                      |
| `status`      | String     | Present / Absent / Half Day / Leave |
| `description` | String     | Notes                               |

### 6.7 Reminder

| Field                  | Type         | Description                    |
| ---------------------- | ------------ | ------------------------------ |
| `clientId`             | Ref → Client | Linked client                  |
| `title`, `description` | String       | Reminder details               |
| `dueDate`              | Date         | Deadline                       |
| `reminderType`         | Enum         | ITR / GST / ACCOUNTING / OTHER |
| `priority`             | Enum         | LOW / MEDIUM / HIGH            |
| `status`               | Enum         | PENDING / COMPLETED / OVERDUE  |
| `notifyBefore`         | Number       | Days before due to notify      |

### 6.8 FirmMaster

| Field              | Type   | Description            |
| ------------------ | ------ | ---------------------- |
| `firmName`         | String | Official firm name     |
| `logoUrl`          | String | Logo image URL         |
| `invoicePrefix`    | String | e.g. "INV-"            |
| `clientCodePrefix` | String | e.g. "CA"              |
| `gstin`            | String | GST number             |
| `membershipNo`     | String | ICAI membership        |
| `partners[]`       | Array  | Firm partners list     |
| `invoiceTemplate`  | String | template1 / template2  |
| `autoCloseHours`   | Number | Timer auto-close limit |

### 6.9 Notice

| Field              | Type    | Description                       |
| ------------------ | ------- | --------------------------------- |
| `title`, `message` | String  | Notice content                    |
| `type`             | Enum    | INFO / WARNING / URGENT / SUCCESS |
| `isActive`         | Boolean | Visible or hidden                 |
| `expiresAt`        | Date    | Auto-expire date                  |

---

## 7. API Reference

### Authentication

```
POST   /api/auth/login                    Login with username & password
POST   /api/auth/logout                   Logout (clear session)
GET    /api/auth/me                       Get current user info
```

### Admin / Staff Management

```
GET    /api/admin/users                   List all users/staff
POST   /api/admin/users                   Create new user
PATCH  /api/admin/users/:id               Update user
DELETE /api/admin/users/:id               Delete user
```

### Clients

```
GET    /api/admin/clients                 List all clients
POST   /api/admin/clients                 Create new client
GET    /api/admin/clients/:id             Get client details
PATCH  /api/admin/clients/:id             Update client
DELETE /api/admin/clients/:id             Delete client
GET    /api/admin/clients/groups          Get client groups
```

### Files

```
POST   /api/files/upload                  Upload file (to Drive or local)
GET    /api/files                         List files (with filters)
GET    /api/files/:id                     Get file details
PATCH  /api/files/:id                     Update file metadata (tags, notes, star)
DELETE /api/files/:id                     Delete file
POST   /api/files/:id/archive             Archive/unarchive file
POST   /api/files/:id/star                Star/unstar file
```

### Billing

```
GET    /api/billing/invoices              List invoices
POST   /api/billing/invoices              Create invoice
GET    /api/billing/invoices/:id          Get invoice
PATCH  /api/billing/invoices/:id          Update invoice
DELETE /api/billing/invoices/:id          Delete invoice
POST   /api/billing/invoices/:id/payment  Record payment
GET    /api/billing/ledger/:clientId      Get client ledger
```

### Reminders

```
GET    /api/reminders                     List reminders
POST   /api/reminders                     Create reminder
PATCH  /api/reminders/:id                 Update reminder
DELETE /api/reminders/:id                 Delete reminder
PATCH  /api/reminders/:id/complete        Mark as completed
```

### Tasks

```
POST   /api/tasks                         Create task
GET    /api/tasks                         List tasks (filtered by role)
GET    /api/tasks/:id                     Get task
PATCH  /api/tasks/:id                     Update task (Admin/Manager)
DELETE /api/tasks/:id                     Delete task (Admin/Manager)
PATCH  /api/tasks/:id/status              Update status (Staff)
POST   /api/tasks/:id/timer/start         Start timer
POST   /api/tasks/:id/timer/stop          Stop timer
PATCH  /api/tasks/:id/progress            Update progress %
POST   /api/tasks/:id/comments            Add comment
PATCH  /api/tasks/:id/checklist/:itemId   Update checklist item
GET    /api/tasks/analytics/dashboard     Get analytics data
```

### Attendance

```
GET    /api/attendance                    List attendance records
POST   /api/attendance                    Add attendance record
PUT    /api/attendance/:id                Update attendance record
DELETE /api/attendance/:id                Delete attendance record
```

### Staff / Employees

```
GET    /api/staff                         List staff members
POST   /api/staff                         Create staff
PATCH  /api/staff/:id                     Update staff
GET    /api/staff/timesheet               Get timesheet data
```

### Firm

```
GET    /api/firm                          Get firm master details
POST   /api/firm                          Create firm profile
PATCH  /api/firm/:id                      Update firm
POST   /api/firm/:id/logo                 Upload firm logo
POST   /api/firm/:id/signature            Upload firm signature
```

### Profile

```
GET    /api/profile                       Get own profile
PATCH  /api/profile                       Update own profile
POST   /api/profile/change-password       Change own password
```

### Analytics

```
GET    /api/analytics/overview            Summary stats
GET    /api/analytics/revenue             Revenue chart data
GET    /api/analytics/tasks               Task analytics
GET    /api/analytics/staff               Staff performance
```

### Notices

```
GET    /api/admin/notices                 List active notices
POST   /api/admin/notices                 Create notice
PATCH  /api/admin/notices/:id             Update notice
DELETE /api/admin/notices/:id             Delete notice
```

### Settings

```
GET    /api/settings                      Get system settings
PATCH  /api/settings                      Update settings
```

---

## 8. How to Run the App

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Google Cloud project with Drive API enabled (for file storage)

### Environment Variables

**Server (`server/.env`):**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ca-office
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_root_drive_folder_id
NODE_ENV=development
```

**Client (`client/.env`):**

```env
VITE_API_URL=http://localhost:5000
```

### Running in Development

```bash
# 1. Install all dependencies
cd itr-app
npm install          # root (if applicable)
cd server && npm install
cd ../client && npm install

# 2. Start Backend
cd server
npm run dev          # Runs on http://localhost:5000

# 3. Start Frontend (new terminal)
cd client
npm run dev          # Runs on http://localhost:5173
```

### Creating the First Admin User

```bash
cd server
npx ts-node src/createAdmin.ts
# Follow the prompts to set username and password
```

### Access

- **Admin Portal:** http://localhost:5173/login
- **API Health Check:** http://localhost:5000/api/health

---

## 📝 Changelog / Feature Notes

| Feature             | Status  | Notes                         |
| ------------------- | ------- | ----------------------------- |
| Login + JWT Auth    | ✅ Done | Role-based redirect           |
| Dashboard           | ✅ Done | Full analytics widgets        |
| Client Master       | ✅ Done | With Google Drive integration |
| File Management     | ✅ Done | Drive + local storage         |
| Billing & Invoicing | ✅ Done | Payment tracking, ledger      |
| Reminders           | ✅ Done | ITR/GST/Accounting types      |
| Task Management     | ✅ Done | Kanban + time tracking        |
| Employee Master     | ✅ Done | Full HR profile               |
| Attendance          | ✅ Done | Add + Edit records            |
| Timesheets          | ✅ Done | 3 views (task/subtask/entry)  |
| Firm Master         | ✅ Done | Full firm profile + partners  |
| Notices             | ✅ Done | Dashboard announcements       |
| Analytics           | ✅ Done | Revenue, tasks, staff charts  |
| Client Portal       | ✅ Done | Files, invoices, profile      |
| Monthly Reports     | ✅ Done | Summary by month              |
| Multi-Firm Support  | ✅ Done | MultiFirm model               |
| Google Drive Sync   | ✅ Done | Per-client folder structure   |

---

_Documentation generated for CA Office Portal v1.0 — Last updated: March 2026_
