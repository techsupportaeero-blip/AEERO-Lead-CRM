/**
 * Course Resolution & Intelligent Catalog Matcher
 * AEERO CRM Integration
 */

// Standard AEERO Course Catalog with Aliases & Keywords
export const COURSE_CATALOG = [
  {
    code: 'CPL',
    name: 'Commercial Pilot License (CPL)',
    aliases: ['cpl', 'commercial pilot', 'commercial pilot license', 'pilot license', 'cpl training', 'cpl aviation'],
    keywords: ['cpl', 'pilot']
  },
  {
    code: 'PPL',
    name: 'Private Pilot License (PPL)',
    aliases: ['ppl', 'private pilot', 'private pilot license', 'ppl training'],
    keywords: ['ppl', 'private pilot']
  },
  {
    code: 'CABIN_CREW',
    name: 'Cabin Crew & Ground Staff Training',
    aliases: ['cabin crew', 'air hostess', 'flight attendant', 'cabin crew training', 'ground staff', 'aviation hospitality'],
    keywords: ['cabin', 'crew', 'hostess', 'flight attendant', 'ground staff']
  },
  {
    code: 'AME',
    name: 'Aircraft Maintenance Engineering (AME)',
    aliases: ['ame', 'aircraft maintenance', 'aeronautical engineering', 'aircraft engineering', 'dgca ame'],
    keywords: ['ame', 'maintenance', 'aircraft maintenance', 'aeronautical']
  },
  {
    code: 'AIRPORT_MGMT',
    name: 'Airport Management & Operations',
    aliases: ['airport management', 'aviation management', 'airport operations', 'ground operations'],
    keywords: ['airport', 'operations', 'airport management']
  },
  {
    code: 'SAFETY',
    name: 'Diploma in Industrial Safety',
    aliases: ['industrial safety', 'safety diploma', 'workplace safety', 'fire & safety', 'safety inspection', 'industrial safety batch'],
    keywords: ['industrial safety', 'safety']
  },
  {
    code: 'SUB_FIRE',
    name: 'Sub Fire Officer',
    aliases: ['sub fire officer', 'sub fire', 'fire officer', 'fire safety training', 'fire fighting'],
    keywords: ['sub fire', 'fire officer']
  },
  {
    code: 'HEALTH_SANITARY',
    name: 'Health Sanitary Inspector',
    aliases: ['health sanitary inspector', 'health sanitary', 'sanitary inspector', 'sanitation diploma', 'municipal sanitation'],
    keywords: ['sanitary', 'health sanitary', 'sanitation']
  },
  {
    code: 'DRONE_PILOT',
    name: 'Drone Pilot Training',
    aliases: ['drone', 'drone pilot', 'uav pilot', 'drone training', 'drone license'],
    keywords: ['drone', 'uav']
  }
];

/**
 * Intelligent course resolution using multi-signal matching
 * @param {Object} signals - { spreadsheetName, tabName, campaignName, adName, explicitCourse }
 * @returns {Object} { courseName, courseCode, courseId, confidence: 'HIGH' | 'LOW', matchReason }
 */
export function resolveCourse(signals = {}) {
  const {
    explicitCourse = '',
    spreadsheetName = '',
    tabName = '',
    campaignName = '',
    adName = '',
    customCatalog = null
  } = signals;

  const catalog = customCatalog || COURSE_CATALOG;

  // Helper to clean and normalize text
  const clean = (str) => String(str || '').toLowerCase().replace(/[-_.,\/\\()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Explicit Course Column Check (Highest confidence)
  if (explicitCourse && explicitCourse.trim() !== '') {
    const cleanedExplicit = clean(explicitCourse);
    for (const course of catalog) {
      if (clean(course.name) === cleanedExplicit || clean(course.code) === cleanedExplicit) {
        return {
          courseName: course.name,
          courseCode: course.code,
          confidence: 'HIGH',
          matchReason: `Explicit course match: "${explicitCourse}"`
        };
      }
      for (const alias of course.aliases) {
        if (cleanedExplicit.includes(alias) || alias.includes(cleanedExplicit)) {
          return {
            courseName: course.name,
            courseCode: course.code,
            confidence: 'HIGH',
            matchReason: `Explicit course alias match: "${explicitCourse}" -> ${course.name}`
          };
        }
      }
    }
  }

  // 2. Spreadsheet Name / Tab Name Match (Very High confidence)
  const combinedSheetText = `${clean(spreadsheetName)} ${clean(tabName)}`;
  if (combinedSheetText.trim() !== '') {
    for (const course of catalog) {
      // Check exact aliases
      for (const alias of course.aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(combinedSheetText) || combinedSheetText.includes(alias)) {
          return {
            courseName: course.name,
            courseCode: course.code,
            confidence: 'HIGH',
            matchReason: `Spreadsheet name matched alias: "${alias}" in "${spreadsheetName}"`
          };
        }
      }
    }
  }

  // 3. Campaign & Ad Name Signals (Medium confidence)
  const campaignAdText = `${clean(campaignName)} ${clean(adName)}`;
  if (campaignAdText.trim() !== '') {
    for (const course of catalog) {
      for (const alias of course.aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(campaignAdText)) {
          return {
            courseName: course.name,
            courseCode: course.code,
            confidence: 'HIGH',
            matchReason: `Campaign/Ad name matched: "${alias}" in "${campaignName || adName}"`
          };
        }
      }
    }
  }

  // 4. Keyword Fallback
  for (const course of catalog) {
    for (const kw of course.keywords) {
      const allText = `${combinedSheetText} ${campaignAdText}`;
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(allText)) {
        return {
          courseName: course.name,
          courseCode: course.code,
          confidence: 'MEDIUM',
          matchReason: `Keyword matched: "${kw}"`
        };
      }
    }
  }

  // 5. Ambiguous / Unknown -> NEEDS_MAPPING
  return {
    courseName: null,
    courseCode: null,
    confidence: 'LOW',
    matchReason: 'No confident course mapping found. Marked for manual admin mapping.'
  };
}
