# AEERO CRM — Backend REST Server

This directory contains the isolated Node.js Express REST API server and persistent database store for AEERO CRM Phase 1.

## 🚀 How to Run Backend

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies (express, cors)
npm install

# 3. Start Express server (Port 3001)
npm start
```

## 📡 REST API Endpoints

- `GET /api/stats` — Dashboard metrics & counter statistics
- `GET /api/leads` — Search & filter lead records
- `GET /api/leads/:id` — Get lead details by Lead ID
- `POST /api/leads` — Create lead with auto-generated ID (`LD-xxxxxx`) & duplicate check
- `POST /api/leads/check-duplicate` — Pre-check mobile & email duplicate
- `PUT /api/leads/:id` — Update lead details
- `DELETE /api/leads/:id` — Delete lead
- `GET /api/leads/:id/activities` — Get activity timeline
- `POST /api/leads/:id/activities` — Log call outcome & update status
- `GET /api/leads/:id/followups` — Get scheduled follow-ups
