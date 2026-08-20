// Standard Lead Statuses matching screenshot
export const LEAD_STATUSES = [
  { code: 'NEW', label: 'New', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { code: 'CONTACTED', label: 'Contacted', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'QUALIFIED', label: 'Qualified', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { code: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { code: 'NEGOTIATION', label: 'Negotiation', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { code: 'WON', label: 'Won', color: 'bg-green-100 text-green-800 border-green-300' },
  { code: 'LOST', label: 'Lost', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { code: 'NO_ANSWER', label: 'No Answer', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { code: 'RESPONDED', label: 'Responded', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { code: 'GIVEN_DETAILS', label: 'Given Details', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { code: 'INTERESTED', label: 'Interested', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { code: 'FOLLOW_UP', label: 'Follow-up', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { code: 'CONVERTED', label: 'Converted', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
];

export const getStatusLabel = (codeOrLabel) => {
  if (!codeOrLabel) return 'New';
  const found = LEAD_STATUSES.find(s => s.code === codeOrLabel || s.label.toLowerCase() === String(codeOrLabel).toLowerCase());
  return found ? found.label : codeOrLabel;
};

export const getStatusCode = (codeOrLabel) => {
  if (!codeOrLabel) return 'NEW';
  const found = LEAD_STATUSES.find(s => s.code === codeOrLabel || s.label.toLowerCase() === String(codeOrLabel).toLowerCase());
  return found ? found.code : 'NEW';
};

// Configurable Lead Owners / Counselors matching screenshot & app
export const COUNSELORS = [
  'Sourav Sharma',
  'Anita Verma',
  'Suresh Menon',
  'Admin User 1'
];

// Lead Sources matching screenshot & app
export const LEAD_SOURCES = [
  'WhatsApp',
  'Cold Call',
  'Social Media',
  'Trade Show',
  'Google Ads',
  'Referral',
  'LinkedIn',
  'Website',
  'Meta Ads',
  'Walk-in',
  'Organic',
  'Other'
];

// Follow-up Communication Types
export const FOLLOWUP_TYPES = [
  'Call',
  'WhatsApp',
  'SMS',
  'Email',
  'Meeting'
];

// Aviation Courses
export const AVIATION_COURSES = [
  'Diploma in Industrial Safety',
  'Sub Fire Officer',
  'Fireman',
  'Diploma In Sanitary Inspector',
  'Health Sanitary Inspector',
  'MSME',
];

