# ⚠️ MANDATORY AI AGENT INSTRUCTION — READ THIS FIRST!
> **CRITICAL TOKEN-EFFICIENCY PROTOCOL FOR ALL AI AGENTS & CODING ASSISTANTS:**
> **BEFORE reading or scanning multiple files across `frontend/` or `backend/`, READ THIS SINGLE FILE FIRST.**
> This document is the **Authoritative System Architecture & Codebase Map** for the AEERO Lead Management CRM.
> It contains the complete frontend routing, component inventory, backend API endpoints, Prisma database schema, authentication credentials, business logic rules, and integration workflows.
> Reading this single file provides 100% full-stack context in a minimal token budget. DO NOT scan unrelated repository files.

---

# AEERO CRM — Complete System Architecture & Codebase Blueprint

## 📌 1. Executive Overview & Core Mission
**AEERO CRM** is an enterprise-grade Lead Management & Student Admission CRM developed specifically for Aviation & Professional Academies (Commercial Pilot License - CPL, Private Pilot License - PPL, Cabin Crew & Ground Staff, Aircraft Maintenance Engineering - AME, Industrial Safety, Sub Fire Officer, and Health Sanitary Inspector).

### Core Capabilities & Business Rules:
1. **Multi-Channel Ingestion**:
   - **Meta Ads Webhook**: Real-time webhook (`POST /api/webhook/meta`) for Facebook & Instagram Lead Ads with HMAC-SHA256 signature verification.
   - **Google Sheets Lead Bridge**: Auto-discovery and batch sync (`POST /api/integrations/google-sheets/*`) from a Google Drive folder (`AEERO LEADS`) with course-specific spreadsheets. Zero hardcoded spreadsheet IDs.
   - **Website / Landing Pages**: Direct REST API endpoint (`POST /api/leads/public`) for web inquiries and UTM campaign attribution.
   - **Manual Inquiries**: Modal-based creation with duplicate detection.
2. **Multi-Tier Idempotency & Duplicate Protection**:
   - **Tier 1 (Primary)**: External Meta Lead ID (`externalLeadId`).
   - **Tier 2 (Secondary)**: Normalized Mobile Number (E.164) + Lowercase Email.
   - **Tier 3 (Tertiary)**: Normalized Mobile Number + Source within a 48-hour tolerance window.
3. **Dynamic Round-Robin Counselor Routing**:
   - Automatically distributes incoming leads among active eligible counselors (`MS. INDU`, `MS. AYESHA`, `MS. PRITI`, `Admin User 1`) dynamically retrieved from the database (`role: LEAD_FINDER` or `ADMIN`, `active: true`). Zero hardcoded names in routing logic.
4. **Complete 360° Lead Lifecycle**:
   - `Inquiry` ➔ `Qualification` ➔ `Call Activity Logs` ➔ `Follow-up Reminders (Calendar & Tasks)` ➔ `Token Advance & Fee Payment Receipts` ➔ `Customer Admission Won`.
5. **Database Architecture**:
   - **Primary**: Neon PostgreSQL Cloud via Prisma ORM 5.x.
   - **Offline / Standalone Fallback**: In-memory indexed engine with disk persistence to `backend/aeero_crm_data.json`.

---

## 🏗️ 2. Global Architecture Flowchart

