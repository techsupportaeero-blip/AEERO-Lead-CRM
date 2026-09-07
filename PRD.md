# 📖 AEERO CRM — Complete PRD & Comprehensive Codebase Context Map
> **⚡ MANDATORY AI INSTRUCTION (CLAUDE, GEMINI, CHATGPT, AGENTS):**
> **READ THIS SINGLE FILE FIRST BEFORE TOUCHING OR SCANNING ANY CODE!**
> This file contains the complete Product Requirements Document (PRD), business logic, architecture, and a **file-by-file context guide for EVERY file in the repository**.
> Instead of reading 50+ files and burning tokens, this single document gives you 100% full-stack context: frontend pages, components, backend routes, controllers, services, Prisma models, database logic, credentials, and business rules.

---

## 📑 TABLE OF CONTENTS
1. [Product Requirements & Business Logic](#1-product-requirements--business-logic)
2. [Full Tech Stack & Runtime Architecture](#2-full-tech-stack--runtime-architecture)
3. [Frontend Codebase Context Map (`frontend/src/`)](#3-frontend-codebase-context-map-frontendsrc)
   - [Core Application Files](#31-core-application-files)
   - [Pages & Views (`frontend/src/pages/`)](#32-pages--views-frontendsrcpages)
   - [Modals & Reusable Components (`frontend/src/components/`)](#33-modals--reusable-components-frontendsrccomponents)
   - [API Client & Global Config](#34-api-client--global-config)
4. [Backend Codebase Context Map (`backend/src/`)](#4-backend-codebase-context-map-backendsrc)
   - [Server & Configuration](#41-server--configuration)
   - [Routes Layer (`backend/src/routes/`)](#42-routes-layer-backendsrcroutes)
   - [Controllers Layer (`backend/src/controllers/`)](#43-controllers-layer-backendsrccontrollers)
   - [Services Layer (`backend/src/services/`)](#44-services-layer-backendsrcservices)
   - [Middlewares (`backend/src/middleware/`)](#45-middlewares-backendsrcmiddleware)
   - [Validators & Utilities (`backend/src/validators/` & `backend/src/utils/`)](#46-validators--utilities)
   - [Google Sheets Bridge (`backend/integrations/googleSheets/`)](#47-google-sheets-bridge)
5. [Database Schema & Prisma Models (`backend/prisma/`)](#5-database-schema--prisma-models)
6. [Credentials, Roles & Environment Variables](#6-credentials-roles--environment-variables)
7. [Running & Testing the Project](#7-running--testing-the-project)

---

## 1. Product Requirements & Business Logic

### 1.1 Overview & Objective
AEERO CRM is an enterprise-grade Lead Management and Student Enrollment CRM built for Aviation & Vocational Academies (Commercial Pilot License - CPL, Private Pilot License - PPL, Cabin Crew & Ground Staff, Aircraft Maintenance Engineering - AME, Industrial Safety, Sub Fire Officer, and Health Sanitary Inspector).

### 1.2 Core Business Rules
1. **Lead ID Sequencing**: Every lead gets a permanent unique identifier format `LD-XXXXXX` (e.g., `LD-000001`), generated atomically using the `LeadCounter` model.
2. **Dynamic Round-Robin Counselor Routing**:
   - Leads ingested from webhooks, Google Sheets, or web forms are auto-assigned to active counselors (`role: LEAD_FINDER` or `ADMIN`, `active: true`).
   - Active counselors: `MS. INDU`, `MS. AYESHA`, `MS. PRITI`, `Admin User 1`.
   - Routing is 100% dynamic from database users. No hardcoded names in routing logic.
3. **Multi-Tier Duplicate Detection**:
   - **Tier 1**: External Meta Lead ID (`externalLeadId`).
   - **Tier 2**: Normalized Phone (E.164 without spaces/dashes) + Lowercase Email.
   - **Tier 3**: Normalized Phone + Source within a 48-hour tolerance window.
   - If a duplicate is found, the system reports the existing lead ID and assigned counselor, preventing split leads.
4. **Lead Lifecycle Stages (`LeadStatus`)**:
   - `NEW` ➔ Inquiry received, uncontacted.
   - `NO_ANSWER` ➔ Counselor attempted call, student did not answer.
   - `GIVEN_DETAILS` ➔ Brochure/syllabus sent via WhatsApp or Email.
   - `INTERESTED` ➔ Student interested, discussing fees/admission requirements.
   - `FOLLOW_UP` ➔ Callback scheduled at specific date/time.
   - `CONVERTED` ➔ Student enrolled, registration fee/token advance paid.
   - `LOST` ➔ Dropped inquiry (with drop reason).
   - `NOT_INTERESTED` / `INVALID` ➔ Junk/wrong numbers.
5. **Fee & Payment Receipts**:
   - Counselors record token fees and tuition installments.
   - Generates sequential receipt numbers (`REC-XXXXXX`).
   - Auto-creates `Customer` record upon lead conversion.

---

## 2. Full Tech Stack & Runtime Architecture

- **Frontend**:
  - React 18 SPA built with Vite.
  - Tailwind CSS + Vanilla CSS (`index.css`) with synchronized Dark (`#0A0D14` / `#151C24`) and Light (`#F1F8FC` / `#FFFFFF`) palettes.
  - Port: `http://localhost:5173` (or `3000`).
- **Backend**:
  - Node.js + Express with TypeScript.
  - Hot reload runner: `tsx watch src/server.ts`.
  - Port: `http://localhost:3001`.
- **Database**:
  - Primary: Neon Serverless PostgreSQL with Prisma ORM 5.x.
  - Dual-mode fallback: In-memory store with persistence to `backend/aeero_crm_data.json` (standalone engine).

---

## 3. Frontend Codebase Context Map (`frontend/src/`)

### 3.1 Core Application Files
- [`frontend/src/main.jsx`](file:///frontend/src/main.jsx): React DOM bootstrap entrypoint. Renders `<App />` into `index.html`.
- [`frontend/src/App.jsx`](file:///frontend/src/App.jsx): Master application controller & client-side router.
  - Holds top-level states: `currentUser` (from `localStorage`), `currentRoute` (from `localStorage`), `darkMode`, `selectedLeadId`, `globalSearch`, `visibleColumns`, `totalLeadsCount`.
  - Manages root modal states: `showAddLeadModal`, `editingLead`, `duplicateData`, `showColumnModal`.
  - Renders `<Sidebar>`, `<Header>`, and conditionally mounts current page component.
- [`frontend/src/index.css`](file:///frontend/src/index.css): Global styling, custom scrollbars (`.custom-scrollbar`), typography rules, and theme variables.

### 3.2 Pages & Views (`frontend/src/pages/`)
- [`frontend/src/pages/Login.jsx`](file:///frontend/src/pages/Login.jsx):
  - User authentication view.
  - Includes a quick-fill test credentials card for `admin`, `indu`, `ayesha`, `priti`.
  - Communicates with `api.login()`.
- [`frontend/src/pages/Dashboard.jsx`](file:///frontend/src/pages/Dashboard.jsx):
  - Executive KPI dashboard.
  - 4 KPI metric cards: Total Leads, Pending Follow-ups, Converted/Won Leads, Conversion Rate.
  - Interactive charts via `<DashboardCharts>`.
  - Operational Row: Today's Follow-ups, Overdue Follow-ups, Recent Counselor Activities (fixed 350px height scrollable cards).
  - **Employee Performance Table**: Shows lead volume, conversion counts, and conversion % per counselor.
- [`frontend/src/pages/AllLeads.jsx`](file:///frontend/src/pages/AllLeads.jsx):
  - Central Leads Data Table.
  - Multi-filtering: Counselor, Status, Priority, Source, Course, Date Range, Global Search.
  - Features: Column picker integration, bulk status updates, Excel/CSV export, pagination, lead row selection.
  - Clicking a row navigates to `lead-details` (`LeadWorkspace`).
- [`frontend/src/pages/LeadWorkspace.jsx`](file:///frontend/src/pages/LeadWorkspace.jsx):
  - 360° Lead Management Drawer/View for an individual student inquiry.
  - Left panel: Student contact details, course, counselor, stage, fee quoted.
  - Center/Right panel: Quick call outcome buttons (`Call Connected`, `No Answer`, `WhatsApp Sent`), scheduled follow-up picker, interaction timeline, notes notepad, and payment receipts table.
- [`frontend/src/pages/KanbanBoard.jsx`](file:///frontend/src/pages/KanbanBoard.jsx):
  - Drag-and-drop visual pipeline organized by `LeadStatus` columns.
  - Supports moving leads between stages with instant backend status synchronization.
- [`frontend/src/pages/CalendarView.jsx`](file:///frontend/src/pages/CalendarView.jsx):
  - Monthly and weekly calendar showing scheduled callbacks, appointments, and campus visits.
  - Filterable by counselor and follow-up type.
- [`frontend/src/pages/TasksView.jsx`](file:///frontend/src/pages/TasksView.jsx):
  - Operational task manager for counselors.
  - Filter by status (`PENDING`, `COMPLETED`), priority (`HIGH`, `MEDIUM`, `LOW`), and assigned counselor.
- [`frontend/src/pages/CustomersView.jsx`](file:///frontend/src/pages/CustomersView.jsx):
  - Directory of successfully enrolled students/customers.
  - Displays course enrolled, fee agreed, total paid, and admission date.
- [`frontend/src/pages/CoursesView.jsx`](file:///frontend/src/pages/CoursesView.jsx):
  - Academy course catalog manager (CPL, PPL, Cabin Crew, AME, etc.).
  - Add, edit fees, set durations, and toggle active status.
- [`frontend/src/pages/LeadSourcesView.jsx`](file:///frontend/src/pages/LeadSourcesView.jsx):
  - Lead sources hub: Meta Webhook status, Google Sheets Lead Bridge sync controller, and UTM link generator.
- [`frontend/src/pages/AuditLogsView.jsx`](file:///frontend/src/pages/AuditLogsView.jsx):
  - System-wide security and activity audit log viewer.
  - Tracks counselor logins, lead modifications, status changes, and exports.
- [`frontend/src/pages/AiAssistantView.jsx`](file:///frontend/src/pages/AiAssistantView.jsx):
  - AI counseling script generator (Disabled/blocked with administrative shield via `ModuleView.jsx`).
- [`frontend/src/pages/AddLeadModal.jsx`](file:///frontend/src/pages/AddLeadModal.jsx):
  - Modal form to manually create student inquiries.
  - Performs instant duplicate verification before saving.
- [`frontend/src/pages/EditLeadModal.jsx`](file:///frontend/src/pages/EditLeadModal.jsx):
  - Modal form to edit existing lead demographics, status, course, priority, and counselor.
- [`frontend/src/pages/ModuleView.jsx`](file:///frontend/src/pages/ModuleView.jsx):
  - Fallback router/wrapper for secondary modules (`kanban`, `tasks`, `calendar`, `customers`, `products`, `lead-sources`, `activities`).
  - Displays clean SVG `<Loader text="In Progress" />` for unfinished routes.

### 3.3 Modals & Reusable Components (`frontend/src/components/`)
- [`frontend/src/components/Sidebar.jsx`](file:///frontend/src/components/Sidebar.jsx): Collapsible left sidebar navigation with badge counts, theme switcher, and logout button.
- [`frontend/src/components/Header.jsx`](file:///frontend/src/components/Header.jsx): Top navigation header with global search input, theme toggle, notifications dropdown, and user profile avatar.
- [`frontend/src/components/DashboardCharts.jsx`](file:///frontend/src/components/DashboardCharts.jsx): Responsive SVG charts (Funnel Pipeline, Trend Line, Lead Source Donut, Course Bar Chart).
- [`frontend/src/components/ColumnModal.jsx`](file:///frontend/src/components/ColumnModal.jsx): Column picker dialog with presets (Default, Compact, Financial) and column show/hide checkboxes.
- [`frontend/src/components/DuplicateModal.jsx`](file:///frontend/src/components/DuplicateModal.jsx): Duplicate lead warning dialog offering "View Existing Lead" or "Create Anyway".
- [`frontend/src/components/RecordPaymentModal.jsx`](file:///frontend/src/components/RecordPaymentModal.jsx): Collects registration/tuition payments and generates printable receipt numbers.
- [`frontend/src/components/ConfirmModal.jsx`](file:///frontend/src/components/ConfirmModal.jsx): Reusable confirmation dialog for deletions and bulk actions.
- [`frontend/src/components/NotificationToast.jsx`](file:///frontend/src/components/NotificationToast.jsx): Animated toast alert for success, error, and warning messages.
- [`frontend/src/components/Skeleton.jsx`](file:///frontend/src/components/Skeleton.jsx): Reusable skeleton loaders (`TableSkeleton`, `CardSkeleton`) for smooth data fetching UX.
- [`frontend/src/components/StatusBadge.jsx`](file:///frontend/src/components/StatusBadge.jsx): Standardized colored status badge component for all lead stages.
- [`frontend/src/components/Loader.jsx`](file:///frontend/src/components/Loader.jsx): SVG animated chip loader for in-progress pages.

### 3.4 API Client & Global Config
- [`frontend/src/api/client.js`](file:///frontend/src/api/client.js):
  - Central HTTP abstraction layer (`baseURL: http://localhost:3001/api`).
  - Methods: `login()`, `getLeads()`, `createLead()`, `updateLead()`, `checkDuplicate()`, `getStats()`, `getActivities()`, `addActivity()`, `getFollowups()`, `addFollowup()`, `getTasks()`, `addTask()`, `getPayments()`, `addPayment()`, `getCourses()`, `getLeadSources()`, `getAuditLogs()`.
- [`frontend/src/config/constants.js`](file:///frontend/src/config/constants.js):
  - Global status constants, course list, sources, priorities, and default counselor names.

---

## 4. Backend Codebase Context Map (`backend/src/`)

### 4.1 Server & Configuration
- [`backend/src/server.ts`](file:///backend/src/server.ts): Express HTTP server entrypoint. Sets up Helmet, CORS, Cookie-parser, Rate-limiter, mounts `/api`, and tests database connectivity on startup.
- [`backend/src/config/env.ts`](file:///backend/src/config/env.ts): Zod-validated environment config (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`).
- [`backend/src/config/database.ts`](file:///backend/src/config/database.ts): PrismaClient singleton instance with explicit `datasources.db.url` configuration and database ping test (`checkDatabaseConnection`).

### 4.2 Routes Layer (`backend/src/routes/`)
- `index.ts`: Master router that aggregates all sub-routers under `/api`.
- `health.routes.ts`: `GET /api/health` — Database health check.
- `auth.routes.ts`: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- `lead.routes.ts`: `GET /api/leads` (filtered), `POST /api/leads`, `GET /api/leads/:id`, `PATCH /api/leads/:id`, `DELETE /api/leads/:id`, `POST /api/leads/check-duplicate`, `POST /api/leads/bulk-status`.
- `publicLead.routes.ts`: `POST /api/leads/public` — Open inquiry endpoint for web forms.
- `activity.routes.ts`: `GET /api/activities`, `POST /api/activities` (logs calls, emails, notes).
- `followup.routes.ts`: `GET /api/followups`, `POST /api/followups`, `PATCH /api/followups/:id`, `GET /api/followups/today`, `GET /api/followups/overdue`.
- `task.routes.ts`: `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`.
- `note.routes.ts`: `GET /api/notes`, `POST /api/notes`, `DELETE /api/notes/:id`.
- `customer.routes.ts`: `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`.
- `course.routes.ts`: `GET /api/courses`, `POST /api/courses`, `PATCH /api/courses/:id`, `DELETE /api/courses/:id`.
- `leadSource.routes.ts`: `GET /api/lead-sources`, `POST /api/lead-sources`, `PATCH /api/lead-sources/:id`.
- `payment.routes.ts`: `GET /api/payments`, `POST /api/payments`, `GET /api/payments/receipt/:id`.
- `dashboard.routes.ts`: `GET /api/stats` — Aggregates KPIs, conversion rates, and employee performance.
- `auditLog.routes.ts`: `GET /api/audit-logs` — System event logs.
- `notification.routes.ts`: `GET /api/notifications`, `PATCH /api/notifications/:id/read`.
- `webhook.routes.ts`: `GET /api/webhook/meta` (verification challenge), `POST /api/webhook/meta` (lead ingestion).
- `googleSheets.routes.ts`: `POST /api/integrations/google-sheets/discover`, `POST /api/integrations/google-sheets/sync`, `POST /api/integrations/google-sheets/ingest`.

### 4.3 Controllers Layer (`backend/src/controllers/`)
Each controller extracts request parameters, calls the service layer, and returns standardized JSON responses:
- `auth.controller.ts`: Handles login authentication, token cookies, and user info.
- `lead.controller.ts`: CRUD operations, multi-filter query parsing, duplicate checks, and bulk status updates.
- `dashboard.controller.ts`: Calls dashboard service to return computed metrics and analytics.
- `activity.controller.ts`, `followup.controller.ts`, `task.controller.ts`, `note.controller.ts`, `payment.controller.ts`, `customer.controller.ts`, `course.controller.ts`, `leadSource.controller.ts`, `auditLog.controller.ts`, `notification.controller.ts`, `publicLead.controller.ts`.

### 4.4 Services Layer (`backend/src/services/`)
Contains all business logic and Prisma database operations:
- `lead.service.ts`: Atomic `LD-XXXXXX` generation, 3-tier duplicate checks, round-robin counselor assignment, filtering, pagination, and status updates.
- `dashboard.service.ts`: Calculates total leads, conversion rates, today/overdue follow-ups, and employee performance metrics.
- `auth.service.ts`: Password verification with bcrypt, JWT token generation, case-insensitive username lookup.
- `activity.service.ts`, `followup.service.ts`, `task.service.ts`, `note.service.ts`, `payment.service.ts`, `customer.service.ts`, `course.service.ts`, `leadSource.service.ts`, `auditLog.service.ts`, `notification.service.ts`.

### 4.5 Middlewares (`backend/src/middleware/`)
- `auth.middleware.ts`: Verifies JWT from `Authorization: Bearer <token>` or HTTP-only cookies. Attaches `req.user`.
- `role.middleware.ts`: Restricts routes to specific roles (`ADMIN`, `MANAGER`, etc.).
- `validate.middleware.ts`: Validates request body, query, and params against Zod schemas.
- `rateLimit.middleware.ts`: Protects endpoints against brute-force attacks.
- `error.middleware.ts`: Centralized error handler returning consistent error JSON.

### 4.6 Validators & Utilities
- **Validators (`backend/src/validators/`)**: Zod validation schemas for `lead`, `auth`, `activity`, `followup`, `task`, `payment`, `course`, `leadSource`, `note`.
- **Utils (`backend/src/utils/`)**:
  - `generateLeadId.ts`: Atomic counter generation for sequential IDs (`LD-000001`).
  - `jwt.ts`: JWT signing and token verification.
  - `password.ts`: Bcrypt hashing and comparison.
  - `pagination.ts`: Pagination offset and limit calculator.
  - `response.ts`: Standard response formatter `{ success: true, data, message }`.
  - `logger.ts`: Structured console logging.

### 4.7 Google Sheets Bridge (`backend/integrations/googleSheets/`)
- `discovery.js`: Discovers all spreadsheets in the configured Google Drive folder.
- `courseMatcher.js`: Fuzzy-matches spreadsheet and campaign names against course catalog.
- `mapper.js`: Normalizes diverse column names (Phone, Mobile, Contact, Email, Name) to standard fields.
- `reader.js`: Batch reads rows starting from `lastProcessedRow + 1`.
- `sync.js`: Executes sync, checks duplicates, assigns counselors, and records sync status.
- `mockAdapter.js`: In-memory simulator providing 10+ course lead spreadsheets for offline verification.
- `google-apps-script.js`: Production Apps Script to deploy in Google Drive for continuous sync.

---

## 5. Database Schema & Prisma Models (`backend/prisma/schema.prisma`)

### 5.1 Enums
- `Role`: `ADMIN`, `MANAGER`, `LEAD_FINDER`, `VIEWER`
- `LeadStatus`: `NEW`, `NO_ANSWER`, `GIVEN_DETAILS`, `INTERESTED`, `FOLLOW_UP`, `CONVERTED`, `LOST`, `NOT_INTERESTED`, `INVALID`
- `Priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `ActivityType`: `CALL`, `WHATSAPP`, `EMAIL`, `SMS`, `MEETING`, `VIDEO_CALL`, `NOTE`, `OTHER`
- `FollowUpType`: `CALL`, `WHATSAPP`, `EMAIL`, `MEETING`, `CAMPUS_VISIT`

### 5.2 14 Database Models
1. `User`: `id`, `email`, `username`, `password`, `name`, `role`, `active`, `createdAt`, `updatedAt`
2. `Lead`: `id`, `leadId` (unique `LD-XXXXXX`), `name`, `email`, `mobile`, `city`, `state`, `courseName`, `courseId`, `source`, `status`, `priority`, `counselorName`, `counselorId`, `feeQuoted`, `tokenAmountPaid`, `externalLeadId`, `metadata`, `createdAt`, `updatedAt`
3. `Activity`: `id`, `leadId`, `userId`, `userName`, `type`, `title`, `notes`, `duration`, `createdAt`
4. `FollowUp`: `id`, `leadId`, `scheduledAt`, `status`, `notes`, `counselorName`, `createdAt`
5. `Task`: `id`, `title`, `description`, `priority`, `dueDate`, `status`, `assignedToId`, `assignedToName`, `leadId`, `createdAt`
6. `Note`: `id`, `leadId`, `content`, `createdById`, `createdByName`, `createdAt`
7. `Payment`: `id`, `leadId`, `customerId`, `amount`, `paymentMethod`, `transactionId`, `receiptNumber`, `notes`, `status`, `createdAt`
8. `Customer`: `id`, `leadId`, `name`, `email`, `phone`, `course`, `feeAgreed`, `totalPaid`, `admissionDate`, `createdAt`
9. `Course`: `id`, `code`, `name`, `fee`, `duration`, `active`, `createdAt`
10. `LeadSource`: `id`, `name`, `type`, `active`, `createdAt`
11. `GoogleSheetSource`: `id`, `spreadsheetId`, `sheetName`, `driveFolderId`, `status`, `lastProcessedRow`, `createdAt`
12. `AuditLog`: `id`, `userId`, `action`, `entity`, `entityId`, `details`, `createdAt`
13. `Notification`: `id`, `userId`, `title`, `message`, `read`, `type`, `createdAt`
14. `LeadCounter`: `id`, `currentVal`

---

## 6. Credentials, Roles & Environment Variables

### 6.1 Default User Accounts
| Role | Full Name | Username *(Case-Insensitive)* | Password |
| :--- | :--- | :--- | :--- |
| 👑 **Administrator** | Admin User 1 | `admin` | `admin123` |
| 👩‍💼 **Counselor 1** | MS. INDU | `indu` *(or `MS. INDU`)* | `Indu@2026` |
| 👩‍💼 **Counselor 2** | MS. AYESHA | `ayesha` *(or `MS. AYESHA`)* | `Ayesha@2026` |
| 👩‍💼 **Counselor 3** | MS. PRITI | `priti` *(or `MS. PRITI`)* | `Priti@2026` |

### 6.2 Environment Configuration (`backend/.env`)
- `PORT`: `3001`
- `NODE_ENV`: `development`
- `DATABASE_URL`: Neon PostgreSQL connection string routed via IPv4 + endpoint project option:
  `postgresql://neondb_owner:npg_Fl1vKWxV5XsT@18.226.241.3:5432/neondb?sslmode=require&options=project%3Dep-purple-field-axi6hd7i`
- `DIRECT_URL`: Direct connection string (same IPv4 routing).
- `JWT_SECRET`: `super_secret_jwt_key_aeero_2026_crm_secure`
- `CORS_ORIGIN`: `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173`

---

## 7. Running & Testing the Project

### Running Servers
```bash
# Terminal 1: Backend (Node + TypeScript + Prisma)
cd backend
npm run dev

# Terminal 2: Frontend (Vite + React)
cd frontend
npm run dev
```

### Database Management
```bash
cd backend
npx prisma generate     # Regenerates Prisma Client
npx prisma db pull       # Pulls live schema from Neon
npx prisma db push       # Pushes local schema to Neon
```

### Integration Tests
```bash
cd backend
node scripts/test-google-sheets-bridge.js
```
*(All 39 automated test assertions run and pass with zero dependencies).*
