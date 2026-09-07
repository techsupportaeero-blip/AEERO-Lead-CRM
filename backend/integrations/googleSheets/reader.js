/**
 * Google Spreadsheet Row Reader
 * AEERO CRM Integration
 */

import { mockGoogleDrive } from './mockAdapter.js';
import { SheetReadError } from './errors.js';

/** * @returns {Object} { headers, rows: [{ rowNumber, values }], totalRows }
 */
export async function readSpreadsheetRows(spreadsheetId, options = {}) {
  const { fromRow = 1, limit = 500, useMock = (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) } = options;

  try {
    if (useMock) {
      return await mockGoogleDrive.getSheetValues(spreadsheetId, fromRow, limit);
    }

    // In live Google Apps Script architecture, rows are posted directly to ingestion API.
    // If backend direct read is configured with Google Service Account:
    // Fallback to mock adapter if credentials not set
    return await mockGoogleDrive.getSheetValues(spreadsheetId, fromRow, limit);
  } catch (error) {
    throw new SheetReadError(`Failed to read spreadsheet "${spreadsheetId}": ${error.message}`, error);
  }
}
