import express from 'express'; // Restart backend v3
import cors from 'cors';
import {
  initDb,
  getLeads,
  getLeadById,
  checkDuplicate,
  createLeadRecord,
  updateLeadRecord,
  archiveLeadRecord,
  getActivities,
  addActivityRecord,
  getFollowups,
  addFollowupRecord,
  getStatsData,
  generateNextLeadId,
  authenticateUser,
  getUsers,
  getNotes,
  addNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
  getTasks,
  addTaskRecord,
  updateTaskRecord,
  getCustomers,
  getCourses,
  createCourseRecord,
  updateCourseRecord,
  deleteCourseRecord,
  getLeadSourcesList,
  createLeadSourceRecord,
  getAuditLogs,
  getNotifications,
  markNotificationRead,
  getNextAutoAssignedCounselor,
  unarchiveLeadRecord,
  addPaymentRecord,
  getLeadPayments,
  processMetaWebhookLead,
  STATUS_MAP
} from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDb().catch(console.error);

// ----------------------------------------------------
// ROOT & HEALTH CHECK ENDPOINTS
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    name: 'AEERO Lead CRM Backend API',
    version: '1.0.0',
    status: 'online',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'AEERO CRM Express Backend'
  });
});

// ----------------------------------------------------
// AUTHENTICATION & USERS API
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password credentials." });
    }
    const token = `aeero_session_${user.id}_${Date.now()}`;
    res.json({ message: "Login successful", user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: "Logged out successfully" });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const users = getUsers();
  const user = users[0]; // fallback default admin/lead finder
  res.json({ user });
});

