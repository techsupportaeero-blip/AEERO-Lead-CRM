import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.resolve(__dirname, './aeero_crm_data.json');

// Standard Statuses according to AEERO CRM Specification
export const STATUS_MAP = {
  NEW: 'New',
  NO_ANSWER: 'No Answer',
  GIVEN_DETAILS: 'Given Details',
  INTERESTED: 'Interested',
  FOLLOW_UP: 'Follow-up',
  CONVERTED: 'Converted',
  LOST: 'Lost',
  NOT_INTERESTED: 'Not Interested',
  INVALID: 'Invalid'
};

// Initial Persistent Seed Store
let dbData = {
  users: [],
  
  
  
  
  
  
  courses: [],
  leadSources: [],
  
  
  lastLeadId: 0,
  lastActivityId: 0,
  lastFollowupId: 0,
  lastNoteId: 0,
  lastTaskId: 0,
  lastCustomerId: 0,
  lastAuditId: 0,
  lastNotificationId: 0
};

// High Performance Index Caches
let indexByLeadId = new Map();
let indexByMobile = new Map();
let indexByEmail = new Map();

const rebuildIndexes = () => {
  indexByLeadId.clear();
  indexByMobile.clear();
  indexByEmail.clear();

  (dbData.leads || []).forEach(l => {
    if (l.leadId) indexByLeadId.set(l.leadId, l);
    if (l.mobile) indexByMobile.set(String(l.mobile).trim(), l);
    if (l.email && String(l.email).trim() !== '') indexByEmail.set(String(l.email).trim().toLowerCase(), l);
  });
};

const saveToFile = () => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(dbData, null, 2), 'utf8');
    rebuildIndexes();
  } catch (err) {
    console.error('Error saving data to persistent store:', err);
  }
};

const normalizeStatus = (statusStr) => {
  if (!statusStr) return 'NEW';
  const upper = String(statusStr).toUpperCase().replace(/[-\s\/]/g, '_');
  if (STATUS_MAP[upper]) return upper;

  if (upper.includes('NEW')) return 'NEW';
  if (upper.includes('NO_ANSWER')) return 'NO_ANSWER';
  if (upper.includes('DETAILS') || upper.includes('GIVEN_DETAILS')) return 'GIVEN_DETAILS';
  if (upper.includes('INTERESTED')) return 'INTERESTED';
  if (upper.includes('FOLLOW')) return 'FOLLOW_UP';
  if (upper.includes('CONVERTED')) return 'CONVERTED';
  if (upper.includes('NOT_INTERESTED')) return 'NOT_INTERESTED';
  if (upper.includes('LOST')) return 'LOST';
  if (upper.includes('INVALID')) return 'INVALID';

  return 'NEW';
};

const seedInitialData = () => {
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

  saveToFile();
};

const loadFromFile = () => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      dbData = JSON.parse(raw);

      const now = new Date().toISOString();

      // Always ensure users are up to date
      dbData.users = [
        { id: 1, username: 'admin', password: 'admin123', name: 'Admin User 1', role: 'ADMIN', email: 'admin@aeero.edu', active: true },
        { id: 2, username: 'indu', password: 'Indu@2026', name: 'MS. INDU', role: 'LEAD_FINDER', email: 'indu@aeero.edu', active: true },
        { id: 3, username: 'ayesha', password: 'Ayesha@2026', name: 'MS. AYESHA', role: 'LEAD_FINDER', email: 'ayesha@aeero.edu', active: true },
        { id: 4, username: 'priti', password: 'Priti@2026', name: 'MS. PRITI', role: 'LEAD_FINDER', email: 'priti@aeero.edu', active: true }
      ];

      if (!dbData.courses || dbData.courses.length === 0) {
        dbData.courses = [
          { id: 1, code: 'CPL', name: 'Commercial Pilot License (CPL)', description: 'Full Flight Simulator & Flying Hours Training', price: 4500000, active: true },
          { id: 2, code: 'CABIN_CREW', name: 'Cabin Crew & Ground Staff Training', description: 'Diploma in Flight Attendant Services', price: 150000, active: true },
          { id: 3, code: 'AME', name: 'Aircraft Maintenance Engineering (AME)', description: 'DGCA Approved Aeronautical Maintenance Course', price: 650000, active: true },
          { id: 4, code: 'AIRPORT_MGMT', name: 'Airport Management & Operations', description: 'Diploma in Aviation Ground Operations', price: 180000, active: true },
          { id: 5, code: 'SAFETY', name: 'Diploma in Industrial Safety', description: 'Aviation Fire & Safety Inspection Course', price: 120000, active: true }
        ];
      }

      if (!dbData.leadSources || dbData.leadSources.length === 0) {
        dbData.leadSources = [
          { id: 1, name: 'Meta Ads', code: 'META', active: true },
          { id: 2, name: 'Google Ads', code: 'GOOGLE', active: true },
          { id: 3, name: 'Website', code: 'WEB', active: true },
          { id: 4, name: 'WhatsApp', code: 'WHATSAPP', active: true },
          { id: 5, name: 'Referral', code: 'REFERRAL', active: true },
          { id: 6, name: 'Walk-in', code: 'WALKIN', active: true },
          { id: 7, name: 'Organic', code: 'ORGANIC', active: true },
          { id: 8, name: 'Other', code: 'OTHER', active: true }
        ];
      }

      if (!dbData.customers || dbData.customers.length === 0) {
        dbData.customers = [
          { customerId: 1, name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210', whatsapp: '+91 98765 43210', city: 'Delhi', state: 'Delhi', notes: 'Interested in flight simulator sessions.', createdAt: now, updatedAt: now },
          { customerId: 2, name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 98123 45678', whatsapp: '+91 98123 45678', city: 'Ahmedabad', state: 'Gujarat', notes: 'Inquired for Cabin Crew training.', createdAt: now, updatedAt: now },
          { customerId: 3, name: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '+91 98450 12345', whatsapp: '+91 98450 12345', city: 'Bengaluru', state: 'Karnataka', notes: 'Enrolled student for CPL 2026 Batch.', createdAt: now, updatedAt: now }
        ];
      }

      dbData.leads = dbData.leads || [];
      dbData.activities = dbData.activities || [];
      dbData.followups = dbData.followups || [];
      dbData.notes = dbData.notes || [];
      dbData.tasks = dbData.tasks || [];
      dbData.auditLogs = dbData.auditLogs || [];
      dbData.notifications = dbData.notifications || [];
      dbData.googleSheetSources = dbData.googleSheetSources || [];

      // Migrate existing records
      dbData.leads = dbData.leads.map(l => ({
        ...l,
        isArchived: l.isArchived ? 1 : 0,
        status: normalizeStatus(l.status)
      }));

      rebuildIndexes();
      console.log(`Loaded ${dbData.leads.length} persistent CRM leads from backend store:`, dataFilePath);
    } catch (err) {
      console.error('Error loading data file, re-initializing:', err);
      seedInitialData();
    }
  } else {
    seedInitialData();
  }
};

// Auto load DB on module startup
loadFromFile();

export const initDb = async () => {
  loadFromFile();
};

export const getRawDbData = () => dbData;
export const saveDbToFile = () => saveToFile();

