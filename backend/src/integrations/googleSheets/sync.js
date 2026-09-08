/**
 * Google Sheets Lead Sync & Ingestion Engine
 * AEERO CRM Integration
 */

import { getAllSources, getSourceBySpreadsheetId, updateSourceSyncState } from './registry.js';
import { readSpreadsheetRows } from './reader.js';
import { buildHeaderMapping, mapRowToLead, normalizeMobile, normalizeEmail } from './mapper.js';
import { generateNextLeadId } from '../../utils/generateLeadId.js';
import { discoverFolderSpreadsheets } from './discovery.js';

let prismaClient = null;
async function getPrisma() {
  if (prismaClient) return prismaClient;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prismaClient = new PrismaClient();
    return prismaClient;
  } catch (e) {
    return null;
  }
}

/**
 * Check if incoming lead is a duplicate in DB / Memory
 * Multi-tier idempotency check:
 * Tier 1: externalLeadId / Meta Lead ID
 * Tier 2: mobile + email
 * Tier 3: mobile + source within date window
 */
export async function checkLeadDuplicate(leadData, dbData = null) {
  const { externalLeadId, mobile, email, source, leadDateTime } = leadData;
  const cleanMobile = normalizeMobile(mobile);
  const cleanEmail = normalizeEmail(email);
  const cleanExternalId = externalLeadId ? String(externalLeadId).trim() : '';

  // 1. Check in Standalone dbData (Memory / JSON file store)
  if (dbData && Array.isArray(dbData.leads)) {
    const leads = dbData.leads.filter(l => !l.isArchived);

    // Tier 1: External Meta Lead ID check
    if (cleanExternalId !== '') {
      const match = leads.find(l => l.externalLeadId && String(l.externalLeadId).trim() === cleanExternalId);
      if (match) {
        return { isDuplicate: true, reason: 'Tier 1: Meta Lead ID match', existingLeadId: match.leadId };
      }
    }

    // Tier 2: Mobile + Email (or Mobile match if phone format normalized)
    if (cleanMobile && cleanEmail) {
      const match = leads.find(l => 
        (normalizeMobile(l.mobile) === cleanMobile || l.mobile === mobile) && 
        l.email && 
        l.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (match) {
        return { isDuplicate: true, reason: 'Tier 2: Mobile + Email match', existingLeadId: match.leadId };
      }
    }

    // Tier 3: Mobile + Source within 48-hour tolerance window
    if (cleanMobile && source) {
      const targetTime = new Date(leadDateTime || Date.now()).getTime();
      const match = leads.find(l => {
        if (normalizeMobile(l.mobile) !== cleanMobile || l.source !== source) return false;
        const lTime = new Date(l.leadDateTime || l.createdAt).getTime();
        const diffHours = Math.abs(targetTime - lTime) / (1000 * 60 * 60);
        return diffHours <= 48;
      });
      if (match) {
        return { isDuplicate: true, reason: 'Tier 3: Mobile + Source within 48h window match', existingLeadId: match.leadId };
      }
    }

    return { isDuplicate: false };
  }

  // 2. Check in Prisma Database
  const prisma = await getPrisma();
  if (prisma && prisma.lead) {
    try {
      // Tier 1
      if (externalLeadId && externalLeadId.trim() !== '') {
        const match = await prisma.lead.findFirst({
          where: { externalLeadId: externalLeadId.trim() }
        });
        if (match) {
          return { isDuplicate: true, reason: 'Tier 1: Meta Lead ID match', existingLeadId: match.leadId };
        }
      }

      // Tier 2
      if (mobile && email) {
        const match = await prisma.lead.findFirst({
          where: {
            mobile,
            email: { equals: email, mode: 'insensitive' }
          }
        });
        if (match) {
          return { isDuplicate: true, reason: 'Tier 2: Mobile + Email match', existingLeadId: match.leadId };
        }
      }

      // Tier 3
      if (mobile && source) {
        const match = await prisma.lead.findFirst({
          where: { mobile, source }
        });
        if (match) {
          return { isDuplicate: true, reason: 'Tier 3: Mobile + Source match', existingLeadId: match.leadId };
        }
      }
    } catch (e) {
      console.error('[Sync] Duplicate check Tier 3 query failed:', e.message);
    }
  }

  return { isDuplicate: false };
}

/**
 * Dynamically assign lead to an eligible active counselor based on course or Round-robin
 * NO HARDCODED NAMES
 */
export async function getNextCounselor(dbData = null, course = null) {
  if (course) {
    const c = course.toLowerCase();
    if (c.includes('industrial safety') || c.includes('sub fire')) return 'Ms.Indu';
    if (c.includes('fireman') || c.includes('diploma in sanitary')) return 'Ms.Ayesha';
    if (c.includes('health sanitary') || c.includes('msme')) return 'Ms.Priya';
  }

  let eligibleCounselors = [];

  // Standalone mode: Only counselors (LEAD_FINDER / COUNSELOR), NOT ADMIN
  if (dbData && Array.isArray(dbData.users)) {
    eligibleCounselors = dbData.users
      .filter(u => u.active && u.role !== 'ADMIN' && (u.role === 'LEAD_FINDER' || u.role === 'COUNSELOR'))
      .map(u => u.name);

    if (eligibleCounselors.length === 0) {
      eligibleCounselors = ['Ms.Indu', 'Ms.Ayesha', 'Ms.Priya'];
    }

    if (eligibleCounselors.length > 0) {
      const idx = (dbData.lastAssignedCounselorIndex || 0) % eligibleCounselors.length;
      dbData.lastAssignedCounselorIndex = (idx + 1) % eligibleCounselors.length;
      return eligibleCounselors[idx];
    }
  }

  // Prisma mode
  const prisma = await getPrisma();
  if (prisma && prisma.user) {
    try {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true, role: { in: ['LEAD_FINDER', 'MANAGER'] } },
        select: { name: true, role: true },
        orderBy: { id: 'asc' }
      });
      if (activeUsers.length > 0) {
        const leadCount = await prisma.lead.count();
        const assigned = activeUsers[leadCount % activeUsers.length];
        return assigned.name;
      }
    } catch (e) {
      console.error('[Sync] Counselor assignment query failed:', e.message);
    }
  }

  return 'Ms.Indu';
}