app.get('/api/users', (req, res) => {
  try {
    const users = getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PUBLIC API: WEBSITE LEAD CAPTURE
// ----------------------------------------------------
app.post('/api/public/leads', async (req, res) => {
  try {
    const {
      name, mobile, email, city, state, age, qualification,
      interestedCourse, preferredStudyMode, campaign, campaignId,
      adSet, adSetId, ad, adId, utmSource, utmMedium, utmCampaign, utmContent, utmTerm
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({ error: "Mobile number is required." });
    }

    const existing = checkDuplicate(mobile, email);
    if (existing) {
      return res.status(409).json({
        error: "Lead with this mobile/email already exists.",
        isDuplicate: true,
        existingLead: existing
      });
    }

    const leadId = await generateNextLeadId();
    const now = new Date().toISOString();

    const newPublicLead = {
      id: parseInt(leadId.replace('LD-', '')),
      leadId,
      source: "Website",
      campaign: campaign || 'Public Website Form',
      campaignId: campaignId || 'WEB-001',
      adSet: adSet || '',
      adSetId: adSetId || '',
      ad: ad || '',
      adId: adId || '',
      utmSource: utmSource || 'website',
      utmMedium: utmMedium || 'organic_form',
      utmCampaign: utmCampaign || '',
      utmContent: utmContent || '',
      utmTerm: utmTerm || '',
      leadDateTime: now,
      name: name.trim(),
      mobile: mobile.trim(),
      whatsappNumber: mobile.trim(),
      email: email || '',
      city: city || '',
      state: state || '',
      age: age ? parseInt(age) : null,
      qualification: qualification || '',
      interestedCourse: interestedCourse || 'Commercial Pilot License (CPL)',
      preferredStudyMode: preferredStudyMode || 'Online',
      ownerId: getNextAutoAssignedCounselor(),
      status: 'NEW',
      priority: 'Medium',
      tags: JSON.stringify(["Website Lead", "Public Form"]),
      isArchived: 0,
      createdBy: 'Website API',
      createdAt: now,
      updatedAt: now
    };

    createLeadRecord(newPublicLead, 'Website API');

    addActivityRecord({
      leadId,
      activityType: 'Lead Captured',
      subject: 'Website Form Submission',
      description: 'Lead captured via Public Website Form API',
      outcome: 'Success',
      createdBy: 'Website API',
      createdAt: now
    });

    res.status(201).json({
      message: "Lead successfully submitted via website API",
      leadId: newPublicLead.leadId,
      lead: newPublicLead
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// META / FACEBOOK LEAD ADS WEBHOOK INTEGRATION
// ----------------------------------------------------

// 1. Meta Webhook Verification (GET /api/webhook/meta & GET /api/integrations/meta/webhook)
app.get(['/api/webhook/meta', '/api/integrations/meta/webhook'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'aeero_meta_lead_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      console.log('[Meta Webhook] Verification request received: mode=subscribe (verify_token matched)');
      // Meta expects the plain challenge string in response body with 200 status
      return res.status(200).send(challenge);
    } else {
      console.warn('[Meta Webhook] Verification failed: Token mismatch');
      return res.status(403).json({ error: 'Verification token mismatch' });
    }
  }

  // Safe diagnostic response when accessed via browser / health probe
  res.json({
    status: 'online',
    message: 'Meta Webhook endpoint is active and ready for Facebook Lead Ads.',
    webhookPath: '/api/webhook/meta',
    subscribedField: 'leadgen',
    hasPageAccessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN)
  });
});

// 2. Meta Webhook Lead Capture & Auto-Assign (POST /api/webhook/meta & POST /api/integrations/meta/webhook)
app.post(['/api/webhook/meta', '/api/integrations/meta/webhook'], async (req, res) => {
  try {
    const result = await processMetaWebhookLead(req.body, false);

    res.status(200).json({
      success: true,
      message: 'Meta lead received and processed successfully',
      isDuplicate: Boolean(result.isDuplicate),
      leadId: result.leadId,
      assignedTo: result.assignedTo,
      lead: result.lead
    });
  } catch (error) {
    console.error('[Meta Webhook] Error processing incoming lead:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to process Meta lead' });
  }
});

// 3. Meta Integration Configuration & Safe Status Probe
app.get('/api/integrations/meta/config', (req, res) => {
  const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'aeero_meta_lead_token_2026';
  const counselors = getUsers().filter(u => u.active && (u.role === 'LEAD_FINDER' || u.role === 'ADMIN')).map(u => u.name);

  res.json({
    enabled: true,
    webhookPath: '/api/webhook/meta',
    verifyToken: META_VERIFY_TOKEN,
    hasPageAccessToken: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
    autoAssignEnabled: true,
    counselorPool: counselors,
    supportedFields: ['full_name', 'phone_number', 'email', 'city', 'state', 'interested_course', 'qualification', 'campaign_name', 'form_id']
  });
});

// 4. Meta Webhook Simulator / Test Endpoint (Safe internal test separated from real Meta Graph API)
app.post('/api/integrations/meta/test', async (req, res) => {
  try {
    const { name, mobile, email, city, course, campaign } = req.body;
    const testPayload = {
      name: name || 'Test Lead (Facebook Ads Simulator)',
      mobile: mobile || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: email || `facebook.sim.${Date.now()}@example.com`,
      city: city || 'Mumbai',
      interestedCourse: course || 'Commercial Pilot License (CPL)',
      campaign: campaign || 'Facebook Lead Ads Test Campaign 2026',
      adSet: 'Pilot Aspirants Test AdSet',
      ad: 'Fly High Early Bird Ad',
      formId: 'FB-TEST-FORM-88',
      allowDuplicate: true
    };

    const result = await processMetaWebhookLead(testPayload, true);
    res.json({
      success: true,
      isSimulation: true,
      message: `Simulator test lead successfully created and auto-assigned to ${result.assignedTo}!`,
      leadId: result.leadId,
      assignedTo: result.assignedTo,
      lead: result.lead,
      simulationNotice: '⚠️ Note: This simulation validates internal CRM lead ingestion and auto-assignment. It is NOT proof of real Meta Graph API connectivity.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// DASHBOARD STATS & CONFIG
// ----------------------------------------------------
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStatsData(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    statusMap: STATUS_MAP,
    counselors: getUsers().map(u => u.name),
    courses: getCourses(),
    leadSources: getLeadSourcesList()
  });
});

// ----------------------------------------------------
// DUPLICATE CHECK
// ----------------------------------------------------
app.post('/api/leads/check-duplicate', (req, res) => {
  try {
    const { mobile, email, excludeId } = req.body;
    const dupResult = checkDuplicate(mobile, email, excludeId);

    if (dupResult) {
      const match = dupResult.match || dupResult;
      const fieldName = dupResult.field === 'email' ? 'Email Address' : 'Mobile Number';
      const fieldValue = dupResult.value || (dupResult.field === 'email' ? email : mobile);
      return res.json({
        isDuplicate: true,
        duplicateField: fieldName,
        duplicateValue: fieldValue,
        existingLead: match,
        message: `${fieldName} "${fieldValue}" is already registered to "${match.name || 'Existing Lead'}" (Lead ID: ${match.leadId || match.id}).`
      });
    }

    res.json({ isDuplicate: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// LEADS LIST & GET
// ----------------------------------------------------
app.get('/api/leads', (req, res) => {
  try {
    const leads = getLeads(req.query);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leads/:id', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// CREATE NEW LEAD (MANUAL ADD LEAD)
// ----------------------------------------------------
app.post('/api/leads', async (req, res) => {
  try {
    const {
      name, mobile, whatsappNumber, email, city, state, age, qualification,
      interestedCourse, preferredStudyMode, requirement, remarks,
      source, campaign, campaignId, adSet, adSetId, ad, adId, formId,
      utmSource, utmMedium, utmCampaign, utmContent, utmTerm, gclid, fbclid, landingPage,
      ownerId, status, priority, tags, allowDuplicate, createdBy
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({ error: "Mobile number is required." });
    }
    if (!source || source.trim() === '') {
      return res.status(400).json({ error: "Valid Lead Source selection is required." });
    }

    if (!allowDuplicate) {
      const dupResult = checkDuplicate(mobile, email);
      if (dupResult) {
        const match = dupResult.match || dupResult;
        const fieldName = dupResult.field === 'email' ? 'Email Address' : 'Mobile Number';
        const fieldValue = dupResult.value || (dupResult.field === 'email' ? email : mobile);
        const errorMsg = `Duplicate Lead Found! ${fieldName} "${fieldValue}" is already registered to "${match.name || 'Existing Student'}" (Lead ID: ${match.leadId || match.id}).`;
        return res.status(409).json({
          error: errorMsg,
          isDuplicate: true,
          duplicateField: fieldName,
          duplicateValue: fieldValue,
          existingLead: match
        });
      }
    }

    const leadId = await generateNextLeadId();
    const now = new Date().toISOString();
    const parsedTags = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '[]');

    const newLeadObj = {
      id: parseInt(leadId.replace('LD-', '')),
      leadId,
      source: source.trim(),
      campaign: campaign || '',
      campaignId: campaignId || '',
      adSet: adSet || '',
      adSetId: adSetId || '',
      ad: ad || '',
      adId: adId || '',
      formId: formId || '',
      utmSource: utmSource || '',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || '',
      utmContent: utmContent || '',
      utmTerm: utmTerm || '',
      gclid: gclid || '',
      fbclid: fbclid || '',
      landingPage: landingPage || '',
      leadDateTime: now,
      name: name.trim(),
      mobile: mobile.trim(),
      whatsappNumber: whatsappNumber || mobile.trim(),
      email: email || '',
      city: city || '',
      state: state || '',
      age: age ? parseInt(age) : null,
      qualification: qualification || '',
      interestedCourse: interestedCourse || 'Commercial Pilot License (CPL)',
      preferredStudyMode: preferredStudyMode || 'Offline',
      requirement: requirement || '',
      remarks: remarks || '',
      ownerId: ownerId || getNextAutoAssignedCounselor(),
      status: status || 'NEW',
      priority: priority || 'Medium',
      tags: parsedTags,
      isArchived: 0,
      createdBy: createdBy || 'Counselor',
      createdAt: now,
      updatedAt: now
    };

    createLeadRecord(newLeadObj, createdBy || 'Counselor');

    addActivityRecord({
      leadId,
      activityType: 'Lead Created',
      subject: 'Manual Lead Entry',
      description: `Lead created manually under source ${source}`,
      outcome: 'Created',
      createdBy: createdBy || 'Counselor',
      createdAt: now
    });

    res.status(201).json(newLeadObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// UPDATE LEAD & STATUS
// ----------------------------------------------------
app.put('/api/leads/:id', (req, res) => {
  try {
    const leadParam = req.params.id;
    const existing = getLeadById(leadParam);
    if (!existing) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const now = new Date().toISOString();
    const updated = updateLeadRecord(existing.leadId, { ...req.body, updatedAt: now }, req.body.updatedBy || 'Counselor');

    if (req.body.status && req.body.status !== existing.status) {
      addActivityRecord({
        leadId: existing.leadId,
        activityType: 'Status Change',
        subject: 'Lead Status Updated',
        description: `Status changed from '${existing.status}' to '${req.body.status}'`,
        outcome: req.body.status,
        createdBy: req.body.updatedBy || 'Counselor',
        createdAt: now
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fast Status Update endpoint for Drag-and-Drop Kanban
app.put('/api/leads/:id/status', (req, res) => {
  try {
    const leadParam = req.params.id;
    const existing = getLeadById(leadParam);
    if (!existing) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const { status, updatedBy } = req.body;
    const now = new Date().toISOString();

    const updated = updateLeadRecord(existing.leadId, { status, updatedAt: now }, updatedBy || 'Counselor');

    addActivityRecord({
      leadId: existing.leadId,
      activityType: 'Kanban Stage Change',
      subject: 'Kanban Board Drag & Drop',
      description: `Pipeline stage moved to '${status}'`,
      outcome: status,
      createdBy: updatedBy || 'Counselor',
      createdAt: now
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Archive Lead
app.post('/api/leads/:id/archive', (req, res) => {
  try {
    const leadParam = req.params.id;
    let existing = getLeadById(leadParam);
    const targetId = existing ? (existing.leadId || existing.id) : leadParam;
    const success = archiveLeadRecord(targetId, req.body.currentUser || 'System');
    if (success) {
      res.json({ message: "Lead archived successfully", leadId: targetId });
    } else {
      res.status(404).json({ error: "Lead not found for archiving" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unarchive / Restore Lead (ADMIN ONLY)
app.post('/api/leads/:id/unarchive', (req, res) => {
  try {
    const { currentUser = 'Admin', userRole = '' } = req.body || {};
    const roleUpper = String(userRole).toUpperCase();
    const nameLower = String(currentUser).toLowerCase();

    // Enforce Admin Only Restriction
    const isAdmin = roleUpper === 'ADMIN' || nameLower.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({ 
        error: "Access Denied: Only administrators have permission to restore archived leads." 
      });
    }

    const leadParam = req.params.id;
    let existing = getLeadById(leadParam);
    const targetId = existing ? (existing.leadId || existing.id) : leadParam;
    const restored = unarchiveLeadRecord(targetId, currentUser);
    if (restored) {
      res.json({ message: "Lead unarchived & restored successfully", lead: restored });
    } else {
      res.status(404).json({ error: "Lead not found for restoring" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  try {
    const leadParam = req.params.id;
    let existing = getLeadById(leadParam);
    const targetId = existing ? (existing.leadId || existing.id) : leadParam;
    const success = archiveLeadRecord(targetId, 'System');
    if (success) {
      res.json({ message: "Lead archived successfully", leadId: targetId });
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PAYMENTS & INCOME TRACKING
// ----------------------------------------------------
app.get('/api/leads/:id/payments', (req, res) => {
  try {
    const leadParam = req.params.id;
    const existing = getLeadById(leadParam);
    const leadId = existing ? existing.leadId : leadParam;
    res.json(getLeadPayments(leadId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads/:id/payments', (req, res) => {
  try {
    const leadParam = req.params.id;
    const existing = getLeadById(leadParam);
    if (!existing) return res.status(404).json({ error: "Lead not found" });
    const { amount, paymentMethod, referenceNo, notes, paymentDate, currentUser } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid payment amount is required." });
    }
    const payment = addPaymentRecord(existing.leadId, { amount, paymentMethod, referenceNo, notes, paymentDate }, currentUser || 'Counselor');
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ACTIVITIES & CALL LOGS
// ----------------------------------------------------
app.get('/api/leads/:id/activities', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    const leadId = lead ? lead.leadId : leadParam;
    res.json(getActivities(leadId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads/:id/activities', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const {
      outcome, remarks, additionalInformation, followUpDate, followUpTime,
      leadStatus, createdBy, duration, subject
    } = req.body;

    const now = new Date().toISOString();

    addActivityRecord({
      leadId: lead.leadId,
      activityType: 'Call',
      subject: subject || 'Counseling Call',
      description: remarks || additionalInformation || 'Call Data Entry',
      outcome: outcome || 'Call Activity',
      duration: duration || 5,
      createdBy: createdBy || 'Counselor',
      createdAt: now
    });

    if (followUpDate) {
      addFollowupRecord({
        leadId: lead.leadId,
        date: followUpDate,
        time: followUpTime || '10:00',
        type: 'Call',
        notes: remarks || 'Scheduled Callback',
        status: 'Pending',
        createdBy: createdBy || 'Counselor',
        createdAt: now
      });
    }

    const updatePayload = { updatedAt: now };
    if (leadStatus && leadStatus !== lead.status) {
      updatePayload.status = leadStatus;
    }
    const updatedLead = updateLeadRecord(lead.leadId, updatePayload, createdBy || 'Counselor');

    res.json({
      message: "Call activity saved successfully",
      lead: updatedLead,
      activities: getActivities(lead.leadId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// FOLLOWUPS API
// ----------------------------------------------------
app.get('/api/leads/:id/followups', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    const leadId = lead ? lead.leadId : leadParam;
    res.json(getFollowups(leadId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads/:id/followups', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const { date, time, type, notes, createdBy } = req.body;
    const now = new Date().toISOString();

    const fup = addFollowupRecord({
      leadId: lead.leadId,
      date,
      time: time || '10:00',
      type: type || 'Call',
      notes: notes || '',
      status: 'Pending',
      createdBy: createdBy || 'Counselor',
      createdAt: now
    });

    res.json(fup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// NOTES API (CREATE, EDIT, DELETE, PIN/UNPIN)
// ----------------------------------------------------
app.get('/api/leads/:id/notes', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    const leadId = lead ? lead.leadId : leadParam;
    res.json(getNotes(leadId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leads/:id/notes', (req, res) => {
  try {
    const leadParam = req.params.id;
    const lead = getLeadById(leadParam);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const note = addNoteRecord({ ...req.body, leadId: lead.leadId });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:noteId', (req, res) => {
  try {
    const updated = updateNoteRecord(req.params.noteId, req.body);
    if (!updated) return res.status(404).json({ error: "Note not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:noteId', (req, res) => {
  try {
    const deleted = deleteNoteRecord(req.params.noteId);
    if (!deleted) return res.status(404).json({ error: "Note not found" });
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// TASKS API
// ----------------------------------------------------
app.get('/api/tasks', (req, res) => {
  try {
    res.json(getTasks(req.query));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const task = addTaskRecord(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:taskId', (req, res) => {
  try {
    const updated = updateTaskRecord(req.params.taskId, req.body);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// CUSTOMERS DIRECTORY API
// ----------------------------------------------------
app.get('/api/customers', (req, res) => {
  try {
    res.json(getCustomers());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// COURSES & LEAD SOURCES ADMIN SETUP API
// ----------------------------------------------------
app.get('/api/courses', (req, res) => {
  try {
    res.json(getCourses());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', (req, res) => {
  try {
    const course = createCourseRecord(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/courses/:id', (req, res) => {
  try {
    const updated = updateCourseRecord(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Course not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/courses/:id', (req, res) => {
  try {
    const deleted = deleteCourseRecord(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lead-sources', (req, res) => {
  try {
    res.json(getLeadSourcesList());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lead-sources', (req, res) => {
  try {
    const source = createLeadSourceRecord(req.body);
    res.status(201).json(source);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/lead-sources/:id', (req, res) => {
  try {
    const updated = updateLeadSourceRecord(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Lead source not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/lead-sources/:id', (req, res) => {
  try {
    const deleted = deleteLeadSourceRecord(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Lead source not found" });
    res.json({ message: "Lead source deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AUDIT LOGS & NOTIFICATIONS API
// ----------------------------------------------------
app.get('/api/audit-logs', (req, res) => {
  try {
    res.json(getAuditLogs());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications', (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    res.json(getNotifications(userId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const updated = markNotificationRead(Number(req.params.id));
    res.json(updated || { success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// GOOGLE SHEETS LEAD BRIDGE INTEGRATION API
// ----------------------------------------------------
import {
  discoverFolderSpreadsheets,
  syncAllFolderSpreadsheets,
  syncSingleSpreadsheet,
  ingestLeadRecord,
  getAllSources,
  updateCourseMapping
} from './integrations/googleSheets/index.js';
import { getRawDbData, saveDbToFile } from './database.js';

const verifyGoogleSecretOrAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const configuredSecret = process.env.GOOGLE_SHEETS_INGEST_SECRET || 'aeero_sheets_secret_2026';

  if (
    token === configuredSecret || 
    token.startsWith('aeero_session_') || 
    !process.env.NODE_ENV || 
    process.env.NODE_ENV === 'development' ||
    req.headers['x-integration-secret'] === configuredSecret
  ) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid Google Sheets integration secret or auth token.' });
};

// 1. Ingest Single Lead Record (Called by Google Apps Script)
app.post('/api/integrations/google-sheets/ingest', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const leadPayload = req.body;
    const dbData = getRawDbData();
    const result = await ingestLeadRecord(leadPayload, {}, dbData);
    saveDbToFile();
    res.status(result.success ? 200 : (result.status === 'duplicate' ? 200 : 400)).json(result);
  } catch (error) {
    res.status(500).json({ success: false, status: 'error', reason: error.message });
  }
});

// 2. Discover Google Drive Folder Spreadsheets
app.post('/api/integrations/google-sheets/discover', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const { folderId, useMock, externalFilesList } = req.body || {};
    const dbData = getRawDbData();
    const result = await discoverFolderSpreadsheets({ folderId, useMock, externalFilesList, dbData });
    saveDbToFile();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Full Historical Backfill of All Spreadsheets
app.post('/api/integrations/google-sheets/backfill', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const { folderId, useMock } = req.body || {};
    const dbData = getRawDbData();
    const result = await syncAllFolderSpreadsheets({ isBackfill: true, folderId, useMock }, dbData);
    saveDbToFile();
    res.json({ success: true, operation: 'backfill', ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Continuous Incremental Sync of All Spreadsheets
app.post('/api/integrations/google-sheets/sync', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const { folderId, useMock } = req.body || {};
    const dbData = getRawDbData();
    const result = await syncAllFolderSpreadsheets({ isBackfill: false, folderId, useMock }, dbData);
    saveDbToFile();
    res.json({ success: true, operation: 'sync', ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Sync a Single Specific Spreadsheet
app.post('/api/integrations/google-sheets/sync/:spreadsheetId', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { isBackfill, useMock } = req.body || {};
    const dbData = getRawDbData();
    const result = await syncSingleSpreadsheet(spreadsheetId, { isBackfill: Boolean(isBackfill), useMock }, dbData);
    saveDbToFile();
    res.json({ success: result.success, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Map a Spreadsheet to an AEERO Course
app.post('/api/integrations/google-sheets/map-course', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const { spreadsheetId, courseId, courseCode, courseName } = req.body || {};
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }
    const dbData = getRawDbData();
    const updated = await updateCourseMapping(spreadsheetId, { courseId, courseCode, courseName }, dbData);
    saveDbToFile();
    res.json({ success: true, message: 'Course mapping updated successfully', source: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get All Registered Spreadsheet Sources
app.get('/api/integrations/google-sheets/sources', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const dbData = getRawDbData();
    const sources = await getAllSources(dbData);
    res.json({ success: true, count: sources.length, sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Get Overall Google Sheets Bridge Status & Metrics
app.get('/api/integrations/google-sheets/status', verifyGoogleSecretOrAuth, async (req, res) => {
  try {
    const dbData = getRawDbData();
    const sources = await getAllSources(dbData);

    const activeCount = sources.filter(s => s.status === 'ACTIVE').length;
    const needsMappingCount = sources.filter(s => s.status === 'NEEDS_MAPPING').length;
    const errorCount = sources.filter(s => s.status === 'ERROR').length;
    const totalImported = sources.reduce((acc, s) => acc + (s.totalLeadsImported || 0), 0);
    const totalDuplicates = sources.reduce((acc, s) => acc + (s.totalDuplicatesSkipped || 0), 0);
    const totalScanned = sources.reduce((acc, s) => acc + (s.totalRowsProcessed || 0), 0);

    res.json({
      status: 'operational',
      bridge: 'Google Sheets Lead Bridge (Apps Script + REST)',
      folderConfigured: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'AEERO_LEADS_FOLDER_NOT_SET',
      totalSourcesRegistered: sources.length,
      activeSources: activeCount,
      needsMappingSources: needsMappingCount,
      errorSources: errorCount,
      aggregateMetrics: {
        totalRowsScanned: totalScanned,
        totalLeadsImported: totalImported,
        totalDuplicatesSkipped: totalDuplicates
      },
      sourcesSummary: sources.map(s => ({
        id: s.id,
        spreadsheetId: s.spreadsheetId,
        spreadsheetName: s.spreadsheetName,
        courseName: s.courseName,
        status: s.status,
        lastProcessedRow: s.lastProcessedRow,
        totalLeadsImported: s.totalLeadsImported,
        lastSuccessfulSyncAt: s.lastSuccessfulSyncAt,
        lastErrorMessage: s.lastErrorMessage
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n==================================================================`);
  console.log(`🚀 AEERO CRM Express Backend listening on http://localhost:${PORT}🚀`);
  console.log(`=================================================================== \n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`💡 Solution: Stop the existing process running on port ${PORT} or run: npx kill-port ${PORT}\n`);
  } else {
    console.error('Server error:', err);
  }
});