```
                            ┌─────────────────────────────────────────────────────────┐
                            │              EXTERNAL INGESTION CHANNELS                │
                            └─────────────────────────────────────────────────────────┘
                                       │                                    │
                ┌──────────────────────┴─────────────┐          ┌───────────┴──────────┐
                │    Meta Facebook / Instagram Ads   │          │ Google Drive Folder  │
                │         (Real-time Webhook)        │          │   ("AEERO LEADS")    │
                └──────────────────────┬─────────────┘          └───────────┬──────────┘
                                       │                                    │
                                       ▼                                    ▼
                          POST /api/webhook/meta               Google Apps Script Bridge
                                       │                                    │
                                       │                        POST /api/integrations/
                                       │                         google-sheets/ingest
                                       │                                    │
                                       └──────────────────┬─────────────────┘
                                                          │
                                                          ▼
                                       ┌──────────────────────────────────────┐
                                       │   BACKEND VALIDATION & NORMALIZER    │
                                       ├──────────────────────────────────────┤
                                       │ • Column Alias Mapping (mapper.js)   │
                                       │ • Mobile/Email Clean & E.164 format  │
                                       │ • Course Resolution (courseMatcher)  │
                                       └──────────────────┬───────────────────┘
                                                          │
                                                          ▼
                                       ┌──────────────────────────────────────┐
                                       │      MULTI-TIER DUPLICATE CHECK      │
                                       ├──────────────────────────────────────┤
                                       │ Tier 1: Meta Lead ID                 │
                                       │ Tier 2: Phone + Email                │
                                       │ Tier 3: Phone + Source in 48h window │
                                       └──────────────────┬───────────────────┘
                                                          │
                                           ┌──────────────┴──────────────┐
                                           │                             │
                                     [Duplicate]                    [New Lead]
                                           │                             │
                                           ▼                             ▼
                                    Record Skipped             Generate ID: LD-XXXXXX
                                   Update Statistics          Dynamic Counselor Assign
                                                                         │
                                                                         ▼
                                                          ┌──────────────────────────────┐
                                                          │  AUTHORITATIVE CRM STORAGE   │
                                                          ├──────────────────────────────┤
                                                          │ • Primary: Neon PostgreSQL   │
                                                          │ • Fallback: JSON File Store  │
                                                          └──────────────┬───────────────┘
                                                                         │
                                                                         ▼
                                                          ┌─────────────────────────────┐
                                                          │    FRONTEND REACT 18 SPA    │
                                                          ├─────────────────────────────┤
                                                          │ • Dashboard & Analytics     │
                                                          │ • All Leads & Kanban        │
                                                          │ • Lead Workspace 360        │
                                                          │ • Calendar & Task Manager   │
                                                          │ • Fee Ledger & Receipts     │
                                                          │ • Lead Sources Hub          │
                                                          └─────────────────────────────┘
```

---

## 💻 3. Frontend Architecture (`frontend/src/`)

