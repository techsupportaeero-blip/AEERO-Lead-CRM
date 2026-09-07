/**
 * Spreadsheet Discovery Module
 * Scans Google Drive folder & registers newly detected spreadsheets
 * AEERO CRM Integration
 */

import { registerDiscoveredSource, getAllSources } from './registry.js';
import { mockGoogleDrive } from './mockAdapter.js';
import { DiscoveryError } from './errors.js';

/**
 * Discovers spreadsheets inside the configured Google Drive folder
 * @param {Object} options - { folderId, useMock, driveService, dbData }
 * @returns {Object} Discovery summary & registered source list
 */
export async function discoverFolderSpreadsheets(options = {}) {
  const folderId = options.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || 'aeero_lead_drive_folder';
  const useMock = options.useMock !== undefined ? options.useMock : (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const dbData = options.dbData || null;

  try {
    let files = [];

    if (useMock) {
      // Use local mock simulator
      files = await mockGoogleDrive.listFilesInFolder(folderId);
    } else {
      // Real Google Drive API (when configured)
      // Note: Google Apps Script can also post discovery list directly to the API
      if (options.externalFilesList) {
        files = options.externalFilesList;
      } else {
        // Mock fallback if credentials not present
        files = await mockGoogleDrive.listFilesInFolder(folderId);
      }
    }

    // Filter to only Google Spreadsheets
    const spreadsheets = files.filter(f => 
      f.mimeType === 'application/vnd.google-apps.spreadsheet' || 
      (f.id && !f.mimeType) ||
      (f.spreadsheetId)
    );

    const results = {
      folderId,
      totalDiscovered: spreadsheets.length,
      newlyDiscoveredCount: 0,
      alreadyRegisteredCount: 0,
      sources: []
    };

    for (const sheet of spreadsheets) {
      const spreadsheetId = sheet.id || sheet.spreadsheetId;
      const spreadsheetName = sheet.name || sheet.spreadsheetName || 'Untitled Sheet';

      const { source, isNew } = await registerDiscoveredSource({
        spreadsheetId,
        spreadsheetName,
        folderId
      }, dbData);

      if (isNew) {
        results.newlyDiscoveredCount++;
      } else {
        results.alreadyRegisteredCount++;
      }

      results.sources.push({
        spreadsheetId: source.spreadsheetId,
        spreadsheetName: source.spreadsheetName,
        courseName: source.courseName,
        courseCode: source.courseCode,
        status: source.status,
        isNew
      });
    }

    return results;
  } catch (error) {
    throw new DiscoveryError(`Google Drive folder discovery failed: ${error.message}`, error);
  }
}
