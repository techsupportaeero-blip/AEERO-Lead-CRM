const fs = require('fs');
let content = fs.readFileSync('c:/Users/lenovo/Desktop/AEERO lead managmentor/backend/database.js', 'utf8');

const replacement = `const seedInitialData = () => {
  const now = new Date().toISOString();
  dbData = {
    users: [
      { id: 1, username: 'admin', password: 'admin123', name: 'Admin User 1', role: 'ADMIN', email: 'admin@aeero.edu', active: true },
      { id: 2, username: 'indu', password: 'Indu@2026', name: 'MS. INDU', role: 'LEAD_FINDER', email: 'indu@aeero.edu', active: true },
      { id: 3, username: 'ayesha', password: 'Ayesha@2026', name: 'MS. AYESHA', role: 'LEAD_FINDER', email: 'ayesha@aeero.edu', active: true },
      { id: 4, username: 'priti', password: 'Priti@2026', name: 'MS. PRITI', role: 'LEAD_FINDER', email: 'priti@aeero.edu', active: true }
    ],
    courses: [
      { id: 1, code: 'SAFETY', name: 'Diploma in Industrial Safety', description: 'Course', price: 120000, active: true }
    ],
    leadSources: [
      { id: 1, name: 'Meta Ads', code: 'META', active: true }
    ],
    customers: [],
    leads: [],
    activities: [],
    followups: [],
    notes: [],
    tasks: [],
    auditLogs: [],
    notifications: [],
    lastLeadId: 0,
    lastActivityId: 0,
    lastFollowupId: 0,
    lastNoteId: 0,
    lastTaskId: 0,
    lastCustomerId: 0,
    lastAuditId: 0,
    lastNotificationId: 0
  };
`;

content = content.replace(/const seedInitialData = \(\) => \{[\s\S]*?dbData = \{[\s\S]*?\n  \};\n/g, replacement);

fs.writeFileSync('c:/Users/lenovo/Desktop/AEERO lead managmentor/backend/database.js', content);

try {
  fs.unlinkSync('c:/Users/lenovo/Desktop/AEERO lead managmentor/backend/aeero_crm_data.json');
} catch (e) {}

console.log("Successfully cleaned up database.js and removed JSON data file.");