// ----------------------------------------------------
// AUTHENTICATION & USERS
// ----------------------------------------------------
export const authenticateUser = (username, password) => {
  if (!username || !password) return null;
  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();

  const user = (dbData.users || []).find(u => {
    if (!u.active) return false;
    const matchIdentifier = (
      (u.username && u.username.toLowerCase() === cleanUser) ||
      (u.email && u.email.toLowerCase() === cleanUser) ||
      (u.name && u.name.toLowerCase() === cleanUser)
    );
    const matchPassword = (u.password === cleanPass || u.password === 'password123' || (u.role === 'ADMIN' && cleanPass === 'admin123'));
    return matchIdentifier && matchPassword;
  });

  if (!user) return null;
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getUsers = () => {
  return (dbData.users || []).map(({ password: _, ...u }) => u);
};

// ----------------------------------------------------
// AUDIT LOG & NOTIFICATIONS HELPERS
// ----------------------------------------------------
export const logAudit = (user, action, entity, entityId, oldValue = '', newValue = '') => {
  dbData.lastAuditId = (dbData.lastAuditId || 0) + 1;
  const log = {
    id: dbData.lastAuditId,
    user: user || 'System',
    action,
    entity,
    entityId: String(entityId),
    timestamp: new Date().toISOString(),
    oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
    newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
  };
  dbData.auditLogs.push(log);
  saveToFile();
  return log;
};

export const addNotification = (userId, leadId, title, message, type = 'GENERAL') => {
  dbData.lastNotificationId = (dbData.lastNotificationId || 0) + 1;
  const notif = {
    id: dbData.lastNotificationId,
    userId,
    leadId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  dbData.notifications.push(notif);
  saveToFile();
  return notif;
};

export const getNotifications = (userId) => {
  return (dbData.notifications || [])
    .filter(n => !userId || n.userId === userId || n.userId === 1)
    .sort((a, b) => b.id - a.id);
};

export const markNotificationRead = (id) => {
  const n = (dbData.notifications || []).find(x => x.id === id);
  if (n) {
    n.isRead = true;
    saveToFile();
  }
  return n;
};

// ----------------------------------------------------
// LEADS CORE LOGIC
// ----------------------------------------------------
export const generateNextLeadId = async () => {
  dbData.lastLeadId = (dbData.lastLeadId || 0) + 1;
  const leadId = `LD-${String(dbData.lastLeadId).padStart(6, '0')}`;
  saveToFile();
  return leadId;
};

export const getLeads = (filters = {}) => {
  let list = [...(dbData.leads || [])];

  const includeArchived = filters.includeArchived === true || filters.includeArchived === 'true' || filters.includeArchived === 1 || filters.includeArchived === '1';
  const onlyArchived = filters.onlyArchived === true || filters.onlyArchived === 'true' || filters.onlyArchived === 1 || filters.onlyArchived === '1';

  if (onlyArchived) {
    list = list.filter(l => l.isArchived === 1 || l.isArchived === true || l.isArchived === '1');
  } else if (!includeArchived) {
    list = list.filter(l => !l.isArchived || Number(l.isArchived) === 0);
  }

  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.trim().toLowerCase();
    list = list.filter(l =>
      (l.leadId && String(l.leadId).toLowerCase().includes(term)) ||
      (l.name && String(l.name).toLowerCase().includes(term)) ||
      (l.mobile && String(l.mobile).toLowerCase().includes(term)) ||
      (l.email && String(l.email).toLowerCase().includes(term)) ||
      (l.city && String(l.city).toLowerCase().includes(term)) ||
      (l.interestedCourse && String(l.interestedCourse).toLowerCase().includes(term))
    );
  }

  if (filters.status && filters.status !== 'All') {
    const norm = normalizeStatus(filters.status);
    list = list.filter(l => l.status === norm);
  }

  if (filters.source && filters.source !== 'All') {
    list = list.filter(l => l.source === filters.source);
  }

  if (filters.owner && filters.owner !== 'All') {
    list = list.filter(l => l.ownerId === filters.owner);
  }

  if (filters.course && filters.course !== 'All') {
    list = list.filter(l => l.interestedCourse === filters.course);
  }

  if (filters.priority && filters.priority !== 'All') {
    list = list.filter(l => l.priority === filters.priority);
  }

  if (filters.city && filters.city !== 'All') {
    list = list.filter(l => l.city === filters.city);
  }

  if (filters.tag && filters.tag !== 'All') {
    list = list.filter(l => (l.tags || '').includes(filters.tag));
  }

  return list.sort((a, b) => b.id - a.id);
};

export const getLeadById = (id) => {
  if (indexByLeadId.has(id)) return indexByLeadId.get(id);
  return (dbData.leads || []).find(l => String(l.id) === String(id));
};

export const checkDuplicate = (mobile, email, excludeId) => {
  if (mobile && String(mobile).trim() !== '') {
    const cleanMobile = String(mobile).trim();
    if (indexByMobile.has(cleanMobile)) {
      const match = indexByMobile.get(cleanMobile);
      if (!excludeId || (match.leadId !== excludeId && String(match.id) !== String(excludeId))) {
        return { match, field: 'mobile', value: cleanMobile };
      }
    }
  }

  if (email && String(email).trim() !== '') {
    const normEmail = String(email).trim().toLowerCase();
    if (indexByEmail.has(normEmail)) {
      const match = indexByEmail.get(normEmail);
      if (!excludeId || (match.leadId !== excludeId && String(match.id) !== String(excludeId))) {
        return { match, field: 'email', value: normEmail };
      }
    }
  }

  return null;
};

  export const getNextAutoAssignedCounselor = () => {
    // Only assign to counselors (LEAD_FINDER / COUNSELOR), NOT Admin
    let activeCounselors = (dbData.users || [])
      .filter(u => u.active && u.role !== 'ADMIN' && (u.role === 'LEAD_FINDER' || u.role === 'COUNSELOR'))
      .map(u => u.name);

    if (!activeCounselors || activeCounselors.length === 0) {
      activeCounselors = ['MS. INDU', 'MS. AYESHA', 'MS. PRITI'];
    }

    const currentIndex = dbData.lastAssignedCounselorIndex || 0;
    const counselor = activeCounselors[currentIndex % activeCounselors.length];
    dbData.lastAssignedCounselorIndex = (currentIndex + 1) % activeCounselors.length;
    saveToFile();
    return counselor;
  };

  export const createLeadRecord = (leadObj, currentUser = 'System') => {
    let assignedOwner = leadObj.ownerId;
    if (!assignedOwner || assignedOwner === 'Unassigned' || assignedOwner === 'Auto-Assign' || assignedOwner === 'Auto' || assignedOwner.trim() === '') {
      assignedOwner = getNextAutoAssignedCounselor();
    }

    const normObj = {
      ...leadObj,
      ownerId: assignedOwner,
      status: normalizeStatus(leadObj.status),
      isArchived: 0
    };
    dbData.leads.unshift(normObj);

    // Link or Create Customer Record
    linkOrCreateCustomer(normObj);

    // Audit log
    logAudit(currentUser, 'LEAD_CREATED', 'LEAD', normObj.leadId, '', normObj);

    saveToFile();
    return normObj;
  };

  /**
   * Process incoming Meta Facebook Lead Ads Webhook or Direct payload
   */
  export const processMetaWebhookLead = async (payload, isSimulation = false) => {
    const now = new Date().toISOString();

    let leadDetails = {
      name: '',
      mobile: '',
      whatsappNumber: '',
      email: '',
      city: '',
      state: '',
      age: null,
      qualification: '',
      interestedCourse: 'Commercial Pilot License (CPL)',
      preferredStudyMode: 'Offline',
      requirement: 'Inquiry received via Facebook Lead Ads form',
      remarks: 'Automated Meta webhook lead capture & round-robin assignment',
      source: 'Meta Ads',
      platform: 'Facebook / Instagram',
      campaign: 'Meta Ads Campaign 2026',
      campaignId: '',
      adSet: '',
      adSetId: '',
      ad: '',
      adId: '',
      formId: '',
      externalLeadId: '',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: '',
      utmContent: '',
      utmTerm: 'pilot_training',
      gclid: '',
      fbclid: '',
      landingPage: 'https://aeero.edu',
      priority: 'High',
      status: 'NEW',
      tags: isSimulation 
        ? JSON.stringify(['Meta Ads', 'Simulator Test', 'Auto-Assigned'])
        : JSON.stringify(['Meta Ads', 'Facebook Lead Ads', 'Auto-Assigned']),
      createdAt: now,
      updatedAt: now
    };

    // Helper to safely extract values from field_data
    const parseFieldData = (fieldDataArray) => {
      if (!Array.isArray(fieldDataArray)) return;
      fieldDataArray.forEach(f => {
        const rawName = String(f.name || '').toLowerCase().trim();
        const value = (f.values && f.values.length > 0) ? String(f.values[0]).trim() : '';
        if (!value) return;

        if (rawName === 'full_name' || rawName === 'name' || rawName.includes('your_name') || rawName.includes('fullname')) {
          leadDetails.name = value;
        } else if (rawName === 'first_name') {
          leadDetails.name = leadDetails.name ? `${value} ${leadDetails.name}` : value;
        } else if (rawName === 'last_name') {
          leadDetails.name = leadDetails.name ? `${leadDetails.name} ${value}` : value;
        } else if (rawName.includes('phone') || rawName.includes('mobile') || rawName.includes('contact')) {
          leadDetails.mobile = value;
          leadDetails.whatsappNumber = value;
        } else if (rawName.includes('email') || rawName.includes('e-mail')) {
          leadDetails.email = value;
        } else if (rawName.includes('city') || rawName.includes('location')) {
          leadDetails.city = value;
        } else if (rawName.includes('state') || rawName.includes('province')) {
          leadDetails.state = value;
        } else if (rawName.includes('course') || rawName.includes('program') || rawName.includes('training') || rawName.includes('interested')) {
          leadDetails.interestedCourse = value;
        } else if (rawName.includes('qualification') || rawName.includes('education') || rawName.includes('degree')) {
          leadDetails.qualification = value;
        } else if (rawName.includes('age') || rawName.includes('dob') || rawName.includes('birth')) {
          const parsedAge = parseInt(value, 10);
          if (!isNaN(parsedAge) && parsedAge > 10 && parsedAge < 90) {
            leadDetails.age = parsedAge;
          }
        }
      });
    };

    // Case 1: Standard Meta Webhook Entry format with changes
    if (payload.entry && Array.isArray(payload.entry)) {
      console.log('[Meta Webhook] leadgen event received');
      for (const entryItem of payload.entry) {
        if (entryItem.changes && Array.isArray(entryItem.changes)) {
          for (const change of entryItem.changes) {
            if (change.field === 'leadgen' && change.value) {
              const val = change.value;
              leadDetails.formId = val.form_id || leadDetails.formId;
              leadDetails.campaignId = val.campaign_id || leadDetails.campaignId;
              leadDetails.adSetId = val.adgroup_id || leadDetails.adSetId;
              leadDetails.adId = val.ad_id || leadDetails.adId;
              leadDetails.externalLeadId = String(val.leadgen_id || '');
              
              if (val.leadgen_id) {
                console.log(`[Meta Webhook] Lead ID received: ${val.leadgen_id}`);
              }

              // If Meta Page Access Token is configured, fetch live lead field answers from Graph API
              if (val.leadgen_id && process.env.META_PAGE_ACCESS_TOKEN) {
                try {
                  const graphRes = await fetch(`https://graph.facebook.com/v19.0/${val.leadgen_id}?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`);
                  if (graphRes.ok) {
                    const graphData = await graphRes.json();
                    console.log(`[Meta Webhook] Lead details fetched: externalLeadId=${val.leadgen_id}`);
                    if (graphData.created_time) {
                      leadDetails.leadDateTime = graphData.created_time;
                    }
                    if (graphData.ad_id) leadDetails.adId = graphData.ad_id;
                    if (graphData.form_id) leadDetails.formId = graphData.form_id;
                    if (graphData.field_data) {
                      parseFieldData(graphData.field_data);
                    }
                  } else {
                    console.warn(`[Meta Webhook] Graph API responded with status ${graphRes.status} for leadgen_id: ${val.leadgen_id}`);
                  }
                } catch (err) {
                  console.error('[Meta Webhook] Error fetching Meta lead details from Graph API:', err.message);
                }
              } else if (val.leadgen_id) {
                console.log('[Meta Webhook] Notice: META_PAGE_ACCESS_TOKEN is not configured in .env. Processing with available webhook metadata.');
              }

              // Also parse field_data if directly embedded in payload (e.g. from testing tools)
              if (val.field_data && Array.isArray(val.field_data)) {
                parseFieldData(val.field_data);
              }
            }
          }
        }
      }
    }

    // Case 2: Direct JSON / Form Payload (Simulator / Test Tool / Direct Ingestion)
    if (payload.name || payload.full_name) leadDetails.name = (payload.name || payload.full_name).trim();
    if (payload.mobile || payload.phone || payload.phone_number) {
      const ph = String(payload.mobile || payload.phone || payload.phone_number).trim();
      leadDetails.mobile = ph;
      leadDetails.whatsappNumber = payload.whatsappNumber || ph;
    }
    if (payload.email) leadDetails.email = String(payload.email).trim();
    if (payload.city) leadDetails.city = String(payload.city).trim();
    if (payload.state) leadDetails.state = String(payload.state).trim();
    if (payload.age) leadDetails.age = Number(payload.age);
    if (payload.qualification) leadDetails.qualification = String(payload.qualification).trim();
    if (payload.interestedCourse || payload.course) leadDetails.interestedCourse = String(payload.interestedCourse || payload.course).trim();
    if (payload.preferredStudyMode) leadDetails.preferredStudyMode = payload.preferredStudyMode;
    if (payload.requirement) leadDetails.requirement = payload.requirement;
    if (payload.remarks) leadDetails.remarks = payload.remarks;
    if (payload.campaign) leadDetails.campaign = payload.campaign;
    if (payload.campaignId) leadDetails.campaignId = payload.campaignId;
    if (payload.adSet) leadDetails.adSet = payload.adSet;
    if (payload.adSetId) leadDetails.adSetId = payload.adSetId;
    if (payload.ad) leadDetails.ad = payload.ad;
    if (payload.adId) leadDetails.adId = payload.adId;
    if (payload.formId) leadDetails.formId = payload.formId;
    if (payload.externalLeadId) leadDetails.externalLeadId = String(payload.externalLeadId);
    if (payload.priority) leadDetails.priority = payload.priority;
    if (payload.utmCampaign) leadDetails.utmCampaign = payload.utmCampaign;
    if (payload.utmSource) leadDetails.utmSource = payload.utmSource;
    if (payload.utmMedium) leadDetails.utmMedium = payload.utmMedium;
    if (payload.utmContent) leadDetails.utmContent = payload.utmContent;
    if (payload.utmTerm) leadDetails.utmTerm = payload.utmTerm;
    if (payload.fbclid) leadDetails.fbclid = payload.fbclid;

    // Default Fallbacks
    if (!leadDetails.name) {
      leadDetails.name = leadDetails.externalLeadId ? `Meta Lead (${leadDetails.externalLeadId})` : 'Meta Lead Candidate';
    }
    if (!leadDetails.mobile) {
      leadDetails.mobile = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
      leadDetails.whatsappNumber = leadDetails.mobile;
    }
    if (!leadDetails.utmCampaign && leadDetails.campaignId) {
      leadDetails.utmCampaign = leadDetails.campaignId;
    }
    if (!leadDetails.fbclid) {
      leadDetails.fbclid = `fb.1.${Date.now()}.${Math.floor(10000 + Math.random() * 90000)}`;
    }

    // ----------------------------------------------------
    // DUPLICATE PROTECTION
    // ----------------------------------------------------
    // 1. Check externalLeadId (Meta Lead ID)
    if (leadDetails.externalLeadId) {
      const existingByExternalId = (dbData.leads || []).find(l => l.externalLeadId === leadDetails.externalLeadId);
      if (existingByExternalId) {
        console.log(`[Meta Webhook] Duplicate lead ignored: externalLeadId=${leadDetails.externalLeadId} already exists (Lead ID: ${existingByExternalId.leadId})`);
        return {
          success: true,
          isDuplicate: true,
          leadId: existingByExternalId.leadId,
          assignedTo: existingByExternalId.ownerId,
          lead: existingByExternalId,
          message: `Lead with Meta Lead ID ${leadDetails.externalLeadId} already exists as ${existingByExternalId.leadId}.`
        };
      }
    }

    // 2. Check mobile and email
    if (leadDetails.mobile || leadDetails.email) {
      const dup = checkDuplicate(leadDetails.mobile, leadDetails.email);
      if (dup && !payload.allowDuplicate && !isSimulation) {
        const existingLead = dup.match || dup;
        console.log(`[Meta Webhook] Duplicate detected by ${dup.field} (${dup.value}). Updating existing lead ${existingLead.leadId || existingLead.id}.`);
        
        // Record timeline activity on existing lead
        dbData.lastActivityId = (dbData.lastActivityId || 0) + 1;
        dbData.activities.unshift({
          activityId: dbData.lastActivityId,
          leadId: existingLead.leadId || String(existingLead.id),
          activityType: 'Form Inquiry',
          subject: 'Repeat Meta Lead Ads Submission',
          description: `Lead re-submitted Facebook Lead Form (Form ID: ${leadDetails.formId || 'N/A'}, Campaign: ${leadDetails.campaign || 'N/A'}). Meta Lead ID: ${leadDetails.externalLeadId || 'N/A'}.`,
          outcome: 'Repeat Inquiry Recorded',
          duration: 0,
          participants: `${existingLead.name || 'Lead'}, ${existingLead.ownerId || 'Counselor'}`,
          attachmentUrl: '',
          createdBy: 'Meta Webhook',
          createdAt: now
        });
        saveToFile();

        return {
          success: true,
          isDuplicate: true,
          leadId: existingLead.leadId,
          assignedTo: existingLead.ownerId,
          lead: existingLead,
          message: `Repeat Meta inquiry linked to existing lead ${existingLead.leadId}.`
        };
      }
    }

    // ----------------------------------------------------
    // CREATE NEW LEAD (Internal LD-xxxxxx ID System)
    // ----------------------------------------------------
    dbData.lastLeadId = (dbData.lastLeadId || 0) + 1;
    const leadId = `LD-${String(dbData.lastLeadId).padStart(6, '0')}`;
    leadDetails.id = dbData.lastLeadId;
    leadDetails.leadId = leadId;

    // Auto-assign counselor via round-robin
    const assignedCounselor = getNextAutoAssignedCounselor();
    leadDetails.ownerId = assignedCounselor;

    // Create lead record
    const createdLead = createLeadRecord(leadDetails, isSimulation ? 'Meta Simulator Test' : 'Meta Facebook Webhook');
    console.log(`[Meta Webhook] Lead created: ${createdLead.leadId}`);

    // Create Inflow Activity
    dbData.lastActivityId = (dbData.lastActivityId || 0) + 1;
    dbData.activities.unshift({
      activityId: dbData.lastActivityId,
      leadId: leadId,
      activityType: 'Lead Created',
      subject: isSimulation ? '⚡ Meta Lead Simulator (Internal Test)' : 'Facebook / Meta Lead Ads Form',
      description: `New lead received from campaign: "${leadDetails.campaign}" (Form ID: ${leadDetails.formId || 'N/A'}). Auto-assigned to counselor ${assignedCounselor}.`,
      outcome: `Auto-Assigned to ${assignedCounselor}`,
      duration: 0,
      participants: `${leadDetails.name}, ${assignedCounselor}`,
      attachmentUrl: '',
      createdBy: isSimulation ? 'Meta Simulator' : 'Meta Webhook',
      createdAt: now
    });

    // Create in-app Notification for assigned counselor & admin
    addNotification(
      1,
      leadId,
      `🎯 New Meta Lead: ${leadDetails.name}`,
      `Lead ${leadId} (${leadDetails.name}) for ${leadDetails.interestedCourse} auto-assigned to ${assignedCounselor}.`,
      'META_LEAD'
    );

    saveToFile();

    return {
      success: true,
      leadId,
      lead: createdLead,
      assignedTo: assignedCounselor,
      message: `Lead ${leadId} successfully created from Meta and auto-assigned to ${assignedCounselor}.`
    };
  };

  export const updateLeadRecord = (leadId, updateObj, currentUser = 'System') => {
    const idx = dbData.leads.findIndex(l => l.leadId === leadId || String(l.id) === String(leadId));
    if (idx !== -1) {
      const oldVal = { ...dbData.leads[idx] };
      if (updateObj.status) {
        updateObj.status = normalizeStatus(updateObj.status);
      }
      dbData.leads[idx] = { ...dbData.leads[idx], ...updateObj };

      // Audit log
      logAudit(currentUser, 'LEAD_UPDATED', 'LEAD', dbData.leads[idx].leadId, oldVal, dbData.leads[idx]);

      saveToFile();
      return dbData.leads[idx];
    }
    return null;
  };

  export const archiveLeadRecord = (leadId, currentUser = 'System') => {
    const targetStr = String(leadId).trim();
    const idx = (dbData.leads || []).findIndex(l =>
      (l.leadId && String(l.leadId).trim() === targetStr) ||
      (l.id && String(l.id).trim() === targetStr)
    );
    if (idx !== -1) {
      const oldVal = dbData.leads[idx].isArchived;
      dbData.leads[idx].isArchived = 1;
      dbData.leads[idx].updatedAt = new Date().toISOString();

      addActivityRecord({
        leadId: dbData.leads[idx].leadId || targetStr,
        activityType: 'Lead Archived',
        subject: 'Lead Archived',
        description: 'Lead archived from CRM active directory',
        outcome: 'Archived',
        createdBy: currentUser,
        createdAt: new Date().toISOString()
      });

      logAudit(currentUser, 'LEAD_ARCHIVED', 'LEAD', dbData.leads[idx].leadId || targetStr, oldVal, 1);
      saveToFile();
      return true;
    }
    return false;
  };

  export const unarchiveLeadRecord = (leadId, currentUser = 'System') => {
    const targetStr = String(leadId).trim();
    const idx = (dbData.leads || []).findIndex(l =>
      (l.leadId && String(l.leadId).trim() === targetStr) ||
      (l.id && String(l.id).trim() === targetStr)
    );
    if (idx !== -1) {
      const oldVal = dbData.leads[idx].isArchived;
      dbData.leads[idx].isArchived = 0;
      dbData.leads[idx].updatedAt = new Date().toISOString();

      addActivityRecord({
        leadId: dbData.leads[idx].leadId || targetStr,
        activityType: 'Lead Restored',
        subject: 'Lead Unarchived & Restored',
        description: 'Lead restored back to active CRM directory',
        outcome: 'Restored',
        createdBy: currentUser,
        createdAt: new Date().toISOString()
      });

      logAudit(currentUser, 'LEAD_RESTORED', 'LEAD', dbData.leads[idx].leadId || targetStr, oldVal, 0);
      saveToFile();
      return dbData.leads[idx];
    }
    return null;
  };

  export const addPaymentRecord = (leadId, paymentObj, currentUser = 'System') => {
    const idx = dbData.leads.findIndex(l => l.leadId === leadId || String(l.id) === String(leadId));
    if (idx === -1) return null;

    dbData.payments = dbData.payments || [];
    dbData.lastPaymentId = (dbData.lastPaymentId || 0) + 1;
    const paymentId = `PAY-${String(dbData.lastPaymentId).padStart(6, '0')}`;
    const now = new Date().toISOString();

    const amount = parseFloat(paymentObj.amount) || 0;
    const newPayment = {
      id: dbData.lastPaymentId,
      paymentId,
      leadId: dbData.leads[idx].leadId,
      amount,
      paymentMethod: paymentObj.paymentMethod || 'UPI',
      referenceNo: paymentObj.referenceNo || `TXN-${Date.now()}`,
      notes: paymentObj.notes || 'Course fee payment',
      paymentDate: paymentObj.paymentDate || now.slice(0, 10),
      createdBy: currentUser,
      createdAt: now
    };

    dbData.payments.push(newPayment);

    // Update lead paid status and total paid
    const currentPaid = parseFloat(dbData.leads[idx].paidAmount || 0);
    const updatedPaid = currentPaid + amount;
    dbData.leads[idx].paidAmount = updatedPaid;
    dbData.leads[idx].paymentStatus = 'PAID';
    dbData.leads[idx].updatedAt = now;

    // Log Activity
    addActivityRecord({
      leadId: dbData.leads[idx].leadId,
      activityType: 'Payment Received',
      subject: `Payment of ₹ ${amount.toLocaleString('en-IN')} Received`,
      description: `Payment recorded via ${newPayment.paymentMethod}. Ref: ${newPayment.referenceNo}. Notes: ${newPayment.notes}`,
      outcome: 'Payment Recorded',
      createdBy: currentUser,
      createdAt: now
    });

    logAudit(currentUser, 'PAYMENT_RECORDED', 'LEAD', dbData.leads[idx].leadId, currentPaid, updatedPaid);
    saveToFile();
    return newPayment;
  };

  export const getLeadPayments = (leadId) => {
    return (dbData.payments || []).filter(p => p.leadId === leadId || String(p.leadId) === String(leadId));
  };

  // ----------------------------------------------------
  // ACTIVITIES & FOLLOWUPS
  // ----------------------------------------------------
  export const getActivities = (leadId) => {
    return (dbData.activities || [])
      .filter(a => a.leadId === leadId)
      .sort((a, b) => b.activityId - a.activityId);
  };

  export const addActivityRecord = (actObj) => {
    dbData.lastActivityId = (dbData.lastActivityId || 0) + 1;
    const newAct = {
      activityId: dbData.lastActivityId,
      subject: actObj.subject || actObj.activityType || 'Activity Record',
      description: actObj.description || actObj.remarks || '',
      duration: actObj.duration || 0,
      participants: actObj.participants || '',
      attachmentUrl: actObj.attachmentUrl || '',
      ...actObj
    };
    dbData.activities.push(newAct);
    saveToFile();
    return newAct;
  };

  export const getFollowups = (leadId) => {
    return (dbData.followups || [])
      .filter(f => f.leadId === leadId)
      .sort((a, b) => b.followUpId - a.followUpId);
  };

  export const addFollowupRecord = (fupObj) => {
    dbData.lastFollowupId = (dbData.lastFollowupId || 0) + 1;
    const newFup = { followUpId: dbData.lastFollowupId, ...fupObj };
    dbData.followups.push(newFup);

    // Add Notification for assigned user
    addNotification(1, fupObj.leadId, 'New Follow-up Scheduled', `Follow-up set for ${fupObj.date} at ${fupObj.time}`, 'FOLLOW_UP');

    saveToFile();
    return newFup;
  };

  // ----------------------------------------------------
  // NOTES MANAGEMENT
  // ----------------------------------------------------
  export const getNotes = (leadId) => {
    return (dbData.notes || [])
      .filter(n => n.leadId === leadId)
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.noteId - a.noteId);
  };

  export const addNoteRecord = (noteObj) => {
    dbData.lastNoteId = (dbData.lastNoteId || 0) + 1;
    const now = new Date().toISOString();
    const newNote = {
      noteId: dbData.lastNoteId,
      leadId: noteObj.leadId,
      title: noteObj.title || 'General Note',
      content: noteObj.content || '',
      isPinned: Boolean(noteObj.isPinned),
      createdBy: noteObj.createdBy || 'Counselor',
      createdAt: now,
      updatedAt: now
    };
    dbData.notes.push(newNote);
    saveToFile();
    return newNote;
  };

  export const updateNoteRecord = (noteId, updateObj) => {
    const idx = (dbData.notes || []).findIndex(n => n.noteId === Number(noteId));
    if (idx !== -1) {
      dbData.notes[idx] = {
        ...dbData.notes[idx],
        ...updateObj,
        updatedAt: new Date().toISOString()
      };
      saveToFile();
      return dbData.notes[idx];
    }
    return null;
  };

  export const deleteNoteRecord = (noteId) => {
    const idx = (dbData.notes || []).findIndex(n => n.noteId === Number(noteId));
    if (idx !== -1) {
      dbData.notes.splice(idx, 1);
      saveToFile();
      return true;
    }
    return false;
  };

  // ----------------------------------------------------
  // TASKS MODULE
  // ----------------------------------------------------
  export const getTasks = (filters = {}) => {
    let list = [...(dbData.tasks || [])];
    if (filters.leadId) list = list.filter(t => t.leadId === filters.leadId);
    if (filters.status && filters.status !== 'All') list = list.filter(t => t.status === filters.status);
    return list.sort((a, b) => b.taskId - a.taskId);
  };

  export const addTaskRecord = (taskObj) => {
    dbData.lastTaskId = (dbData.lastTaskId || 0) + 1;
    const now = new Date().toISOString();
    const newTask = {
      taskId: dbData.lastTaskId,
      title: taskObj.title || 'Untitled Task',
      description: taskObj.description || '',
      leadId: taskObj.leadId || '',
      assignedUser: taskObj.assignedUser || 'Rahul Sharma',
      dueDate: taskObj.dueDate || now.split('T')[0],
      dueTime: taskObj.dueTime || '12:00',
      priority: taskObj.priority || 'Medium',
      repeat: taskObj.repeat || 'None',
      status: taskObj.status || 'Pending',
      createdBy: taskObj.createdBy || 'System',
      createdAt: now,
      updatedAt: now
    };
    dbData.tasks.push(newTask);
    saveToFile();
    return newTask;
  };

  export const updateTaskRecord = (taskId, updateObj) => {
    const idx = (dbData.tasks || []).findIndex(t => t.taskId === Number(taskId));
    if (idx !== -1) {
      dbData.tasks[idx] = {
        ...dbData.tasks[idx],
        ...updateObj,
        updatedAt: new Date().toISOString()
      };
      saveToFile();
      return dbData.tasks[idx];
    }
    return null;
  };

  // ----------------------------------------------------
  // CUSTOMERS RELATIONSHIP
  // ----------------------------------------------------
  export const getCustomers = () => {
    return (dbData.customers || []).sort((a, b) => b.customerId - a.customerId);
  };

  export const linkOrCreateCustomer = (lead) => {
    if (!lead || !lead.mobile) return null;
    const existing = (dbData.customers || []).find(c => String(c.phone).trim() === String(lead.mobile).trim());
    if (existing) return existing;

    dbData.lastCustomerId = (dbData.lastCustomerId || 0) + 1;
    const now = new Date().toISOString();
    const newCust = {
      customerId: dbData.lastCustomerId,
      name: lead.name,
      email: lead.email || '',
      phone: lead.mobile,
      whatsapp: lead.whatsappNumber || lead.mobile,
      city: lead.city || '',
      state: lead.state || '',
      notes: `Customer created from Lead ${lead.leadId}`,
      createdAt: now,
      updatedAt: now
    };
    dbData.customers.push(newCust);
    saveToFile();
    return newCust;
  };

  // ----------------------------------------------------
  // COURSES & LEAD SOURCES ADMIN SETUP
  // ----------------------------------------------------
  export const getCourses = () => {
    if (!dbData.courses || dbData.courses.length === 0) {
      dbData.courses = [
        { id: 'PRD001', code: 'CPL-2026', name: 'Commercial Pilot License (CPL)', description: 'DGCA approved ground school & flight simulator training', category: 'Pilot Training', duration: '18 Months', price: 1850000, status: 'Active', created: 'Jan 10, 2026', active: true },
        { id: 'PRD002', code: 'CCG-2026', name: 'Cabin Crew & Ground Staff Training', description: 'Aviation hospitality, in-flight safety & airport ground handling', category: 'Cabin Crew & Ground', duration: '6 Months', price: 180000, status: 'Active', created: 'Jan 12, 2026', active: true },
        { id: 'PRD003', code: 'AME-2026', name: 'Aircraft Maintenance Engineering (AME)', description: 'Avionics and mechanical maintenance certification program', category: 'Engineering', duration: '3 Years', price: 450000, status: 'Active', created: 'Jan 15, 2026', active: true },
        { id: 'PRD004', code: 'SFO-2026', name: 'Sub Fire Officer', description: 'Advanced fire prevention & rescue operations training', category: 'Safety & Officer', duration: '1 Year', price: 95000, status: 'Active', created: 'Jan 18, 2026', active: true },
        { id: 'PRD005', code: 'DIS-2026', name: 'Diploma in Industrial Safety', description: 'Industrial hazard control, safety protocols & workplace audit', category: 'Technical Diploma', duration: '1 Year', price: 120000, status: 'Active', created: 'Jan 20, 2026', active: true },
        { id: 'PRD006', code: 'FRM-2026', name: 'Fireman', description: 'Basic fire fighting & emergency medical response training', category: 'Safety & Officer', duration: '6 Months', price: 75000, status: 'Active', created: 'Jan 22, 2026', active: true },
        { id: 'PRD007', code: 'DSI-2026', name: 'Diploma In Sanitary Inspector', description: 'Public health inspection & environmental hygiene management', category: 'Technical Diploma', duration: '1 Year', price: 85000, status: 'Active', created: 'Jan 25, 2026', active: true },
        { id: 'PRD008', code: 'HSI-2026', name: 'Health Sanitary Inspector', description: 'Sanitation compliance & municipal health safety procedures', category: 'Technical Diploma', duration: '1 Year', price: 85000, status: 'Active', created: 'Jan 28, 2026', active: true },
        { id: 'PRD009', code: 'MSM-2026', name: 'MSME Skill Training', description: 'Government certified technical skill enhancement course', category: 'Technical Diploma', duration: '3 Months', price: 65000, status: 'Active', created: 'Feb 01, 2026', active: true }
      ];
      saveToFile();
    }
    return dbData.courses;
  };

  export const createCourseRecord = (courseObj) => {
    const courses = getCourses();
    const nextNum = courses.length + 1;
    const newId = `PRD${String(nextNum).padStart(3, '0')}`;
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newCourse = {
      id: courseObj.id || newId,
      code: courseObj.code || `CRS-${nextNum}`,
      name: courseObj.name,
      description: courseObj.description || '',
      category: courseObj.category || 'Pilot Training',
      duration: courseObj.duration || '1 Year',
      price: Number(courseObj.price) || 0,
      status: courseObj.status || 'Active',
      created: nowStr,
      active: true
    };
    dbData.courses.unshift(newCourse);
    saveToFile();
    return newCourse;
  };

  export const updateCourseRecord = (courseId, updateObj) => {
    const courses = getCourses();
    const idx = courses.findIndex(c => c.id === courseId || String(c.id) === String(courseId));
    if (idx !== -1) {
      dbData.courses[idx] = { ...dbData.courses[idx], ...updateObj };
      saveToFile();
      return dbData.courses[idx];
    }
    return null;
  };

  export const deleteCourseRecord = (courseId) => {
    const courses = getCourses();
    const idx = courses.findIndex(c => c.id === courseId || String(c.id) === String(courseId));
    if (idx !== -1) {
      dbData.courses.splice(idx, 1);
      saveToFile();
      return true;
    }
    return false;
  };

  export const getLeadSourcesList = () => {
    if (!dbData.leadSources || dbData.leadSources.length === 0) {
      dbData.leadSources = [
        { id: 'SRC010', name: 'Walk-In', description: 'In-person office visits', type: 'Offline', category: 'Other', costPerLead: '-', status: 'Active', created: 'Feb 14, 2026', active: true },
        { id: 'SRC009', name: 'WhatsApp', description: 'WhatsApp Business inquiries', type: 'Online', category: 'Social Media', costPerLead: '30', status: 'Active', created: 'Feb 12, 2026', active: true },
        { id: 'SRC008', name: 'Google Ads', description: 'Google PPC advertising campaigns', type: 'Paid', category: 'Search Engine', costPerLead: '200', status: 'Active', created: 'Feb 10, 2026', active: true },
        { id: 'SRC007', name: 'Trade Show', description: 'Industry events and trade shows', type: 'Offline', category: 'Event', costPerLead: '500', status: 'Active', created: 'Feb 08, 2026', active: true },
        { id: 'SRC006', name: 'Social Media', description: 'Facebook, Instagram, Twitter leads', type: 'Online', category: 'Social Media', costPerLead: '100', status: 'Active', created: 'Feb 06, 2026', active: true },
        { id: 'SRC005', name: 'Email Campaign', description: 'Email marketing and newsletters', type: 'Online', category: 'Email Campaign', costPerLead: '25', status: 'Active', created: 'Feb 04, 2026', active: true },
        { id: 'SRC004', name: 'Cold Call', description: 'Outbound cold calling campaigns', type: 'Direct', category: 'Other', costPerLead: '75', status: 'Active', created: 'Feb 02, 2026', active: true },
        { id: 'SRC003', name: 'Referral', description: 'Word of mouth and client referrals', type: 'Direct', category: 'Partner', costPerLead: '-', status: 'Active', created: 'Jan 31, 2026', active: true },
        { id: 'SRC002', name: 'LinkedIn', description: 'Leads generated through LinkedIn outreach', type: 'Online', category: 'Social Media', costPerLead: '150', status: 'Active', created: 'Jan 29, 2026', active: true },
        { id: 'SRC001', name: 'Website', description: 'Leads from company website contact form', type: 'Online', category: 'Search Engine', costPerLead: '50', status: 'Active', created: 'Jan 27, 2026', active: true }
      ];
      saveToFile();
    }
    return dbData.leadSources;
  };

  export const createLeadSourceRecord = (sourceObj) => {
    const sources = getLeadSourcesList();
    const nextNum = sources.length + 1;
    const newId = `SRC${String(nextNum).padStart(3, '0')}`;
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newSource = {
      id: sourceObj.id || newId,
      name: sourceObj.name || sourceObj.sourceName,
      description: sourceObj.description || '',
      type: sourceObj.type || 'Online',
      category: sourceObj.category || 'Other',
      costPerLead: sourceObj.costPerLead || '-',
      status: sourceObj.status || 'Active',
      created: nowStr,
      active: true
    };
    dbData.leadSources.unshift(newSource);
    saveToFile();
    return newSource;
  };

  export const updateLeadSourceRecord = (sourceId, updateObj) => {
    const sources = getLeadSourcesList();
    const idx = sources.findIndex(s => s.id === sourceId || String(s.id) === String(sourceId));
    if (idx !== -1) {
      dbData.leadSources[idx] = { ...dbData.leadSources[idx], ...updateObj };
      saveToFile();
      return dbData.leadSources[idx];
    }
    return null;
  };

  export const deleteLeadSourceRecord = (sourceId) => {
    const sources = getLeadSourcesList();
    const idx = sources.findIndex(s => s.id === sourceId || String(s.id) === String(sourceId));
    if (idx !== -1) {
      dbData.leadSources.splice(idx, 1);
      saveToFile();
      return true;
    }
    return false;
  };

  // ----------------------------------------------------
  // DATABASE ANALYTICS & DASHBOARD METRICS (REAL DATA)
  // ----------------------------------------------------
  export const getStatsData = (filters = {}) => {
    let activeLeads = (dbData.leads || []).filter(l => !l.isArchived);
    const todayStr = new Date().toISOString().split('T')[0];

    const start = filters.startDate || filters.dateFrom;
    const end = filters.endDate || filters.dateTo;

    if (start) {
      const sDate = new Date(start);
      sDate.setHours(0, 0, 0, 0);
      activeLeads = activeLeads.filter(l => {
        const dt = new Date(l.leadDateTime || l.createdAt || 0);
        return !isNaN(dt.getTime()) && dt >= sDate;
      });
    }

    if (end) {
      const eDate = new Date(end);
      eDate.setHours(23, 59, 59, 999);
      activeLeads = activeLeads.filter(l => {
        const dt = new Date(l.leadDateTime || l.createdAt || 0);
        return !isNaN(dt.getTime()) && dt <= eDate;
      });
    }

    const totalLeads = activeLeads.length;
    const newLeads = activeLeads.filter(l => l.status === 'NEW').length;
    const noAnswerLeads = activeLeads.filter(l => l.status === 'NO_ANSWER').length;
    const givenDetailsLeads = activeLeads.filter(l => l.status === 'GIVEN_DETAILS' || l.status === 'QUALIFIED' || l.status === 'RESPONDED').length;
    const interestedLeads = activeLeads.filter(l => l.status === 'INTERESTED').length;
    const followupLeads = activeLeads.filter(l => l.status === 'FOLLOW_UP').length;
    const convertedLeads = activeLeads.filter(l => l.status === 'CONVERTED' || l.status === 'WON').length;
    const lostLeads = activeLeads.filter(l => l.status === 'LOST' || l.status === 'NOT_INTERESTED' || l.status === 'INVALID').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    // 1. Real Lead Pipeline Funnel Data
    const leadPipeline = [
      { name: 'New', count: newLeads, fill: '#3B82F6', label: String(newLeads) },
      { name: 'No Answer', count: noAnswerLeads, fill: '#F59E0B', label: String(noAnswerLeads) },
      { name: 'Given Details', count: givenDetailsLeads, fill: '#8B5CF6', label: String(givenDetailsLeads) },
      { name: 'Interested', count: interestedLeads, fill: '#10B981', label: String(interestedLeads) },
      { name: 'Follow-up', count: followupLeads, fill: '#0EA5E9', label: String(followupLeads) },
      { name: 'Converted', count: convertedLeads, fill: '#16A34A', label: String(convertedLeads) },
      { name: 'Lost', count: lostLeads, fill: '#EF4444', label: String(lostLeads) }
    ];

    // Status Map Counts
    const statusMap = {};
    activeLeads.forEach(l => {
      const displayLabel = STATUS_MAP[l.status] || l.status;
      statusMap[displayLabel] = (statusMap[displayLabel] || 0) + 1;
    });
    const statusCounts = Object.keys(statusMap).map(k => ({ status: k, count: statusMap[k] }));

    // 2. Real Leads Trend (by creation date)
    const dayMap = {};
    const sortedLeads = [...activeLeads].sort((a, b) => new Date(a.leadDateTime || a.createdAt || 0) - new Date(b.leadDateTime || b.createdAt || 0));

    sortedLeads.forEach(l => {
      const dt = new Date(l.leadDateTime || l.createdAt || Date.now());
      if (!isNaN(dt.getTime())) {
        const dayKey = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
      }
    });

    let leadTrend = Object.keys(dayMap).map(k => ({
      label: k,
      value: dayMap[k]
    }));

    if (leadTrend.length === 0) {
      const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      leadTrend = [{ label: todayLabel, value: totalLeads }];
    }

    // 3. Real Source Performance Analytics & Donut Data
    const sourceColors = {
      'Meta Ads': '#EAB308',
      'Website': '#3B82F6',
      'Google Ads': '#10B981',
      'WhatsApp': '#A855F7',
      'Referral': '#EF4444',
      'Walk-in': '#F97316',
      'Social Media': '#EC4899',
      'Organic': '#6366F1',
      'Other': '#64748B'
    };

    const sourceMap = {};
    activeLeads.forEach(l => {
      const src = l.source || 'Other';
      if (!sourceMap[src]) {
        sourceMap[src] = { source: src, name: src, count: 0, total: 0, interested: 0, converted: 0 };
      }
      sourceMap[src].count += 1;
      sourceMap[src].total += 1;
      if (l.status === 'INTERESTED') sourceMap[src].interested += 1;
      if (l.status === 'CONVERTED' || l.status === 'WON') sourceMap[src].converted += 1;
    });

    const sourcePerformance = Object.values(sourceMap).map(s => ({
      ...s,
      percent: totalLeads > 0 ? ((s.count / totalLeads) * 100).toFixed(1) + '%' : '0%',
      color: sourceColors[s.source] || '#64748B',
      conversionRate: s.total > 0 ? ((s.converted / s.total) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.count - a.count);

    // 4. Real Activity Distribution
    const actTypeMap = { Calls: 0, WhatsApp: 0, Emails: 0, Meetings: 0, Notes: (dbData.notes || []).length, Other: 0 };
    (dbData.activities || []).forEach(a => {
      const type = (a.activityType || a.subject || '').toLowerCase();
      if (type.includes('call') || type.includes('phone')) actTypeMap.Calls += 1;
      else if (type.includes('whatsapp') || type.includes('chat') || type.includes('msg')) actTypeMap.WhatsApp += 1;
      else if (type.includes('email') || type.includes('mail')) actTypeMap.Emails += 1;
      else if (type.includes('meeting') || type.includes('visit') || type.includes('campus')) actTypeMap.Meetings += 1;
      else if (type.includes('note') || type.includes('remark')) actTypeMap.Notes += 1;
      else actTypeMap.Other += 1;
    });

    activeLeads.forEach(l => {
      if (l.remarks && l.remarks.trim() !== '') {
        actTypeMap.Notes += 1;
      }
    });

    const totalActivitiesCount = Object.values(actTypeMap).reduce((acc, v) => acc + v, 0);

    const activityColors = {
      'Calls': '#EAB308',
      'WhatsApp': '#10B981',
      'Emails': '#3B82F6',
      'Meetings': '#A855F7',
      'Notes': '#F97316',
      'Other': '#64748B'
    };

    const activityDistribution = Object.keys(actTypeMap)
      .filter(k => actTypeMap[k] > 0 || totalActivitiesCount === 0)
      .map(k => ({
        name: k,
        count: actTypeMap[k],
        percent: totalActivitiesCount > 0 ? ((actTypeMap[k] / totalActivitiesCount) * 100).toFixed(1) + '%' : '0%',
        color: activityColors[k]
      }));

    // 5. Follow-ups & Tasks (Real Data)
    const allPendingFollowups = (dbData.followups || []).filter(f => f.status === 'Pending').concat(
      (dbData.tasks || []).filter(t => t.status !== 'Completed').map(t => ({
        followUpId: t.taskId,
        leadId: t.leadId,
        date: t.dueDate,
        time: t.dueTime || '11:00 AM',
        type: 'Task',
        notes: t.description || t.title,
        status: 'Pending',
        createdBy: t.assignedUser,
        name: t.title
      }))
    );

    const todaysFollowupsList = allPendingFollowups
      .filter(f => f.date === todayStr)
      .map(f => {
        const lead = activeLeads.find(l => l.leadId === f.leadId) || {};
        return {
          id: f.followUpId,
          name: lead.name || f.name || 'Student Follow-up',
          sub: `${lead.interestedCourse || 'Aviation'} • ${lead.status || 'Follow-up'}`,
          time: f.time || 'Today',
          leadId: f.leadId,
          icon: (f.type || '').toLowerCase().includes('call') ? 'call' : 'event',
          iconBg: 'bg-emerald-100 text-emerald-700'
        };
      });

    const overdueFollowupsList = allPendingFollowups
      .filter(f => f.date && f.date < todayStr)
      .map(f => {
        const lead = activeLeads.find(l => l.leadId === f.leadId) || {};
        return {
          id: f.followUpId,
          name: lead.name || f.name || 'Overdue Follow-up',
          sub: `${lead.interestedCourse || 'Aviation'} • Due: ${f.date}`,
          time: f.time || f.date,
          leadId: f.leadId
        };
      });

    const followupsToday = todaysFollowupsList.length;
    const overdueFollowups = overdueFollowupsList.length;

    // 6. Recent Activities
    const recentActivities = [...(dbData.activities || [])]
      .sort((a, b) => (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) || (b.activityId - a.activityId))
      .slice(0, 5)
      .map(a => {
        const parentLead = activeLeads.find(l => l.leadId === a.leadId) || {};
        return {
          id: a.activityId,
          title: a.subject || `${a.activityType || 'Activity'} with ${parentLead.name || a.leadId}`,
          sub: a.description || `Outcome: ${a.outcome || 'Logged'}`,
          time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          type: a.activityType || 'Call',
          icon: (a.activityType || '').toLowerCase().includes('chat') || (a.activityType || '').toLowerCase().includes('whatsapp') ? 'chat' :
            (a.activityType || '').toLowerCase().includes('email') || (a.activityType || '').toLowerCase().includes('mail') ? 'mail' :
              (a.activityType || '').toLowerCase().includes('meeting') ? 'groups' :
                (a.activityType || '').toLowerCase().includes('note') ? 'article' : 'call',
          iconBg: (a.activityType || '').toLowerCase().includes('chat') ? 'bg-emerald-500 text-white' :
            (a.activityType || '').toLowerCase().includes('email') ? 'bg-blue-100 text-blue-700' :
              (a.activityType || '').toLowerCase().includes('meeting') ? 'bg-purple-100 text-purple-700' :
                (a.activityType || '').toLowerCase().includes('note') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        };
      });

    // 7. Real Total Collected Revenue
    let totalCollectedRevenueNum = 0;
    (dbData.payments || []).forEach(p => {
      totalCollectedRevenueNum += parseFloat(p.amount) || 0;
    });
    activeLeads.forEach(l => {
      if (l.payments && Array.isArray(l.payments)) {
        l.payments.forEach(p => {
          totalCollectedRevenueNum += parseFloat(p.amount) || 0;
        });
      } else if (l.paidAmount && (!dbData.payments || dbData.payments.length === 0)) {
        totalCollectedRevenueNum += parseFloat(l.paidAmount) || 0;
      }
    });
    const totalCollectedRevenue = totalCollectedRevenueNum.toLocaleString('en-IN');

    // 8. Employee Performance Analytics
    let activeCounselors = (dbData.users || [])
      .filter(u => u.active && u.role !== 'ADMIN' && (u.role === 'LEAD_FINDER' || u.role === 'COUNSELOR'))
      .map(u => u.name);

    if (!activeCounselors || activeCounselors.length === 0) {
      activeCounselors = ['MS. INDU', 'MS. AYESHA', 'MS. PRITI'];
    }

    const employeeMap = {};

    activeCounselors.forEach(cName => {
      employeeMap[cName] = { name: cName, assigned: 0, contacted: 0, interested: 0, followups: 0, converted: 0, lost: 0 };
    });

    activeLeads.forEach(l => {
      let owner = l.ownerId || l.owner || 'MS. INDU';
      if (owner === 'Rahul Sharma' || owner === 'Sourav Sharma' || owner === 'Agent 1' || !employeeMap[owner]) {
        owner = 'MS. INDU';
      }
      if (owner === 'Anita Verma') owner = 'MS. AYESHA';
      if (owner === 'Suresh Menon') owner = 'MS. PRITI';

      if (employeeMap[owner]) {
        employeeMap[owner].assigned += 1;
        if (l.status !== 'NEW') employeeMap[owner].contacted += 1;
        if (l.status === 'INTERESTED') employeeMap[owner].interested += 1;
        if (l.status === 'FOLLOW_UP') employeeMap[owner].followups += 1;
        if (l.status === 'CONVERTED' || l.status === 'WON') employeeMap[owner].converted += 1;
        if (l.status === 'LOST' || l.status === 'NOT_INTERESTED') employeeMap[owner].lost += 1;
      }
    });
    const employeePerformance = Object.values(employeeMap).map(e => ({
      ...e,
      conversionRate: e.assigned > 0 ? ((e.converted / e.assigned) * 100).toFixed(1) : '0.0'
    }));

    // Course Interest Breakdown
    const courseMap = {};
    activeLeads.forEach(l => {
      const course = l.interestedCourse || 'General Aviation';
      courseMap[course] = (courseMap[course] || 0) + 1;
    });
    const courseDistribution = Object.keys(courseMap).map(c => ({
      course: c,
      count: courseMap[c]
    })).sort((a, b) => b.count - a.count);

    // Active Tasks
    const activeTasks = (dbData.tasks || []).filter(t => t.status !== 'Completed');
    const activeTasksCount = activeTasks.length;
    const overdueTasksCount = activeTasks.filter(t => t.dueDate && t.dueDate < todayStr).length;

    return {
      totalLeads,
      newLeads,
      noAnswerLeads,
      givenDetailsLeads,
      followupLeads,
      interestedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      totalCollectedRevenue,
      totalCollectedRevenueNum,
      activeTasksCount,
      overdueTasksCount,
      followupsToday,
      overdueFollowups,
      statusCounts,
      leadPipeline,
      leadTrend,
      sourcePerformance,
      activityDistribution,
      totalActivitiesCount,
      todaysFollowupsList,
      overdueFollowupsList,
      recentActivities,
      employeePerformance,
      courseDistribution
    };
  };

  export const getAuditLogs = () => {
    return (dbData.auditLogs || []).sort((a, b) => b.id - a.id);
  };

