import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.resolve(__dirname, './AEERO_crm_data.json');

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
  leads: [],
  activities: [],
  followups: [],
  notes: [],
  tasks: [],
  customers: [],
  courses: [],
  leadSources: [],
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
  console.log('Initializing AEERO CRM persistent database schema & seed data...');
  const now = new Date().toISOString();

  dbData = {
    users: [
      { id: 1, username: 'admin', password: 'admin123', name: 'Admin User 1', role: 'ADMIN', email: 'admin@AEERO.edu', active: true },
      { id: 2, username: 'sourav', password: 'password123', name: 'Sourav Sharma', role: 'LEAD_FINDER', email: 'sourav@AEERO.edu', active: true },
      { id: 3, username: 'anita', password: 'password123', name: 'Anita Verma', role: 'LEAD_FINDER', email: 'anita@AEERO.edu', active: true },
      { id: 4, username: 'suresh', password: 'password123', name: 'Suresh Menon', role: 'LEAD_FINDER', email: 'suresh@AEERO.edu', active: true }
    ],
    courses: [
      { id: 1, code: 'SAFETY', name: 'Diploma in Industrial Safety', description: 'Industrial Safety & Workplace Risk Management Course', price: 120000, active: true },
      { id: 2, code: 'SUB_FIRE', name: 'Sub Fire Officer', description: 'Fire Officer Training & Emergency Management', price: 95000, active: true },
      { id: 3, code: 'FIREMAN', name: 'Fireman', description: 'Fire Safety & Firefighting Operations Training', price: 75000, active: true },
      { id: 4, code: 'SANITARY', name: 'Diploma In Sanitary Inspector', description: 'Sanitation & Public Health Inspection Diploma', price: 85000, active: true },
      { id: 5, code: 'HEALTH_SANITARY', name: 'Health Sanitary Inspector', description: 'Health & Municipal Sanitation Training', price: 85000, active: true },
      { id: 6, code: 'MSME', name: 'MSME', description: 'MSME Certified Vocational & Skill Training Program', price: 60000, active: true }
    ],
    leadSources: [
      { id: 1, name: 'Meta Ads', code: 'META', active: true },
      { id: 2, name: 'Google Ads', code: 'GOOGLE', active: true },
      { id: 3, name: 'Website', code: 'WEB', active: true },
      { id: 4, name: 'WhatsApp', code: 'WHATSAPP', active: true },
      { id: 5, name: 'Referral', code: 'REFERRAL', active: true },
      { id: 6, name: 'Walk-in', code: 'WALKIN', active: true },
      { id: 7, name: 'Organic', code: 'ORGANIC', active: true },
      { id: 8, name: 'Other', code: 'OTHER', active: true }
    ],
    customers: [
      { customerId: 1, name: 'Sourav Sharma', email: 'sourav.sharma@example.com', phone: '+91 98765 43210', whatsapp: '+91 98765 43210', city: 'Delhi', state: 'Delhi', notes: 'Interested in flight simulator sessions.', createdAt: now, updatedAt: now },
      { customerId: 2, name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 98123 45678', whatsapp: '+91 98123 45678', city: 'Ahmedabad', state: 'Gujarat', notes: 'Inquired for Cabin Crew training.', createdAt: now, updatedAt: now },
      { customerId: 3, name: 'Ananya Roy', email: 'ananya.roy@example.com', phone: '+91 98450 12345', whatsapp: '+91 98450 12345', city: 'Bengaluru', state: 'Karnataka', notes: 'Enrolled student for CPL 2026 Batch.', createdAt: now, updatedAt: now }
    ],
    leads: [
      {
        id: 1,
        leadId: "LD-000001",
        name: "Sourav Sharma",
        mobile: "+91 98765 43210",
        whatsappNumber: "+91 98765 43210",
        email: "sourav.sharma@example.com",
        city: "Delhi",
        state: "Delhi",
        age: 24,
        qualification: "Bachelor of Technology",
        source: "Meta Ads",
        campaign: "CPL Admission Campaign 2026",
        campaignId: "CAMP-9021",
        adSet: "North India Aviation Aspirants",
        adSetId: "ADSET-402",
        ad: "Fly High - Early Bird 2026",
        adId: "AD-109",
        formId: "FORM-881",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "cpl_2026",
        utmContent: "fly_high_banner",
        utmTerm: "pilot_course",
        gclid: "",
        fbclid: "fb.1.17128.88912",
        landingPage: "https://AEERO.edu/cpl-admission",
        interestedCourse: "Commercial Pilot License (CPL)",
        preferredStudyMode: "Offline",
        requirement: "Wants flight simulator demonstration",
        remarks: "High intent student with ground subject preparation.",
        ownerId: "Sourav Sharma",
        status: "INTERESTED",
        priority: "High",
        tags: JSON.stringify(["CPL", "Hot Lead", "Fast Track"]),
        isArchived: 0,
        createdBy: "Meta Ads Integration",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        leadId: "LD-000002",
        name: "Priya Patel",
        mobile: "+91 98123 45678",
        whatsappNumber: "+91 98123 45678",
        email: "priya.patel@example.com",
        city: "Ahmedabad",
        state: "Gujarat",
        age: 22,
        qualification: "Higher Secondary (10+2)",
        source: "Google Ads",
        campaign: "Aviation Ground Crew 2026",
        campaignId: "CAMP-8812",
        adSet: "Search - Air Hostess Course",
        adSetId: "ADSET-501",
        ad: "Join Airlines Crew - 100% Placement",
        adId: "AD-204",
        formId: "FORM-502",
        utmSource: "google",
        utmMedium: "search",
        utmCampaign: "cabin_crew",
        utmContent: "",
        utmTerm: "air_hostess_training",
        gclid: "gclid_99812487",
        fbclid: "",
        landingPage: "https://AEERO.edu/cabin-crew",
        interestedCourse: "Cabin Crew & Ground Staff Training",
        preferredStudyMode: "Hybrid",
        requirement: "Inquired for 100% placement assurance",
        remarks: "Fresh inquiry from Google Search.",
        ownerId: "Anita Verma",
        status: "NEW",
        priority: "Medium",
        tags: JSON.stringify(["Cabin Crew", "Gujarat"]),
        isArchived: 0,
        createdBy: "Google Ads Integration",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        leadId: "LD-000003",
        name: "Vikram Malhotra",
        mobile: "+91 99887 76655",
        whatsappNumber: "+91 99887 76655",
        email: "vikram.m@example.com",
        city: "Mumbai",
        state: "Maharashtra",
        age: 26,
        qualification: "B.Sc Aeronautical Science",
        source: "Website",
        campaign: "Organic Web Form",
        campaignId: "CAMP-001",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "WEB-01",
        utmSource: "organic",
        utmMedium: "web",
        utmCampaign: "ame_search",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "https://AEERO.edu/ame-course",
        interestedCourse: "Aircraft Maintenance Engineering (AME)",
        preferredStudyMode: "Offline",
        requirement: "Callback regarding DGCA exam syllabus",
        remarks: "Urgent callback scheduled.",
        ownerId: "Sourav Sharma",
        status: "FOLLOW_UP",
        priority: "Urgent",
        tags: JSON.stringify(["AME", "Urgent Callback"]),
        isArchived: 0,
        createdBy: "Website API",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 4,
        leadId: "LD-000004",
        name: "Siddharth Das",
        mobile: "+91 97112 23344",
        whatsappNumber: "+91 97112 23344",
        email: "siddharth.das@example.com",
        city: "Kolkata",
        state: "West Bengal",
        age: 23,
        qualification: "Graduate",
        source: "WhatsApp",
        campaign: "Direct WhatsApp Inquiry",
        campaignId: "WA-001",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "whatsapp",
        utmMedium: "chat",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Airport Management & Operations",
        preferredStudyMode: "Online",
        requirement: "Fee breakdown sent via WhatsApp",
        remarks: "Syllabus details provided.",
        ownerId: "Suresh Menon",
        status: "GIVEN_DETAILS",
        priority: "Low",
        tags: JSON.stringify(["Airport Mgmt", "Distance"]),
        isArchived: 0,
        createdBy: "WhatsApp API",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 5,
        leadId: "LD-000005",
        name: "Ananya Roy",
        mobile: "+91 98450 12345",
        whatsappNumber: "+91 98450 12345",
        email: "ananya.roy@example.com",
        city: "Bengaluru",
        state: "Karnataka",
        age: 21,
        qualification: "10+2 Science",
        source: "Walk-in",
        campaign: "Bangalore Campus Open Day",
        campaignId: "OPEN-01",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "offline",
        utmMedium: "walkin",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Commercial Pilot License (CPL)",
        preferredStudyMode: "Offline",
        requirement: "Enrolled student",
        remarks: "Completed admission registration & fee deposit.",
        ownerId: "Anita Verma",
        status: "CONVERTED",
        priority: "High",
        tags: JSON.stringify(["Enrolled", "CPL", "Walk-in"]),
        isArchived: 0,
        createdBy: "Anita Verma",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 6,
        leadId: "LD-000006",
        name: "Rohan Kapoor",
        mobile: "+91 98112 34567",
        whatsappNumber: "+91 98112 34567",
        email: "rohan.kapoor@example.com",
        city: "Chandigarh",
        state: "Punjab",
        age: 20,
        qualification: "10+2 Non-Medical",
        source: "Meta Ads",
        campaign: "CPL North Admission 2026",
        campaignId: "CAMP-9901",
        adSet: "Punjab Pilot Aspirants",
        adSetId: "ADSET-601",
        ad: "Become a Commercial Pilot",
        adId: "AD-301",
        formId: "FORM-901",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "cpl_north",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "fb.1.99214.11029",
        landingPage: "https://aeero.edu/cpl",
        interestedCourse: "Commercial Pilot License (CPL)",
        preferredStudyMode: "Offline",
        requirement: "Wants flight simulator trial & fee structure",
        remarks: "Highly enthusiastic for 2026 Batch.",
        ownerId: "Sourav Sharma",
        status: "INTERESTED",
        priority: "High",
        tags: JSON.stringify(["CPL", "Pilot", "North"]),
        isArchived: 0,
        createdBy: "Meta Ads Integration",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 7,
        leadId: "LD-000007",
        name: "Sneha Sharma",
        mobile: "+91 98765 11223",
        whatsappNumber: "+91 98765 11223",
        email: "sneha.s@example.com",
        city: "Jaipur",
        state: "Rajasthan",
        age: 19,
        qualification: "10+2 Arts",
        source: "Social Media",
        campaign: "Cabin Crew Hiring Campaign",
        campaignId: "CAMP-7712",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "instagram",
        utmMedium: "reels",
        utmCampaign: "crew_2026",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Cabin Crew & Ground Staff Training",
        preferredStudyMode: "Offline",
        requirement: "Air Hostess course eligibility & height inquiry",
        remarks: "Scheduled for counseling interview.",
        ownerId: "Anita Verma",
        status: "QUALIFIED",
        priority: "Medium",
        tags: JSON.stringify(["Cabin Crew", "Jaipur"]),
        isArchived: 0,
        createdBy: "Instagram Integration",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 8,
        leadId: "LD-000008",
        name: "Aman Verma",
        mobile: "+91 99887 65432",
        whatsappNumber: "+91 99887 65432",
        email: "aman.verma@example.com",
        city: "Lucknow",
        state: "Uttar Pradesh",
        age: 22,
        qualification: "B.Tech Mechanical",
        source: "Google Ads",
        campaign: "AME DGCA Certification 2026",
        campaignId: "CAMP-3301",
        adSet: "Search - Aircraft Maintenance",
        adSetId: "ADSET-881",
        ad: "DGCA AME Approved College",
        adId: "AD-901",
        formId: "",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "ame_2026",
        utmContent: "",
        utmTerm: "ame_admission",
        gclid: "gclid_331049281",
        fbclid: "",
        landingPage: "https://aeero.edu/ame",
        interestedCourse: "Aircraft Maintenance Engineering (AME)",
        preferredStudyMode: "Offline",
        requirement: "Inquired about DGCA licensing exam preparation",
        remarks: "Fresh inquiry from Google Search.",
        ownerId: "Suresh Menon",
        status: "NEW",
        priority: "Urgent",
        tags: JSON.stringify(["AME", "Engineering", "UP"]),
        isArchived: 0,
        createdBy: "Google Ads",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 9,
        leadId: "LD-000009",
        name: "Divya Nair",
        mobile: "+91 98440 98765",
        whatsappNumber: "+91 98440 98765",
        email: "divya.nair@example.com",
        city: "Kochi",
        state: "Kerala",
        age: 21,
        qualification: "B.Com",
        source: "Website",
        campaign: "Airport Mgmt Prospectus Form",
        campaignId: "WEB-009",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "website",
        utmMedium: "organic",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Airport Management & Operations",
        preferredStudyMode: "Online",
        requirement: "Fee breakdown & online class timing sent",
        remarks: "Shared prospectus over email.",
        ownerId: "Sourav Sharma",
        status: "GIVEN_DETAILS",
        priority: "Low",
        tags: JSON.stringify(["Airport Mgmt", "Online"]),
        isArchived: 0,
        createdBy: "Website API",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 10,
        leadId: "LD-000010",
        name: "Karan Singh Rathore",
        mobile: "+91 97113 44556",
        whatsappNumber: "+91 97113 44556",
        email: "karan.rathore@example.com",
        city: "Indore",
        state: "Madhya Pradesh",
        age: 24,
        qualification: "B.Sc Physics",
        source: "Referral",
        campaign: "Alumni Referral Program",
        campaignId: "REF-101",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "referral",
        utmMedium: "alumni",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Diploma in Industrial Safety",
        preferredStudyMode: "Offline",
        requirement: "Industrial safety diploma admission details",
        remarks: "Follow-up scheduled for fee payment.",
        ownerId: "Anita Verma",
        status: "FOLLOW_UP",
        priority: "High",
        tags: JSON.stringify(["Safety", "Referral"]),
        isArchived: 0,
        createdBy: "Counselor",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 11,
        leadId: "LD-000011",
        name: "Meera Joshi",
        mobile: "+91 98201 55667",
        whatsappNumber: "+91 98201 55667",
        email: "meera.j@example.com",
        city: "Pune",
        state: "Maharashtra",
        age: 23,
        qualification: "B.Sc Aviation",
        source: "Walk-in",
        campaign: "Pune Campus Inquiry",
        campaignId: "WALK-02",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "offline",
        utmMedium: "campus_visit",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Health Sanitary Inspector",
        preferredStudyMode: "Offline",
        requirement: "Admission confirmed & registration fee paid",
        remarks: "Converted student for 2026 Batch.",
        ownerId: "Suresh Menon",
        status: "WON",
        priority: "High",
        tags: JSON.stringify(["Enrolled", "Health Inspector"]),
        isArchived: 0,
        createdBy: "Suresh Menon",
        createdAt: now,
        updatedAt: now
      },
      {
        id: 12,
        leadId: "LD-000012",
        name: "Yash Vardhan",
        mobile: "+91 99001 88990",
        whatsappNumber: "+91 99001 88990",
        email: "yash.v@example.com",
        city: "Delhi",
        state: "Delhi",
        age: 21,
        qualification: "10+2 Science",
        source: "Meta Ads",
        campaign: "Fire Safety Specialization 2026",
        campaignId: "CAMP-4402",
        adSet: "",
        adSetId: "",
        ad: "",
        adId: "",
        formId: "",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "fire_safety",
        utmContent: "",
        utmTerm: "",
        gclid: "",
        fbclid: "",
        landingPage: "",
        interestedCourse: "Sub Fire Officer",
        preferredStudyMode: "Offline",
        requirement: "Inquired for Fire Officer course duration & physical tests",
        remarks: "Responded over WhatsApp.",
        ownerId: "Sourav Sharma",
        status: "RESPONDED",
        priority: "Medium",
        tags: JSON.stringify(["Fire Officer", "Delhi"]),
        isArchived: 0,
        createdBy: "Meta Ads",
        createdAt: now,
        updatedAt: now
      }
    ],
    activities: [
      { activityId: 1, leadId: "LD-000001", activityType: "Lead Created", subject: "Meta Ads Inquiry", description: "Lead captured via Meta Ads campaign", outcome: "Initial Import", duration: 0, participants: "Rahul Sharma", attachmentUrl: "", createdBy: "System", createdAt: now },
      { activityId: 2, leadId: "LD-000002", activityType: "Lead Created", subject: "Google Search Inquiry", description: "Lead captured via Google Search Ads", outcome: "Initial Import", duration: 0, participants: "Priya Patel", attachmentUrl: "", createdBy: "System", createdAt: now },
      { activityId: 3, leadId: "LD-000003", activityType: "Call", subject: "Counseling Call", description: "Discussion regarding simulator training & flight hours", outcome: "Interested", duration: 15, participants: "Vikram Malhotra, Rahul Sharma", attachmentUrl: "", createdBy: "Rahul Sharma", createdAt: now }
    ],
    followups: [
      { followUpId: 1, leadId: "LD-000003", date: "2026-08-15", time: "14:30", type: "Call", notes: "Discuss CPL fee structure and flight simulator session", status: "Pending", createdBy: "Rahul Sharma", createdAt: now }
    ],
    notes: [
      { noteId: 1, leadId: "LD-000001", title: "CPL Flight Hours Requirement", content: "Student requires 200 hours of multi-engine flying preparation.", isPinned: true, createdBy: "Rahul Sharma", createdAt: now, updatedAt: now }
    ],
    tasks: [
      { taskId: 1, title: "Send CPL Prospectus", description: "Send official AEERO CPL prospectus & fee structure PDF", leadId: "LD-000001", assignedUser: "Rahul Sharma", dueDate: "2026-08-14", dueTime: "11:00", priority: "High", repeat: "None", status: "Pending", createdBy: "Rahul Sharma", createdAt: now, updatedAt: now }
    ],
    auditLogs: [
      { id: 1, user: "System", action: "DATABASE_INIT", entity: "SYSTEM", entityId: "0", timestamp: now, oldValue: "", newValue: "Database seeded successfully" }
    ],
    notifications: [
      { id: 1, userId: 1, leadId: "LD-000003", title: "Follow-up Scheduled", message: "Callback scheduled for Vikram Malhotra (LD-000003)", type: "FOLLOW_UP", isRead: false, createdAt: now }
    ],
    lastLeadId: 12,
    lastActivityId: 3,
    lastFollowupId: 1,
    lastNoteId: 1,
    lastTaskId: 1,
    lastCustomerId: 3,
    lastAuditId: 1,
    lastNotificationId: 1
  };

  saveToFile();
};

