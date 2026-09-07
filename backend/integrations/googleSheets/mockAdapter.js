/**
 * Mock Google Drive & Google Sheets Simulator Adapter
 * Allows comprehensive offline / local testing without live Google credentials
 * AEERO CRM Integration
 */

export class MockGoogleDriveAdapter {
  constructor() {
    this.folderId = 'mock_drive_folder_aeero_leads_2026';
    this.folderName = 'AEERO LEADS';
    this.spreadsheets = new Map();
    this.initDefaultCourseSheets();
  }

  initDefaultCourseSheets() {
    // 1. CPL Leads (Standard Meta Ads format)
    this.addMockSheet('sheet_cpl_001', 'CPL Leads', [
      ['Meta Lead ID', 'Full Name', 'Phone Number', 'Email Address', 'Campaign Name', 'Ad Set Name', 'Ad Name', 'City', 'Created Time'],
      ['meta_cpl_101', 'Aarav Mehta', '+91 98111 22334', 'aarav.cpl@gmail.com', 'CPL Pilot Admission 2026', 'Delhi NCR Aspirants', 'Flight Simulator Video Ad', 'Delhi', '2026-08-20T10:30:00Z'],
      ['meta_cpl_102', 'Rohan Verma', '9822233445', 'rohan.pilot@yahoo.com', 'CPL Pilot Admission 2026', 'Mumbai Aviation Youth', 'Cockpit View Carousel', 'Mumbai', '2026-08-21T11:15:00Z'],
      ['meta_cpl_103', 'Kabir Singh', '+91 98333 44556', 'kabir.singh@gmail.com', 'CPL Pilot Admission 2026', 'Punjab Flying Club', 'DGCA Ground Class Ad', 'Chandigarh', '2026-08-22T09:00:00Z']
    ]);

    // 2. PPL Leads
    this.addMockSheet('sheet_ppl_002', 'PPL Private Pilot Leads', [
      ['lead_id', 'Student Name', 'Contact Number', 'Email', 'Campaign', 'City', 'State', 'Date'],
      ['meta_ppl_201', 'Vikramaditya Roy', '+91 98444 55667', 'vikram.ppl@outlook.com', 'PPL Weekend Flying 2026', 'Bengaluru', 'Karnataka', '2026-08-18T14:20:00Z'],
      ['meta_ppl_202', 'Sameer Nair', '9855566778', 'sameer.nair@gmail.com', 'PPL Hobby Pilots', 'Kochi', 'Kerala', '2026-08-19T16:45:00Z']
    ]);

    // 3. Cabin Crew Leads
    this.addMockSheet('sheet_cabin_003', 'Cabin Crew Leads', [
      ['FB Lead ID', 'Customer Name', 'Mobile Number', 'Email Address', 'Campaign Name', 'City', 'Age', 'Timestamp'],
      ['meta_cc_301', 'Ananya Sharma', '+91 98666 77889', 'ananya.cc@gmail.com', 'Cabin Crew Glamour Batch', 'Jaipur', '21', '2026-08-22T12:00:00Z'],
      ['meta_cc_302', 'Pooja Hegde', '+91 98777 88990', 'pooja.hegde@hotmail.com', 'Cabin Crew International 2026', 'Pune', '22', '2026-08-23T15:30:00Z'],
      ['meta_cc_303', 'Rhea Chakraborty', '9888899001', 'rhea.crew@gmail.com', 'Ground Staff Training', 'Kolkata', '20', '2026-08-24T08:10:00Z']
    ]);

    // 4. AME Aircraft Maintenance Engineering Leads
    this.addMockSheet('sheet_ame_004', 'AME Aircraft Maintenance Leads', [
      ['lead_id', 'Candidate Name', 'Mobile', 'Email', 'Qualification', 'City', 'Campaign', 'Created Date'],
      ['meta_ame_401', 'Aditya Deshmukh', '+91 98999 00112', 'aditya.ame@gmail.com', '12th PCM 85%', 'Nagpur', 'DGCA AME Licensing', '2026-08-20T17:00:00Z'],
      ['meta_ame_402', 'Nikhil Joshi', '9900011223', 'nikhil.ame@rediffmail.com', 'Diploma Mechanical', 'Nashik', 'Aero Maintenance 2026', '2026-08-21T18:25:00Z']
    ]);

    // 5. Industrial Safety Leads
    this.addMockSheet('sheet_safety_005', 'Industrial Safety Diploma Leads', [
      ['Meta Lead ID', 'Full Name', 'Contact', 'Email', 'City', 'Campaign Name', 'Preferred Mode', 'Submission Time'],
      ['meta_saf_501', 'Manish Gupta', '+91 99111 22334', 'manish.safety@gmail.com', 'Kanpur', 'Industrial Safety Govt Approved', 'Offline', '2026-08-19T09:40:00Z'],
      ['meta_saf_502', 'Suresh Reddy', '9922233445', 'suresh.fire@yahoo.com', 'Hyderabad', 'Safety Officer Batch', 'Offline', '2026-08-20T13:10:00Z']
    ]);

    // 6. Sub Fire Officer Leads
    this.addMockSheet('sheet_fire_006', 'Sub Fire Officer Leads', [
      ['id', 'Name', 'Phone', 'Email', 'City', 'Campaign', 'Date Created'],
      ['meta_fire_601', 'Deepak Chauhan', '+91 99333 44556', 'deepak.fire@gmail.com', 'Indore', 'Sub Fire Officer Recruitment 2026', '2026-08-21T10:05:00Z']
    ]);

    // 7. Health Sanitary Inspector Leads
    this.addMockSheet('sheet_sanitary_007', 'Health Sanitary Inspector Leads', [
      ['Meta Lead ID', 'Student Name', 'Mobile Number', 'Email ID', 'City', 'Campaign Name', 'Date'],
      ['meta_san_701', 'Priyanka Ghosh', '+91 99444 55667', 'priyanka.sanitary@gmail.com', 'Kolkata', 'Sanitary Inspector Diploma', '2026-08-22T14:15:00Z'],
      ['meta_san_702', 'Amit Biswas', '9955566778', 'amit.health@gmail.com', 'Siliguri', 'Municipal Health Inspector', '2026-08-23T11:50:00Z']
    ]);

    // 8. Airport Management Leads
    this.addMockSheet('sheet_airport_008', 'Airport Management Leads', [
      ['lead_id', 'Full Name', 'Phone', 'Email', 'City', 'Campaign Name', 'Created Time'],
      ['meta_air_801', 'Sneha Kapoor', '+91 99666 77889', 'sneha.airport@gmail.com', 'Delhi', 'Airport Ground Operations', '2026-08-20T16:00:00Z']
    ]);

    // 9. Aviation Hospitality & Cabin Crew Leads
    this.addMockSheet('sheet_hosp_009', 'Aviation Hospitality Leads', [
      ['Meta Lead ID', 'Name', 'Mobile', 'Email', 'City', 'Campaign', 'Date'],
      ['meta_hosp_901', 'Tanvi Mathur', '+91 99777 88990', 'tanvi.hosp@gmail.com', 'Lucknow', 'Aviation Hospitality 2026', '2026-08-21T09:30:00Z']
    ]);

    // 10. Delhi Aviation Safety Batch Leads
    this.addMockSheet('sheet_delhi_010', 'Industrial Safety Delhi Leads', [
      ['id', 'Candidate Name', 'Phone Number', 'Email Address', 'Campaign', 'City', 'Date'],
      ['meta_del_1001', 'Rajesh Koli', '+91 99888 99001', 'rajesh.safety@gmail.com', 'Delhi Industrial Fire Safety', 'New Delhi', '2026-08-22T11:00:00Z']
    ]);

    // 11. Ambiguous/Unmapped Sheet (Triggers NEEDS_MAPPING)
    this.addMockSheet('sheet_general_011', 'General Student Inquiries', [
      ['Lead ID', 'Student Name', 'Mobile', 'Email', 'City', 'Campaign', 'Date'],
      ['meta_gen_1101', 'Harsh Vardhan', '+91 99999 11223', 'harsh.v@gmail.com', 'Patna', 'Special Discount Inquiry', '2026-08-23T15:00:00Z']
    ]);

    // 12. Corrupted/Error Sheet (To test error isolation)
    this.addMockSheet('sheet_error_012', 'CPL Corrupted Test Sheet', null, true);
  }