/**
 * Generate next internal sequential AEERO Lead ID (LD-XXXXXX)
 */
export async function generateLeadId(dbData = null) {
  try {
    return await generateNextLeadId();
  } catch (e) {
    return `LD-${String(Date.now()).slice(-6)}`;
  }
}

/**
 * Ingest a single normalized lead into AEERO CRM
 * Used by Google Apps Script / Ingestion API
 */
export async function ingestLeadRecord(leadPayload, options = {}, dbData = null) {
  const { isBackfill = false } = options;

  // Case-insensitive key lookup for robust fallback
  const getFuzzyVal = (aliases) => {
    for (const key of Object.keys(leadPayload)) {
      const cleanKey = key.toLowerCase().replace(/[-_.,\/\\()\[\]#?]/g, ' ').replace(/\s+/g, ' ').trim();
      if (aliases.includes(cleanKey)) return leadPayload[key];
    }
    return null;
  };

  // Fallback for mobile and email if missing
  if (!leadPayload.mobile) {
    leadPayload.mobile = getFuzzyVal(['mobile', 'phone', 'phone number', 'contact number', 'whatsapp', 'whatsapp number', 'contact']) || '';
  }
  if (!leadPayload.email) {
    leadPayload.email = getFuzzyVal(['email', 'email address', 'e mail', 'mail', 'email id']) || '';
  }
  if (!leadPayload.name || leadPayload.name === 'Meta Ads Lead') {
    leadPayload.name = getFuzzyVal(['name', 'full name', 'student name', 'customer name', 'candidate name', 'client name']) || 'Meta Ads Lead';
  }

  // Normalize formats
  leadPayload.mobile = normalizeMobile(leadPayload.mobile);
  if (leadPayload.email) leadPayload.email = normalizeEmail(leadPayload.email);

  // 1. Validation: Must have at least a phone number or email
  if (!leadPayload.mobile && !leadPayload.email) {
    return {
      success: false,
      status: 'invalid',
      reason: 'Lead must have at least a mobile number or email address'
    };
  }

  // 2. Duplicate Check
  const dupCheck = await checkLeadDuplicate(leadPayload, dbData);
  
  // 3. If duplicate found → UPDATE existing lead
  if (dupCheck.isDuplicate) {
    const prisma = await getPrisma();
    if (prisma && prisma.lead) {
      try {
        const existing = await prisma.lead.findFirst({
          where: { leadId: dupCheck.existingLeadId }
        });
        if (existing) {
          // Build selective update — only overwrite non-null incoming fields
          const updateData = {};
          if (leadPayload.name && leadPayload.name !== 'Meta Ads Lead') updateData.name = leadPayload.name;
          if (leadPayload.email) updateData.email = leadPayload.email;
          if (leadPayload.qualification) updateData.qualification = leadPayload.qualification;
          if (leadPayload.interestedCourse) updateData.interestedCourse = leadPayload.interestedCourse;
          if (leadPayload.requirement) updateData.requirement = leadPayload.requirement;
          if (leadPayload.remarks) updateData.remarks = leadPayload.remarks;
          if (leadPayload.campaign) updateData.campaign = leadPayload.campaign;
          if (leadPayload.campaignId) updateData.campaignId = leadPayload.campaignId;
          if (leadPayload.adSet) updateData.adSet = leadPayload.adSet;
          if (leadPayload.adSetId) updateData.adSetId = leadPayload.adSetId;
          if (leadPayload.ad) updateData.ad = leadPayload.ad;
          if (leadPayload.adId) updateData.adId = leadPayload.adId;
          if (leadPayload.formId) updateData.formId = leadPayload.formId;
          if (leadPayload.platform) updateData.platform = leadPayload.platform;
          if (leadPayload.source) updateData.source = leadPayload.source;
          if (leadPayload.sourceRowNumber) updateData.sourceRowNumber = leadPayload.sourceRowNumber;
          if (leadPayload.sourceSpreadsheetId) updateData.sourceSpreadsheetId = leadPayload.sourceSpreadsheetId;
          if (leadPayload.sourceSpreadsheetName) updateData.sourceSpreadsheetName = leadPayload.sourceSpreadsheetName;
          if (leadPayload.sourceSheetName) updateData.sourceSheetName = leadPayload.sourceSheetName;
          if (leadPayload.externalLeadId) updateData.externalLeadId = leadPayload.externalLeadId;
          // Status: only update if sheet provides a meaningful status
          if (leadPayload.status) {
            const upper = String(leadPayload.status).toUpperCase().replace(/[-\s\/]/g, '_');
            const validStatuses = ['NEW', 'NO_ANSWER', 'GIVEN_DETAILS', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'NOT_INTERESTED', 'INVALID'];
            if (validStatuses.includes(upper)) {
              updateData.status = upper;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.lead.update({
              where: { id: existing.id },
              data: updateData
            });
          }

          return {
            success: true,
            action: 'updated',
            status: 'updated',
            leadId: existing.leadId,
            reason: dupCheck.reason
          };
        }
      } catch (e) {
        return {
          success: false,
          status: 'error',
          reason: `Update failed: ${e.message}`
        };
      }
    }

    // Fallback for standalone/memory mode: still report duplicate
    return {
      success: false,
      status: 'duplicate',
      reason: dupCheck.reason,
      existingLeadId: dupCheck.existingLeadId
    };
  }

  // 4. Dynamic Counselor Assignment based on Course
  const assignedCounselor = leadPayload.ownerId || await getNextCounselor(dbData, leadPayload.interestedCourse || leadPayload.qualification);

  // 5. Generate Internal CRM Lead ID
  const leadId = await generateLeadId(dbData);
  const now = new Date().toISOString();

  // Normalize status from sheet
  let normalizedStatus = 'NEW';
  if (leadPayload.status) {
    const upper = String(leadPayload.status).toUpperCase().replace(/[-\s\/]/g, '_');
    const validStatuses = ['NEW', 'NO_ANSWER', 'GIVEN_DETAILS', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'NOT_INTERESTED', 'INVALID'];
    if (validStatuses.includes(upper)) {
      normalizedStatus = upper;
    } else if (upper.includes('CREATED') || upper === 'CREATED') {
      normalizedStatus = 'NEW';
    }
  }

  const finalLead = {
    ...leadPayload,
    leadId,
    ownerId: assignedCounselor,
    status: normalizedStatus,
    priority: 'MEDIUM',
    tags: JSON.stringify(['Google Sheets', 'Meta Ads', leadPayload.interestedCourse || 'General'].filter(Boolean)),
    isArchived: false,
    createdAt: now,
    updatedAt: now
  };

  // 6. Persist to Standalone Store
  if (dbData && Array.isArray(dbData.leads)) {
    finalLead.id = dbData.leads.length + 1;
    dbData.leads.push(finalLead);

    // Create Activity Log
    if (!Array.isArray(dbData.activities)) dbData.activities = [];
    dbData.activities.push({
      id: dbData.activities.length + 1,
      leadId: finalLead.leadId,
      type: 'LEAD_CREATED',
      activityType: 'Google Sheets Ingestion',
      subject: `Lead Ingested from ${leadPayload.sourceSpreadsheetName || 'Google Sheets'}`,
      description: `Campaign: ${leadPayload.campaign || 'N/A'}, Ad: ${leadPayload.ad || 'N/A'}, Row: ${leadPayload.sourceRowNumber || 'N/A'}. Auto-assigned to ${assignedCounselor}.`,
      outcome: 'Auto-Assigned',
      createdBy: 'Google Sheets Bridge',
      createdAt: now
    });

    if (global.io) {
      global.io.emit('newLead', finalLead);
    }

    return {
      success: true,
      action: 'created',
      status: 'created',
      leadId: finalLead.leadId,
      assignedTo: assignedCounselor,
      lead: finalLead
    };
  }

  // 7. Persist to Prisma
  const prisma = await getPrisma();
  if (prisma && prisma.lead) {
    try {
      const created = await prisma.lead.create({
        data: {
          leadId: finalLead.leadId,
          name: finalLead.name,
          mobile: finalLead.mobile,
          whatsappNumber: finalLead.whatsappNumber,
          email: finalLead.email,
          city: finalLead.city,
          state: finalLead.state,
          age: finalLead.age,
          qualification: finalLead.qualification,
          interestedCourse: finalLead.interestedCourse,
          preferredStudyMode: finalLead.preferredStudyMode,
          requirement: finalLead.requirement,
          remarks: finalLead.remarks,
          ownerId: finalLead.ownerId,
          status: normalizedStatus,
          priority: 'MEDIUM',
          source: finalLead.source,
          platform: finalLead.platform,
          campaign: finalLead.campaign,
          campaignId: finalLead.campaignId,
          adSet: finalLead.adSet,
          adSetId: finalLead.adSetId,
          ad: finalLead.ad,
          adId: finalLead.adId,
          formId: finalLead.formId,
          utmSource: finalLead.utmSource,
          utmMedium: finalLead.utmMedium,
          utmCampaign: finalLead.utmCampaign,
          utmContent: finalLead.utmContent,
          utmTerm: finalLead.utmTerm,
          externalLeadId: finalLead.externalLeadId,
          externalSource: finalLead.externalSource,
          sourceSpreadsheetId: finalLead.sourceSpreadsheetId,
          sourceSpreadsheetName: finalLead.sourceSpreadsheetName,
          sourceSheetName: finalLead.sourceSheetName || null,
          sourceRowNumber: finalLead.sourceRowNumber,
          leadDateTime: new Date(finalLead.leadDateTime || now),
          createdBy: 'Google Sheets Bridge'
        }
      });

      if (global.io) {
        global.io.emit('newLead', created);
      }

      return {
        success: true,
        action: 'created',
        status: 'created',
        leadId: created.leadId,
        assignedTo: assignedCounselor,
        lead: created
      };
    } catch (e) {
      return {
        success: false,
        status: 'error',
        reason: e.message
      };
    }
  }

  if (global.io) {
    global.io.emit('newLead', finalLead);
  }

  return {
    success: true,
    action: 'created',
    status: 'created',
    leadId: finalLead.leadId,
    assignedTo: assignedCounselor,
    lead: finalLead
  };
}

/**
 * Sync a single Google Spreadsheet (Incremental or Full Backfill)
 */
export async function syncSingleSpreadsheet(spreadsheetId, options = {}, dbData = null) {
  const { isBackfill = false, useMock } = options;
  const source = await getSourceBySpreadsheetId(spreadsheetId, dbData);

  if (!source) {
    return {
      spreadsheetId,
      success: false,
      error: `Spreadsheet ID "${spreadsheetId}" is not registered in GoogleSheetSource registry.`
    };
  }

  // Check if unmapped
  if (source.status === 'NEEDS_MAPPING') {
    return {
      spreadsheetId,
      spreadsheetName: source.spreadsheetName,
      status: 'NEEDS_MAPPING',
      success: false,
      message: `Spreadsheet "${source.spreadsheetName}" requires admin course mapping before syncing.`
    };
  }

  // Determine starting row: Backfill starts from row 2 (header is 1). Incremental starts from lastProcessedRow + 1.
  const fromRow = isBackfill ? 2 : Math.max(2, (source.lastProcessedRow || 1) + 1);

  const sheetResult = {
    spreadsheetId: source.spreadsheetId,
    spreadsheetName: source.spreadsheetName,
    courseName: source.courseName,
    courseCode: source.courseCode,
    fromRow,
    rowsScanned: 0,
    leadsImported: 0,
    duplicatesSkipped: 0,
    invalidRows: 0,
    errors: [],
    highestProcessedRow: source.lastProcessedRow || 1
  };

  try {
    const { headers, rows, totalRows } = await readSpreadsheetRows(spreadsheetId, { fromRow, useMock });
    const headerMapping = buildHeaderMapping(headers);

    sheetResult.rowsScanned = rows.length;

    for (const rowItem of rows) {
      const rowNumber = rowItem.rowNumber;
      const rowValues = rowItem.values;

      try {
        const leadPayload = mapRowToLead(rowValues, headerMapping, {
          spreadsheetId: source.spreadsheetId,
          spreadsheetName: source.spreadsheetName,
          rowNumber,
          defaultCourseName: source.courseName,
          defaultCourseCode: source.courseCode
        });

        const ingestResult = await ingestLeadRecord(leadPayload, { isBackfill }, dbData);

        if (ingestResult.status === 'created') {
          sheetResult.leadsImported++;
        } else if (ingestResult.status === 'duplicate') {
          sheetResult.duplicatesSkipped++;
        } else if (ingestResult.status === 'invalid') {
          sheetResult.invalidRows++;
        } else {
          sheetResult.errors.push({ rowNumber, error: ingestResult.reason });
        }

        // Advance row counter
        sheetResult.highestProcessedRow = Math.max(sheetResult.highestProcessedRow, rowNumber);
      } catch (rowErr) {
        sheetResult.errors.push({ rowNumber, error: rowErr.message });
      }
    }

    // Update Registry Sync Progress
    await updateSourceSyncState(spreadsheetId, {
      lastProcessedRow: sheetResult.highestProcessedRow,
      totalRowsProcessed: (source.totalRowsProcessed || 0) + sheetResult.rowsScanned,
      totalLeadsImported: (source.totalLeadsImported || 0) + sheetResult.leadsImported,
      totalDuplicatesSkipped: (source.totalDuplicatesSkipped || 0) + sheetResult.duplicatesSkipped,
      totalErrors: (source.totalErrors || 0) + sheetResult.errors.length,
      lastSuccessfulSyncAt: new Date().toISOString(),
      lastErrorMessage: null,
      status: 'ACTIVE'
    }, dbData);

    sheetResult.success = true;
    return sheetResult;
  } catch (error) {
    // Error Isolation: record error on this sheet without crashing the entire sync
    await updateSourceSyncState(spreadsheetId, {
      lastErrorMessage: error.message,
      status: 'ERROR'
    }, dbData);

    sheetResult.success = false;
    sheetResult.error = error.message;
    return sheetResult;
  }
}

/**
 * Full Pipeline: Discover folder + Sync all active spreadsheets
 * @param {Object} options - { isBackfill, folderId, useMock }
 */
export async function syncAllFolderSpreadsheets(options = {}, dbData = null) {
  const { isBackfill = false, folderId, useMock } = options;

  // 1. Run Discovery to register any new/unregistered sheets in the folder
  const discoveryResult = await discoverFolderSpreadsheets({ folderId, useMock, dbData });

  // 2. Get all registered sources
  const allSources = await getAllSources(dbData);

  const aggregateSummary = {
    folderId: discoveryResult.folderId,
    totalSpreadsheetsDiscovered: discoveryResult.totalDiscovered,
    newlyDiscoveredCount: discoveryResult.newlyDiscoveredCount,
    totalSpreadsheetsInRegistry: allSources.length,
    activeSheetsSyncedCount: 0,
    needsMappingCount: 0,
    errorSheetsCount: 0,
    totalRowsScanned: 0,
    totalLeadsImported: 0,
    totalDuplicatesSkipped: 0,
    totalInvalidRows: 0,
    totalRowErrors: 0,
    sheetResults: [],
    syncTimestamp: new Date().toISOString()
  };

  // 3. Process each spreadsheet with error isolation
  for (const source of allSources) {
    if (source.status === 'PAUSED') continue;

    if (source.status === 'NEEDS_MAPPING') {
      aggregateSummary.needsMappingCount++;
      aggregateSummary.sheetResults.push({
        spreadsheetId: source.spreadsheetId,
        spreadsheetName: source.spreadsheetName,
        status: 'NEEDS_MAPPING',
        message: 'Awaiting admin course mapping'
      });
      continue;
    }

    // Sync sheet
    const result = await syncSingleSpreadsheet(source.spreadsheetId, { isBackfill, useMock }, dbData);
    aggregateSummary.sheetResults.push(result);

    if (result.success) {
      aggregateSummary.activeSheetsSyncedCount++;
      aggregateSummary.totalRowsScanned += (result.rowsScanned || 0);
      aggregateSummary.totalLeadsImported += (result.leadsImported || 0);
      aggregateSummary.totalDuplicatesSkipped += (result.duplicatesSkipped || 0);
      aggregateSummary.totalInvalidRows += (result.invalidRows || 0);
      aggregateSummary.totalRowErrors += (result.errors?.length || 0);
    } else {
      aggregateSummary.errorSheetsCount++;
    }
  }

  return aggregateSummary;
}