const loadFromFile = () => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      dbData = JSON.parse(raw);

      const now = new Date().toISOString();

      // Ensure all arrays exist & seed defaults if empty
      if (!dbData.users || dbData.users.length === 0) {
        dbData.users = [
          { id: 1, username: 'admin', password: 'admin123', name: 'Admin User 1', role: 'ADMIN', email: 'admin@AEERO.edu', active: true },
          { id: 2, username: 'rahul', password: 'password123', name: 'Rahul Sharma', role: 'LEAD_FINDER', email: 'rahul@AEERO.edu', active: true },
          { id: 3, username: 'anita', password: 'password123', name: 'Anita Verma', role: 'LEAD_FINDER', email: 'anita@AEERO.edu', active: true },
          { id: 4, username: 'suresh', password: 'password123', name: 'Suresh Menon', role: 'LEAD_FINDER', email: 'suresh@AEERO.edu', active: true }
        ];
      }

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

// ----------------------------------------------------
// AUTHENTICATION & USERS
// ----------------------------------------------------
export const authenticateUser = (username, password) => {
  const user = (dbData.users || []).find(u => u.username === username && u.password === password && u.active);
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

let lastAssignedCounselorIndex = 0;

  export const getNextAutoAssignedCounselor = () => {
    const activeCounselors = (dbData.users || [])
      .filter(u => u.active && (u.role === 'LEAD_FINDER' || u.role === 'ADMIN'))
      .map(u => u.name);

    if (!activeCounselors || activeCounselors.length === 0) {
      return 'Sourav Sharma';
    }

    const counselor = activeCounselors[lastAssignedCounselorIndex % activeCounselors.length];
    lastAssignedCounselorIndex = (lastAssignedCounselorIndex + 1) % activeCounselors.length;
    return counselor;
  };

  export const createLeadRecord = (leadObj, currentUser = 'System') => {
    let assignedOwner = leadObj.ownerId;
    if (!assignedOwner || assignedOwner === 'Rahul Sharma' || assignedOwner === 'Unassigned' || assignedOwner === 'Auto-Assign') {
      assignedOwner = getNextAutoAssignedCounselor();
    }

    const normObj = {
      ...leadObj,
      ownerId: assignedOwner,
      status: normalizeStatus(leadObj.status),
      isArchived: 0
    };
    dbData.leads.push(normObj);

    // Link or Create Customer Record
    linkOrCreateCustomer(normObj);

    // Audit log
    logAudit(currentUser, 'LEAD_CREATED', 'LEAD', normObj.leadId, '', normObj);

    saveToFile();
    return normObj;
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
  export const getStatsData = () => {
    const activeLeads = (dbData.leads || []).filter(l => !l.isArchived);
    const todayStr = new Date().toISOString().split('T')[0];

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
    const activeCounselors = ['Sourav Sharma', 'Anita Verma', 'Suresh Menon', 'Admin User 1'];
    const employeeMap = {};

    activeCounselors.forEach(cName => {
      employeeMap[cName] = { name: cName, assigned: 0, contacted: 0, interested: 0, followups: 0, converted: 0, lost: 0 };
    });

    activeLeads.forEach(l => {
      let owner = l.ownerId || l.owner || 'Sourav Sharma';
      if (owner === 'Rahul Sharma') owner = 'Sourav Sharma';
      if (!employeeMap[owner]) {
        employeeMap[owner] = { name: owner, assigned: 0, contacted: 0, interested: 0, followups: 0, converted: 0, lost: 0 };
      }
      employeeMap[owner].assigned += 1;
      if (l.status !== 'NEW') employeeMap[owner].contacted += 1;
      if (l.status === 'INTERESTED') employeeMap[owner].interested += 1;
      if (l.status === 'FOLLOW_UP') employeeMap[owner].followups += 1;
      if (l.status === 'CONVERTED' || l.status === 'WON') employeeMap[owner].converted += 1;
      if (l.status === 'LOST' || l.status === 'NOT_INTERESTED') employeeMap[owner].lost += 1;
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

