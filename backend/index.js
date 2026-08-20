import express from 'express';
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
  STATUS_MAP
} from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDb().catch(console.error);

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
    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

