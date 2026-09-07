/**
 * Google Sheets Lead Bridge - Custom Error Classes
 * AEERO CRM Integration
 */

export class GoogleSheetsError extends Error {
  constructor(message, code = 'GOOGLE_SHEETS_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class GoogleAuthError extends GoogleSheetsError {
  constructor(message = 'Invalid or missing Google integration authentication / secret', details = null) {
    super(message, 'GOOGLE_AUTH_ERROR', details);
  }
}

export class DiscoveryError extends GoogleSheetsError {
  constructor(message = 'Failed to discover spreadsheets in Google Drive folder', details = null) {
    super(message, 'DISCOVERY_ERROR', details);
  }
}

export class SheetReadError extends GoogleSheetsError {
  constructor(message = 'Failed to read rows from Google Spreadsheet', details = null) {
    super(message, 'SHEET_READ_ERROR', details);
  }
}

export class MappingError extends GoogleSheetsError {
  constructor(message = 'Failed to map spreadsheet row to AEERO Lead schema', details = null) {
    super(message, 'MAPPING_ERROR', details);
  }
}

export class DuplicateLeadError extends GoogleSheetsError {
  constructor(message = 'Lead already exists in AEERO CRM database', details = null) {
    super(message, 'DUPLICATE_LEAD_ERROR', details);
  }
}

export class SyncError extends GoogleSheetsError {
  constructor(message = 'Synchronization error occurred for spreadsheet', details = null) {
    super(message, 'SYNC_ERROR', details);
  }
}

export class ValidationError extends GoogleSheetsError {
  constructor(message = 'Validation failed for lead row data', details = null) {
    super(message, 'VALIDATION_ERROR', details);
  }
}