  addMockSheet(spreadsheetId, spreadsheetName, rows = [], isCorrupted = false) {
    this.spreadsheets.set(spreadsheetId, {
      spreadsheetId,
      spreadsheetName,
      folderId: this.folderId,
      modifiedTime: new Date().toISOString(),
      rows: rows || [],
      isCorrupted: Boolean(isCorrupted)
    });
  }

  // --- Mock Drive API Methods ---
  async listFilesInFolder(folderId) {
    const files = [];
    for (const sheet of this.spreadsheets.values()) {
      files.push({
        id: sheet.spreadsheetId,
        name: sheet.spreadsheetName,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        modifiedTime: sheet.modifiedTime
      });
    }
    return files;
  }

  // --- Mock Sheets API Methods ---
  async getSheetValues(spreadsheetId, fromRow = 1, limit = 500) {
    const sheet = this.spreadsheets.get(spreadsheetId);
    if (!sheet) {
      throw new Error(`Spreadsheet "${spreadsheetId}" not found in mock Google Drive.`);
    }
    if (sheet.isCorrupted) {
      throw new Error(`Simulated Google API read error: Spreadsheet "${sheet.spreadsheetName}" is inaccessible.`);
    }

    const allRows = sheet.rows || [];
    if (allRows.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const headers = allRows[0] || [];
    const dataRowsWithIndex = [];

    // fromRow is 1-indexed (row 1 is headers, row 2 is first data row)
    const startIndex = Math.max(1, fromRow - 1);

    for (let i = startIndex; i < allRows.length; i++) {
      if (i === 0) continue; // Skip header row in data
      dataRowsWithIndex.push({
        rowNumber: i + 1, // 1-indexed spreadsheet row number
        values: allRows[i]
      });
    }

    return {
      headers,
      rows: dataRowsWithIndex,
      totalRows: allRows.length
    };
  }

  /**
   * Helper to append a new row into an existing sheet (for incremental testing)
   */
  appendRow(spreadsheetId, rowValues) {
    const sheet = this.spreadsheets.get(spreadsheetId);
    if (!sheet) throw new Error(`Sheet ${spreadsheetId} not found`);
    sheet.rows.push(rowValues);
    sheet.modifiedTime = new Date().toISOString();
    return sheet.rows.length;
  }
}

// Singleton instance for in-process test runs
export const mockGoogleDrive = new MockGoogleDriveAdapter();
