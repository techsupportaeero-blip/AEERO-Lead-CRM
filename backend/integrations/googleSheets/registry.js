/**
 * Google Sheet Source Registry Layer
 * Supports both Prisma ORM and Standalone Persistent JSON Store
 * AEERO CRM Integration
 */

import { resolveCourse } from './courseMatcher.js';

let prismaClient = null;

// Dynamically attempt to load Prisma Client if available
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

// In-memory fallback registry store for standalone mode
const inMemorySources = new Map();

/**
 * Retrieve all registered Google Sheet sources
 */
export async function getAllSources(dbData = null) {
  if (dbData && Array.isArray(dbData.googleSheetSources)) {
    return dbData.googleSheetSources;
  }

  const prisma = await getPrisma();
  if (prisma && prisma.googleSheetSource) {
    try {
      return await prisma.googleSheetSource.findMany({
        orderBy: { createdAt: 'asc' }
      });
    } catch (e) {
      // Fallback to in-memory
    }
  }

  return Array.from(inMemorySources.values());
}

/**
 * Retrieve a specific source by spreadsheetId
 */
export async function getSourceBySpreadsheetId(spreadsheetId, dbData = null) {
  if (dbData && Array.isArray(dbData.googleSheetSources)) {
    return dbData.googleSheetSources.find(s => s.spreadsheetId === spreadsheetId) || null;
  }

  const prisma = await getPrisma();
  if (prisma && prisma.googleSheetSource) {
    try {
      return await prisma.googleSheetSource.findUnique({
        where: { spreadsheetId }
      });
    } catch (e) {
      // Fallback
    }
  }

  return inMemorySources.get(spreadsheetId) || null;
}

/**
 * Register a newly discovered Google Sheet or update existing
 */
export async function registerDiscoveredSource(discoveredData, dbData = null) {
  const { spreadsheetId, spreadsheetName, folderId } = discoveredData;

  // 1. Resolve Course Mapping automatically
  const courseMatch = resolveCourse({ spreadsheetName });
  const status = courseMatch.confidence === 'HIGH' ? 'ACTIVE' : 'NEEDS_MAPPING';

  const sourceRecord = {
    spreadsheetId,
    spreadsheetName,
    folderId: folderId || null,
    courseCode: courseMatch.courseCode || null,
    courseName: courseMatch.courseName || null,
    source: 'Meta Ads',
    status: status,
    lastProcessedRow: 1, // Row 1 is header
    totalRowsProcessed: 0,
    totalLeadsImported: 0,
    totalDuplicatesSkipped: 0,
    totalErrors: 0,
    lastScannedAt: new Date().toISOString(),
    lastSuccessfulSyncAt: null,
    lastErrorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 2. Save in Standalone dbData if provided
  if (dbData) {
    if (!Array.isArray(dbData.googleSheetSources)) {
      dbData.googleSheetSources = [];
    }
    const existingIdx = dbData.googleSheetSources.findIndex(s => s.spreadsheetId === spreadsheetId);
    if (existingIdx !== -1) {
      dbData.googleSheetSources[existingIdx] = {
        ...dbData.googleSheetSources[existingIdx],
        spreadsheetName,
        lastScannedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { source: dbData.googleSheetSources[existingIdx], isNew: false };
    } else {
      sourceRecord.id = dbData.googleSheetSources.length + 1;
      dbData.googleSheetSources.push(sourceRecord);
      return { source: sourceRecord, isNew: true };
    }
  }

  // 3. Save in Prisma if available
  const prisma = await getPrisma();
  if (prisma && prisma.googleSheetSource) {
    try {
      const existing = await prisma.googleSheetSource.findUnique({
        where: { spreadsheetId }
      });

      if (existing) {
        const updated = await prisma.googleSheetSource.update({
          where: { spreadsheetId },
          data: {
            spreadsheetName,
            lastScannedAt: new Date(),
            updatedAt: new Date()
          }
        });
        return { source: updated, isNew: false };
      } else {
        const created = await prisma.googleSheetSource.create({
          data: {
            spreadsheetId: sourceRecord.spreadsheetId,
            spreadsheetName: sourceRecord.spreadsheetName,
            folderId: sourceRecord.folderId,
            courseCode: sourceRecord.courseCode,
            courseName: sourceRecord.courseName,
            source: sourceRecord.source,
            status: sourceRecord.status,
            lastProcessedRow: sourceRecord.lastProcessedRow,
            lastScannedAt: new Date()
          }
        });
        return { source: created, isNew: true };
      }
    } catch (e) {
      // Fallback
    }
  }

  // 4. In-Memory fallback
  const existing = inMemorySources.get(spreadsheetId);
  if (existing) {
    existing.spreadsheetName = spreadsheetName;
    existing.lastScannedAt = new Date().toISOString();
    existing.updatedAt = new Date().toISOString();
    return { source: existing, isNew: false };
  } else {
    sourceRecord.id = inMemorySources.size + 1;
    inMemorySources.set(spreadsheetId, sourceRecord);
    return { source: sourceRecord, isNew: true };
  }
}

/**
 * Update sync counters and progress for a source
 */
export async function updateSourceSyncState(spreadsheetId, updateData = {}, dbData = null) {
  const patch = {
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  if (dbData && Array.isArray(dbData.googleSheetSources)) {
    const source = dbData.googleSheetSources.find(s => s.spreadsheetId === spreadsheetId);
    if (source) {
      Object.assign(source, patch);
      return source;
    }
  }

  const prisma = await getPrisma();
  if (prisma && prisma.googleSheetSource) {
    try {
      return await prisma.googleSheetSource.update({
        where: { spreadsheetId },
        data: patch
      });
    } catch (e) {
      // Fallback
    }
  }

  const source = inMemorySources.get(spreadsheetId);
  if (source) {
    Object.assign(source, patch);
    return source;
  }
  return null;
}

/**
 * Map a spreadsheet to a specific AEERO course (Admin Action)
 */
export async function updateCourseMapping(spreadsheetId, courseData = {}, dbData = null) {
  const { courseId, courseCode, courseName } = courseData;

  const patch = {
    courseId: courseId || null,
    courseCode: courseCode || null,
    courseName: courseName || null,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString()
  };

  return updateSourceSyncState(spreadsheetId, patch, dbData);
}
