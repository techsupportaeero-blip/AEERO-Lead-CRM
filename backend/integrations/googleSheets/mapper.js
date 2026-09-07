/**
 * Flexible Column Alias Mapper & Normalization Engine
 * AEERO CRM Integration
 */

// Comprehensive Column Aliases Map
export const COLUMN_ALIASES = {
  name: [
    'name', 'full name', 'full_name', 'customer name', 'customer_name',
    'student name', 'student_name', 'candidate name', 'candidate_name',
    'client name', 'client_name', 'lead name', 'lead_name', 'first name'
  ],
  mobile: [
    'mobile', 'phone', 'phone number', 'phone_number', 'contact number',
    'contact_number', 'mobile number', 'mobile_number', 'contact', 'whatsapp',
    'whatsapp number', 'whatsapp_number', 'tel', 'cell'
  ],
  email: [
    'email', 'email address', 'email_address', 'e-mail', 'e_mail', 'mail', 'email_id'
  ],
  course: [
    'course', 'interested course', 'interested_course', 'course interested',
    'course_interested', 'program', 'program name', 'training course',
    'course name', 'course_name', 'interested_in'
  ],
  formName: [
    'form_name', 'form name', 'lead form name', 'form title'
  ],
  source: [
    'source', 'lead source', 'lead_source', 'channel', 'source_name', 'traffic_source'
  ],
  platform: [
    'platform', 'lead platform', 'lead_platform', 'social media', 'network',
    'publisher_platform', 'publisher platform', 'ad_platform'
  ],
  campaign: [
    'campaign', 'campaign name', 'campaign_name', 'ad campaign', 'ad_campaign'
  ],
  campaignId: [
    'campaign id', 'campaign_id', 'campaignid', 'campaign_no'
  ],
  adSet: [
    'ad set', 'adset', 'ad set name', 'adset_name', 'ad_set_name', 'ad group', 'adgroup'
  ],
  adSetId: [
    'ad set id', 'adset_id', 'ad_set_id', 'adsetid', 'adgroup_id'
  ],
  ad: [
    'ad', 'ad name', 'ad_name', 'creative', 'ad headline', 'ad_title'
  ],
  adId: [
    'ad id', 'ad_id', 'adid'
  ],
  formId: [
    'form id', 'form_id', 'lead form id', 'leadgen_id'
  ],
  externalLeadId: [
    'lead id', 'lead_id', 'meta lead id', 'meta_lead_id', 'external lead id',
    'external_lead_id', 'fb_lead_id', 'id', 'leadgen_lead_id', 'gen_id'
  ],
  utmSource: ['utm_source', 'utm source'],
  utmMedium: ['utm_medium', 'utm medium'],
  utmCampaign: ['utm_campaign', 'utm campaign'],
  utmContent: ['utm_content', 'utm content'],
  utmTerm: ['utm_term', 'utm term'],
  date: [
    'date', 'created time', 'created_time', 'timestamp', 'lead date', 'lead_date',
    'submission time', 'submission_time', 'date_created', 'created_at', 'datetime'
  ],
  city: ['city', 'location', 'district', 'town'],
  state: ['state', 'province', 'region'],
  age: ['age'],
  qualification: [
    'qualification', 'education', 'highest qualification', 'degree',
    'what is your highest qualification', 'what is your highest qualification?',
    'education level', 'education_level', 'highest qualification?'
  ],
  status: [
    'lead_status', 'lead status', 'status', 'lead_state'
  ],
  isOrganic: [
    'is_organic', 'is organic', 'organic'
  ],
  preferredStudyMode: ['preferred study mode', 'study mode', 'mode', 'online offline', 'training mode'],
  requirement: [
    'requirement', 'message', 'query', 'notes', 'comments', 'remarks', 'inquiry',
    'when do you want to start the course', 'when do you want to start the course?',
    'are you ready to attend a 3 month solar pv installer training program',
    'are you ready to attend a 3 month solar pv installer training program?'
  ]
};

/**
 * Standardize string key for matching
 */
function cleanKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[-_.,\/\\()\[\]#?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build column index mapping from spreadsheet headers
 * @param {Array<string>} headers - First row of spreadsheet
 * @returns {Object} { canonicalField: columnIndex }
 */
export function buildHeaderMapping(headers = []) {
  const mapping = {};
  const cleanHeaders = headers.map(h => cleanKey(h));

  for (const [canonicalField, aliases] of Object.entries(COLUMN_ALIASES)) {
    const cleanAliases = aliases.map(a => cleanKey(a));
    for (let i = 0; i < cleanHeaders.length; i++) {
      const header = cleanHeaders[i];
      if (!header) continue;

      // Check exact alias match
      if (cleanAliases.includes(header)) {
        mapping[canonicalField] = i;
        break;
      }

      // Check fuzzy/partial alias match if not already matched
      if (mapping[canonicalField] === undefined) {
        for (const alias of cleanAliases) {
          if (header === alias || header.includes(alias) || alias.includes(header)) {
            mapping[canonicalField] = i;
            break;
          }
        }
      }
    }
  }

  return mapping;
}

/**
 * Normalizes phone number into clean format
 */
export function normalizeMobile(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9+]/g, '').trim();

  // If starts with 91 and 12 digits, format with +91
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    cleaned = `+${cleaned}`;
  } else if (/^[6-9]\d{9}$/.test(cleaned)) {
    // 10-digit Indian standard
    cleaned = `+91 ${cleaned}`;
  } else if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    cleaned = `+91 ${cleaned.substring(3)}`;
  }

  return cleaned;
}

/**
 * Normalizes email address
 */
export function normalizeEmail(email) {
  if (!email) return null;
  const trimmed = String(email).trim().toLowerCase();
  return trimmed !== '' && trimmed.includes('@') ? trimmed : null;
}