### 3.1 Technology Stack & State Management
- **Framework**: React 18 SPA built with Vite.
- **Styling**: Tailwind CSS + Custom CSS (`index.css`) with unified Dark (`#0A0D14` / `#151C24`) and Light (`#F1F8FC` / `#FFFFFF`) themes.
- **Icons**: Google Material Symbols & Heroicons.
- **Router Pattern**: State-based client-side router in [`frontend/src/App.jsx`](file:///frontend/src/App.jsx). Active route stored in `localStorage.getItem('aeero_route')`.
- **Session Persistence**: Current user stored in `localStorage.getItem('aeero_user')`. User remains authenticated until explicit Logout button click.

### 3.2 Page & Route Directory (`frontend/src/pages/`)

| Route ID | Component File | Primary Responsibility & Features |
| :--- | :--- | :--- |
| `login` | [`frontend/src/pages/Login.jsx`](file:///frontend/src/pages/Login.jsx) | Authentication screen. Quick-fill credentials box for `admin`, `indu`, `ayesha`, `priti`. Authenticates via `/api/auth/login`. |
| `dashboard` | [`frontend/src/pages/Dashboard.jsx`](file:///frontend/src/pages/Dashboard.jsx) | KPI analytics dashboard. 4 KPI cards (Total Leads, Follow-ups, Won Leads, Conversion Rate), charts, Today's Follow-ups, Overdue Follow-ups, Recent Activities, and Employee Performance table. |
| `leads` | [`frontend/src/pages/AllLeads.jsx`](file:///frontend/src/pages/AllLeads.jsx) | Central Leads Data Grid. Multi-column filters (Status, Counselor, Source, Date range), full-text search, column picker modal, bulk status changes, and Excel/CSV export. |
| `lead-details` | [`frontend/src/pages/LeadWorkspace.jsx`](file:///frontend/src/pages/LeadWorkspace.jsx) | 360° Lead Drawer/Profile. Interaction timeline, quick call outcome logging, follow-up scheduler, notepad, and fee payment receipt generator. |
| `kanban` | [`frontend/src/pages/KanbanBoard.jsx`](file:///frontend/src/pages/KanbanBoard.jsx) | Visual drag & drop stage pipeline. Columns for New, No Answer, Given Details, Interested, Follow-up, Converted, Lost. |
| `tasks` | [`frontend/src/pages/TasksView.jsx`](file:///frontend/src/pages/TasksView.jsx) | Operational task manager. Grouped by priority & due date with counselor filter. |
| `calendar` | [`frontend/src/pages/CalendarView.jsx`](file:///frontend/src/pages/CalendarView.jsx) | Interactive monthly & weekly callback calendar for student appointments & follow-ups. |
| `customers` | [`frontend/src/pages/CustomersView.jsx`](file:///frontend/src/pages/CustomersView.jsx) | Directory of converted leads / enrolled students with course details and fee agreements. |
| `products` | [`frontend/src/pages/CoursesView.jsx`](file:///frontend/src/pages/CoursesView.jsx) | Academy course catalog, fees, durations, and active status toggle. |
| `lead-sources` | [`frontend/src/pages/LeadSourcesView.jsx`](file:///frontend/src/pages/LeadSourcesView.jsx) | Multi-channel integration hub for Meta Webhooks, Google Sheets bridge, and UTM builder. |
| `activities` | [`frontend/src/pages/AuditLogsView.jsx`](file:///frontend/src/pages/AuditLogsView.jsx) | System-wide audit log and counselor activity trail. |
| `ai-assistant` | [`frontend/src/pages/AiAssistantView.jsx`](file:///frontend/src/pages/AiAssistantView.jsx) | AI counseling assistant (Currently disabled/blocked in UI via `ModuleView.jsx`). |
| *(fallback)* | [`frontend/src/pages/ModuleView.jsx`](file:///frontend/src/pages/ModuleView.jsx) | Route distributor for secondary pages. Renders SVG loader for in-progress modules. |

### 3.3 Reusable Modals & Components (`frontend/src/components/`)

| Component File | Type | Responsibility |
| :--- | :--- | :--- |
| [`frontend/src/pages/AddLeadModal.jsx`](file:///frontend/src/pages/AddLeadModal.jsx) | Modal | Manual inquiry entry modal with instant duplicate verification. |
| [`frontend/src/pages/EditLeadModal.jsx`](file:///frontend/src/pages/EditLeadModal.jsx) | Modal | Modal to edit lead fields (Name, Phone, Email, Course, Counselor, Status, Priority). |
| [`frontend/src/components/DuplicateModal.jsx`](file:///frontend/src/components/DuplicateModal.jsx) | Modal | Duplicate alert dialog showing existing lead info, assigned counselor, and "View Existing" or "Create Anyway" options. |
| [`frontend/src/components/ColumnModal.jsx`](file:///frontend/src/components/ColumnModal.jsx) | Modal | Table column selector modal with presets and individual column visibility toggles. |
| [`frontend/src/components/RecordPaymentModal.jsx`](file:///frontend/src/components/RecordPaymentModal.jsx) | Modal | Token advance and tuition installment payment collection modal. |
| [`frontend/src/components/ConfirmModal.jsx`](file:///frontend/src/components/ConfirmModal.jsx) | Modal | Reusable dialog for confirming deletions, archives, and bulk actions. |
| [`frontend/src/components/Header.jsx`](file:///frontend/src/components/Header.jsx) | Component | Top bar with global search, Dark/Light mode toggle, notifications bell, and user menu. |
| [`frontend/src/components/Sidebar.jsx`](file:///frontend/src/components/Sidebar.jsx) | Component | Left navigation bar with badge counters and role-aware navigation links. |
| [`frontend/src/components/DashboardCharts.jsx`](file:///frontend/src/components/DashboardCharts.jsx) | Component | Funnel chart, Monthly Trend line chart, Lead Source donut chart, Course bar chart. |
| [`frontend/src/components/NotificationToast.jsx`](file:///frontend/src/components/NotificationToast.jsx) | Component | Animated toast notification for success, error, and info feedback. |
| [`frontend/src/components/Skeleton.jsx`](file:///frontend/src/components/Skeleton.jsx) | Component | Modern loading skeleton components for cards and data tables. |

### 3.4 API Client & Constants
- [`frontend/src/api/client.js`](file:///frontend/src/api/client.js): Single Axios/Fetch abstraction for all API calls to `http://localhost:3001/api`.
- [`frontend/src/config/constants.js`](file:///frontend/src/config/constants.js): Global enums (`STATUS_MAP`, `PRIORITIES`, `COUNSELORS`, `COURSES`, `LEAD_SOURCES`).

---

## ⚙️ 4. Backend Architecture (`backend/`)

### 4.1 Server Runtime & Environment
- **Runtime**: Node.js + TypeScript executed with `tsx watch src/server.ts` (listening on `http://localhost:3001`).
- **Configuration**: [`backend/.env`](file:///backend/.env) parsed and validated via Zod in [`backend/src/config/env.ts`](file:///backend/src/config/env.ts).
- **ORM / Database**: Prisma Client 5.x connecting to Neon PostgreSQL.

### 4.2 API Routes Map (`backend/src/routes/`)

| Mount Path | Router File | Key Endpoints & Methods |
| :--- | :--- | :--- |
| `/api/health` | `health.routes.ts` | `GET /` — Health check & DB connection status. |
| `/api/auth` | `auth.routes.ts` | `POST /login`, `GET /me`, `POST /logout`. |
| `/api/leads` | `lead.routes.ts` | `GET /` (filters & pagination), `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `POST /check-duplicate`, `POST /bulk-status`. |
| `/api/leads/public` | `publicLead.routes.ts` | `POST /` — Unauthenticated public inquiry endpoint for website landing pages. |
| `/api/activities` | `activity.routes.ts` | `GET /` (leadId filter), `POST /` (log call, note, meeting). |
| `/api/followups` | `followup.routes.ts` | `GET /`, `POST /`, `PATCH /:id`, `GET /today`, `GET /overdue`. |
| `/api/tasks` | `task.routes.ts` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`. |
| `/api/notes` | `note.routes.ts` | `GET /`, `POST /`, `DELETE /:id`. |
| `/api/customers` | `customer.routes.ts` | `GET /`, `POST /`, `GET /:id`. |
| `/api/courses` | `course.routes.ts` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`. |
| `/api/lead-sources` | `leadSource.routes.ts` | `GET /`, `POST /`, `PATCH /:id`. |
| `/api/payments` | `payment.routes.ts` | `GET /`, `POST /`, `GET /receipt/:id`. |
| `/api/stats` | `dashboard.routes.ts` | `GET /` — Aggregated KPI metrics, conversion rates, and employee performance. |
| `/api/audit-logs` | `auditLog.routes.ts` | `GET /` — System audit logs and event history. |
| `/api/notifications` | `notification.routes.ts` | `GET /`, `PATCH /:id/read`. |
| `/api/webhook/meta` | `webhook.routes.ts` | `GET /` (verification challenge), `POST /` (real-time lead ingestion). |
| `/api/integrations/google-sheets` | `googleSheets.routes.ts` | `POST /discover`, `POST /sync`, `POST /ingest`, `GET /sources`. |

---

## 🗄️ 5. Database Schema & Prisma Models (`backend/prisma/schema.prisma`)

### 5.1 Enums
- `Role`: `ADMIN`, `MANAGER`, `LEAD_FINDER`, `VIEWER`
- `LeadStatus`: `NEW`, `NO_ANSWER`, `GIVEN_DETAILS`, `INTERESTED`, `FOLLOW_UP`, `CONVERTED`, `LOST`, `NOT_INTERESTED`, `INVALID`
- `Priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `ActivityType`: `CALL`, `WHATSAPP`, `EMAIL`, `SMS`, `MEETING`, `VIDEO_CALL`, `NOTE`, `OTHER`
- `FollowUpType`: `CALL`, `WHATSAPP`, `EMAIL`, `MEETING`, `CAMPUS_VISIT`

### 5.2 Core Models
1. **`User`**: System counselors and administrators (`id`, `email`, `username`, `password`, `name`, `role`, `active`, `createdAt`).
2. **`Lead`**: Authoritative lead record (`id`, `leadId` [e.g. `LD-000001`], `name`, `email`, `mobile`, `city`, `state`, `courseName`, `source`, `status`, `priority`, `counselorName`, `counselorId`, `feeQuoted`, `tokenAmountPaid`, `externalLeadId`, `metadata`, `createdAt`, `updatedAt`).
3. **`Activity`**: Interactions logged by counselors (`id`, `leadId`, `userId`, `userName`, `type`, `title`, `notes`, `duration`, `createdAt`).
4. **`FollowUp`**: Scheduled callbacks and reminders (`id`, `leadId`, `scheduledAt`, `status`, `notes`, `counselorName`, `createdAt`).
5. **`Task`**: Counselor tasks (`id`, `title`, `description`, `priority`, `dueDate`, `status`, `assignedToId`, `assignedToName`, `leadId`).
6. **`Payment`**: Token advances and tuition installments (`id`, `leadId`, `customerId`, `amount`, `paymentMethod`, `receiptNumber`, `notes`, `createdAt`).
7. **`Customer`**: Converted student directory (`id`, `leadId`, `name`, `email`, `phone`, `course`, `feeAgreed`, `createdAt`).
8. **`Course`**: Academy course catalog (`id`, `code`, `name`, `fee`, `duration`, `active`).
9. **`LeadSource`**: Tracking channels (`id`, `name`, `type`, `active`).
10. **`GoogleSheetSource`**: Spreadsheet sync registry (`id`, `spreadsheetId`, `sheetName`, `status`, `lastProcessedRow`).
11. **`AuditLog`**: System actions audit trail (`id`, `userId`, `action`, `entity`, `entityId`, `details`, `createdAt`).
12. **`Notification`**: User alerts (`id`, `userId`, `title`, `message`, `read`, `type`, `createdAt`).
13. **`LeadCounter`**: Atomic counter for sequential `LD-XXXXXX` IDs.

---

## 🔐 6. Credentials, Ports & Network Configuration

### 6.1 Network Ports
- **Frontend Development Server**: `http://localhost:5173` (or `3000`)
- **Backend API Server**: `http://localhost:3001`

### 6.2 Default User Accounts
| Role | Full Name | Username *(Case-Insensitive)* | Password |
| :--- | :--- | :--- | :--- |
| 👑 **Administrator** | Admin User 1 | `admin` | `admin123` |
| 👩‍💼 **Counselor 1** | MS. INDU | `indu` *(or `MS. INDU`)* | `Indu@2026` |
| 👩‍💼 **Counselor 2** | MS. AYESHA | `ayesha` *(or `MS. AYESHA`)* | `Ayesha@2026` |
| 👩‍💼 **Counselor 3** | MS. PRITI | `priti` *(or `MS. PRITI`)* | `Priti@2026` |

### 6.3 Database Routing Notice (Neon PostgreSQL on Windows)
Neon's domain publishes both IPv6 and IPv4 DNS records. If local IPv6 routing to AWS is blocked, Prisma's Rust query engine hangs on IPv6 timeout.
To guarantee instant connection, `.env` routes via IPv4 with the explicit Neon project option:
```env
DATABASE_URL="postgresql://neondb_owner:npg_Fl1vKWxV5XsT@18.226.241.3:5432/neondb?sslmode=require&options=project%3Dep-purple-field-axi6hd7i"
DIRECT_URL="postgresql://neondb_owner:npg_Fl1vKWxV5XsT@18.226.241.3:5432/neondb?sslmode=require&options=project%3Dep-purple-field-axi6hd7i"
```

---

## 🚀 7. Operational Commands

### Development Server:
```bash
# Terminal 1: Backend (Express + TypeScript + Prisma)
cd backend
npm run dev

# Terminal 2: Frontend (Vite + React)
cd frontend
npm run dev
```

### Prisma Commands:
```bash
cd backend
npx prisma generate     # Regenerate Prisma Client
npx prisma db pull       # Introspect live database schema
npx prisma db push       # Push schema changes to database
```

### Automated Integration Test Suite:
```bash
cd backend
node scripts/test-google-sheets-bridge.js
```
*(All 39 automated integration test assertions pass locally).*
