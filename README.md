# AEERO CRM Lead Management Core Module

This project contains two completely separated sub-projects:

- `backend/` — Express REST API server (Port 3001) & persistent database.
- `frontend/` — Vite + React frontend web application (Port 3000) using approved AEERO CRM Stitch design.

---

## ⚡ How to Run

### Option 1: Run Both Together (From Workspace Root)

```bash
# Install root & workspace dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start both backend (3001) and frontend (3000) concurrently
npm run dev
```

### Option 2: Run Separately in Two Terminals

#### Terminal 1 — Backend REST Server
```bash
cd backend
npm install
npm start
```

#### Terminal 2 — Frontend App
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:3000`.