/**
 * Normalizes person name
 */
export function normalizeName(name) {
  if (!name) return 'Meta Ads Lead';
  const trimmed = String(name).trim();
  return trimmed !== '' ? trimmed : 'Meta Ads Lead';
}

/**
 * Normalizes date / timestamp string into ISO format
 */
export function normalizeDate(dateVal) {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch (e) {
    // ignore
  }
  return new Date().toISOString();
}

/**
 * Maps raw spreadsheet row array into normalized AEERO lead payload
 * @param {Array<any>} row - Values of the row
 * @param {Object} headerMapping - Output of buildHeaderMapping
 * @param {Object} spreadsheetMetadata - { spreadsheetId, spreadsheetName, rowNumber, defaultCourseName, defaultCourseCode }
 * @returns {Object} Normalized lead object
 */
export function mapRowToLead(row = [], headerMapping = {}, spreadsheetMetadata = {}) {
  const getVal = (field) => {
    const idx = headerMapping[field];
    if (idx !== undefined && idx !== null && row[idx] !== undefined && row[idx] !== null) {
      const val = String(row[idx]).trim();
      return val === '' ? null : val;
    }
    return null;
  };

  const rawName = getVal('name');
  const rawMobile = getVal('mobile');
  const rawEmail = getVal('email');
  const rawCourse = getVal('course') || spreadsheetMetadata.defaultCourseName || null;
  const rawSource = getVal('source') || 'Meta Ads';
  const rawFormName = getVal('formName');
  let platform = getVal('platform');

  // Normalize platform shorthand
  if (platform) {
    const pLower = platform.toLowerCase().trim();
    if (pLower === 'ig' || pLower.includes('instagram')) platform = 'Instagram';
    else if (pLower === 'fb' || pLower.includes('facebook')) platform = 'Facebook';
  } else {
    const combinedSignals = `${getVal('campaign') || ''} ${getVal('source') || ''} ${getVal('utmSource') || ''}`.toLowerCase();
    if (combinedSignals.includes('instagram') || combinedSignals.includes('ig')) {
      platform = 'Instagram';
    } else if (combinedSignals.includes('facebook') || combinedSignals.includes('fb')) {
      platform = 'Facebook';
    } else if (rawSource === 'Meta Ads') {
      platform = 'Facebook / Instagram';
    }
  }

  const normalizedMobile = normalizeMobile(rawMobile);
  const normalizedEmail = normalizeEmail(rawEmail);
  const normalizedName = normalizeName(rawName);

  // Collect unmapped columns (telecaller/counselor remarks)
  const mappedIndexes = new Set(Object.values(headerMapping));
  const telecallerRemarks = [];
  if (spreadsheetMetadata.headers && Array.isArray(spreadsheetMetadata.headers)) {
    for (let i = 0; i < row.length; i++) {
      if (!mappedIndexes.has(i) && row[i] !== undefined && row[i] !== null) {
        const val = String(row[i]).trim();
        if (val !== '') {
          const headerName = spreadsheetMetadata.headers[i] ? String(spreadsheetMetadata.headers[i]).trim() : `Column ${i+1}`;
          telecallerRemarks.push(`[${headerName}]: ${val}`);
        }
      }
    }
  }

  // Build remarks: combine telecaller remarks + source info
  let remarksText = '';
  if (telecallerRemarks.length > 0) {
    remarksText = telecallerRemarks.join(' | ');
  }
  const sourceInfo = `Imported from "${spreadsheetMetadata.spreadsheetName || 'Spreadsheet'}" (Row ${spreadsheetMetadata.rowNumber || 'N/A'})`;
  remarksText = remarksText ? `${remarksText} || ${sourceInfo}` : sourceInfo;

  // Determine interestedCourse: prefer dedicated course field, fallback to formName
  const interestedCourse = rawCourse || rawFormName || null;

  return {
    name: normalizedName,
    mobile: normalizedMobile,
    whatsappNumber: normalizedMobile,
    email: normalizedEmail,
    city: getVal('city'),
    state: getVal('state'),
    age: getVal('age') ? parseInt(getVal('age'), 10) || null : null,
    qualification: getVal('qualification'),
    interestedCourse: interestedCourse,
    preferredStudyMode: getVal('preferredStudyMode') || 'Offline',
    requirement: getVal('requirement'),
    remarks: remarksText,

    // Marketing Attribution
    source: rawSource,
    platform: platform,
    campaign: getVal('campaign'),
    campaignId: getVal('campaignId'),
    adSet: getVal('adSet'),
    adSetId: getVal('adSetId'),
    ad: getVal('ad'),
    adId: getVal('adId'),
    formId: getVal('formId'),

    // UTM Attribution
    utmSource: getVal('utmSource') || (rawSource === 'Meta Ads' ? 'facebook' : null),
    utmMedium: getVal('utmMedium') || 'cpc',
    utmCampaign: getVal('utmCampaign') || getVal('campaign'),
    utmContent: getVal('utmContent'),
    utmTerm: getVal('utmTerm'),

    // Status from sheet
    status: getVal('status'),

    // External IDs & Bridge Metadata
    externalLeadId: getVal('externalLeadId'),
    externalSource: 'Google_Sheets_Bridge',
    sourceSpreadsheetId: spreadsheetMetadata.spreadsheetId || null,
    sourceSpreadsheetName: spreadsheetMetadata.spreadsheetName || null,
    sourceSheetName: spreadsheetMetadata.sheetName || null,
    sourceRowNumber: spreadsheetMetadata.rowNumber || null,

    leadDateTime: normalizeDate(getVal('date')),
    createdBy: 'Google Sheets Bridge'
  };
}
