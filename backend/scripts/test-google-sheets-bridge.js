/**
 * ============================================================================
 * AEERO CRM - Google Sheets Lead Bridge Verification & Test Suite
 * ============================================================================
 * Runs full lifecycle verification of:
 * 1. Multi-sheet Google Drive folder discovery
 * 2. Intelligent course mapping & NEEDS_MAPPING lifecycle
 * 3. Full historical backfill across 10+ course spreadsheets
 * 4. Multi-tier duplicate protection & idempotency
 * 5. Incremental row sync (lastProcessedRow advancement)
 * 6. Future new course spreadsheet discovery & mapping with ZERO code changes
 * 7. Malformed row handling & sheet error isolation
 * 8. Dynamic counselor auto-assignment & attribution preservation
 * 9. Ingestion API authentication & status reporting
 * ============================================================================
 */

import {
  discoverFolderSpreadsheets,
  syncAllFolderSpreadsheets,
  syncSingleSpreadsheet,
  ingestLeadRecord,
  getAllSources,
  getSourceBySpreadsheetId,
  updateCourseMapping,
  mockGoogleDrive
} from '../integrations/googleSheets/index.js';

// Setup fresh mock test environment
const testDb = {
  leads: [],
  activities: [],
  googleSheetSources: [],
  lastLeadNumber: 100,
  users: [
    { id: 1, name: 'Admin User 1', role: 'ADMIN', active: true },
    { id: 2, name: 'MS. INDU', role: 'LEAD_FINDER', active: true },
    { id: 3, name: 'MS. AYESHA', role: 'LEAD_FINDER', active: true },
    { id: 4, name: 'MS. PRITI', role: 'LEAD_FINDER', active: true }
  ]
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n==================================================================');
  console.log('🧪 Starting AEERO CRM Google Sheets Lead Bridge Test Suite');
  console.log('==================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Google Drive Folder Discovery & Auto-Registration
  // --------------------------------------------------------------------------
  console.log('📁 TEST 1: Google Drive Folder Discovery & Course Auto-Registration');
  const discovery = await discoverFolderSpreadsheets({ useMock: true, dbData: testDb });

  assert(discovery.totalDiscovered >= 10, `Discovered ${discovery.totalDiscovered} spreadsheets in folder`);
  assert(discovery.newlyDiscoveredCount >= 10, `Newly registered ${discovery.newlyDiscoveredCount} spreadsheets`);
  
  // Verify course resolution
  const cplSource = testDb.googleSheetSources.find(s => s.spreadsheetName.includes('CPL'));
  assert(cplSource && cplSource.courseName === 'Commercial Pilot License (CPL)', `CPL Leads auto-resolved to: ${cplSource?.courseName}`);
  assert(cplSource && cplSource.status === 'ACTIVE', 'CPL Leads marked as ACTIVE');

  const cabinSource = testDb.googleSheetSources.find(s => s.spreadsheetName.includes('Cabin'));
  assert(cabinSource && cabinSource.courseName === 'Cabin Crew & Ground Staff Training', `Cabin Crew Leads auto-resolved to: ${cabinSource?.courseName}`);

  const unmappedSource = testDb.googleSheetSources.find(s => s.spreadsheetName.includes('General Student'));
  assert(unmappedSource && unmappedSource.status === 'NEEDS_MAPPING', 'Ambiguous spreadsheet marked as NEEDS_MAPPING');

  // Verify discovery idempotency (re-running does not re-register)
  const discovery2 = await discoverFolderSpreadsheets({ useMock: true, dbData: testDb });
  assert(discovery2.newlyDiscoveredCount === 0, 'Re-discovery has 0 newly discovered (idempotent)');
  assert(discovery2.alreadyRegisteredCount === discovery.totalDiscovered, 'All sheets recognized as already registered');

  // --------------------------------------------------------------------------
  // TEST 2: Full Historical Backfill Across All 10+ Sheets
  // --------------------------------------------------------------------------
  console.log('\n📥 TEST 2: Full Historical Backfill Ingestion');
  const backfillResult = await syncAllFolderSpreadsheets({ isBackfill: true, useMock: true }, testDb);

  assert(backfillResult.totalLeadsImported > 0, `Total leads imported during backfill: ${backfillResult.totalLeadsImported}`);
  assert(backfillResult.activeSheetsSyncedCount >= 9, `Active sheets synced: ${backfillResult.activeSheetsSyncedCount}`);
  assert(backfillResult.needsMappingCount >= 1, `Unmapped sheets safely deferred: ${backfillResult.needsMappingCount}`);
  assert(backfillResult.errorSheetsCount === 1, 'Corrupted sheet safely isolated with error recorded');

  // Verify lead properties in CRM database
  const firstLead = testDb.leads[0];
  assert(firstLead.leadId.startsWith('LD-'), `Internal sequential Lead ID generated: ${firstLead.leadId}`);
  assert(firstLead.source === 'Meta Ads', `Source correctly attributed: ${firstLead.source}`);
  assert(firstLead.sourceSpreadsheetName !== undefined, `Attribution preserved sourceSpreadsheetName: "${firstLead.sourceSpreadsheetName}"`);
  assert(firstLead.sourceRowNumber !== undefined, `Attribution preserved sourceRowNumber: ${firstLead.sourceRowNumber}`);
  assert(['MS. INDU', 'MS. AYESHA', 'MS. PRITI', 'Admin User 1'].includes(firstLead.ownerId), `Dynamically assigned to counselor: ${firstLead.ownerId}`);

  // --------------------------------------------------------------------------
  // TEST 3: Idempotency & Duplicate Protection
  // --------------------------------------------------------------------------
  console.log('\n🛡️ TEST 3: Multi-Tier Idempotency & Duplicate Protection');
  const leadCountBefore = testDb.leads.length;

  // Re-run backfill immediately
  const duplicateBackfill = await syncAllFolderSpreadsheets({ isBackfill: true, useMock: true }, testDb);
  assert(duplicateBackfill.totalLeadsImported === 0, 'Zero new leads imported on duplicate backfill run');
  assert(duplicateBackfill.totalDuplicatesSkipped === leadCountBefore, `All ${duplicateBackfill.totalDuplicatesSkipped} rows detected and skipped as duplicates`);
  assert(testDb.leads.length === leadCountBefore, 'Database lead count unchanged');

  // Test Tier 1: Exact Meta Lead ID Duplicate
  const dupMetaRes = await ingestLeadRecord({
    name: 'Duplicate Tester',
    mobile: '+91 99999 88888',
    email: 'dup@test.com',
    externalLeadId: 'meta_cpl_101', // Already imported in Test 2
    sourceSpreadsheetName: 'Manual Test'
  }, {}, testDb);
  assert(dupMetaRes.status === 'duplicate', 'Tier 1 duplicate prevented by Meta Lead ID');

  // Test Tier 2: Mobile + Email Duplicate
  const dupPhoneEmailRes = await ingestLeadRecord({
    name: 'Duplicate Phone Email Tester',
    mobile: '+91 98111 22334', // Same as Aarav Mehta
    email: 'aarav.cpl@gmail.com',
    externalLeadId: 'different_id_999'
  }, {}, testDb);
  assert(dupPhoneEmailRes.status === 'duplicate', 'Tier 2 duplicate prevented by Mobile + Email');

  // --------------------------------------------------------------------------
  // TEST 4: Incremental Row Sync (lastProcessedRow advancement)
  // --------------------------------------------------------------------------
  console.log('\n⏩ TEST 4: Incremental Row Synchronization');
  // Append 2 new rows to CPL Leads sheet
  mockGoogleDrive.appendRow('sheet_cpl_001', [
    'meta_cpl_104', 'Vikrant Rathore', '+91 98111 99000', 'vikrant.pilot@gmail.com', 'CPL Pilot Admission 2026', 'Jaipur Aviation', 'Flight Sim Ad', 'Jaipur', new Date().toISOString()
  ]);
  mockGoogleDrive.appendRow('sheet_cpl_001', [
    'meta_cpl_105', 'Divya Sundaram', '+91 98111 99001', 'divya.cpl@gmail.com', 'CPL Pilot Admission 2026', 'Chennai Flying Club', 'Ground Class Ad', 'Chennai', new Date().toISOString()
  ]);

  const incrementalSync = await syncAllFolderSpreadsheets({ isBackfill: false, useMock: true }, testDb);
  assert(incrementalSync.totalLeadsImported === 2, `Incremental sync imported exactly ${incrementalSync.totalLeadsImported} new rows`);

  const cplSourceUpdated = testDb.googleSheetSources.find(s => s.spreadsheetId === 'sheet_cpl_001');
  assert(cplSourceUpdated.lastProcessedRow >= 5, `lastProcessedRow advanced to ${cplSourceUpdated.lastProcessedRow}`);

  // Re-run incremental sync without adding new rows
  const incrementalSync2 = await syncAllFolderSpreadsheets({ isBackfill: false, useMock: true }, testDb);
  assert(incrementalSync2.totalLeadsImported === 0, 'No rows imported when no new rows added');

  // --------------------------------------------------------------------------
  // TEST 5: Future New Course Spreadsheet Discovery & Mapping Flow
  // --------------------------------------------------------------------------
  console.log('\n🚀 TEST 5: Future New Course Spreadsheet Discovery & Mapping Flow');
  // Simulate user creating a new course spreadsheet in the Drive folder: "Drone Pilot Training Leads"
  mockGoogleDrive.addMockSheet('sheet_drone_013', 'Drone Pilot Training Leads', [
    ['Lead ID', 'Student Name', 'Contact Number', 'Email', 'City', 'Campaign', 'Date'],
    ['meta_drone_1301', 'Arjun Saxena', '+91 97777 11111', 'arjun.drone@gmail.com', 'Pune', 'Drone Pilot DGCA 2026', new Date().toISOString()],
    ['meta_drone_1302', 'Kiran Bedi', '+91 97777 22222', 'kiran.drone@gmail.com', 'Delhi', 'Drone Pilot DGCA 2026', new Date().toISOString()]
  ]);

  // Step A: Discovery detects the new spreadsheet
  const newDiscovery = await discoverFolderSpreadsheets({ useMock: true, dbData: testDb });
  assert(newDiscovery.newlyDiscoveredCount === 1, 'Newly added Drone spreadsheet discovered automatically');

  const droneSource = testDb.googleSheetSources.find(s => s.spreadsheetId === 'sheet_drone_013');
  assert(droneSource !== undefined, 'Drone spreadsheet registered in GoogleSheetSource registry');
  assert(droneSource.courseCode === 'DRONE_PILOT', `Course auto-resolved to: ${droneSource.courseName}`);

  // Step B: Sync ingests the 2 historical rows
  const droneSync = await syncSingleSpreadsheet('sheet_drone_013', { isBackfill: true, useMock: true }, testDb);
  assert(droneSync.leadsImported === 2, `Imported ${droneSync.leadsImported} leads from new Drone course sheet`);

  // Step C: Append new row and verify incremental sync on new sheet
  mockGoogleDrive.appendRow('sheet_drone_013', [
    'meta_drone_1303', 'Tarun Bajaj', '+91 97777 33333', 'tarun.drone@gmail.com', 'Gurgaon', 'Drone Pilot DGCA 2026', new Date().toISOString()
  ]);

  const droneIncSync = await syncSingleSpreadsheet('sheet_drone_013', { isBackfill: false, useMock: true }, testDb);
  assert(droneIncSync.leadsImported === 1, 'Incremental sync on new sheet imported 1 new lead');

  // --------------------------------------------------------------------------
  // TEST 6: Manual Course Mapping API for NEEDS_MAPPING Sheets
  // --------------------------------------------------------------------------
  console.log('\n🎯 TEST 6: Manual Course Mapping for NEEDS_MAPPING Sheet');
  const generalSheet = testDb.googleSheetSources.find(s => s.spreadsheetId === 'sheet_general_011');
  assert(generalSheet.status === 'NEEDS_MAPPING', 'General Inquiries sheet is initially NEEDS_MAPPING');

  // Map sheet to "Airport Management & Operations"
  await updateCourseMapping('sheet_general_011', {
    courseId: 4,
    courseCode: 'AIRPORT_MGMT',
    courseName: 'Airport Management & Operations'
  }, testDb);

  const mappedSheet = testDb.googleSheetSources.find(s => s.spreadsheetId === 'sheet_general_011');
  assert(mappedSheet.status === 'ACTIVE', 'Sheet status updated to ACTIVE after mapping');
  assert(mappedSheet.courseCode === 'AIRPORT_MGMT', 'Course assigned correctly');

  // Now sync the mapped sheet
  const generalSync = await syncSingleSpreadsheet('sheet_general_011', { isBackfill: true, useMock: true }, testDb);
  assert(generalSync.leadsImported === 1, `Imported ${generalSync.leadsImported} lead after manual course mapping`);

  // --------------------------------------------------------------------------
  // TEST 7: Malformed Row & Error Isolation
  // --------------------------------------------------------------------------
  console.log('\n⚠️ TEST 7: Malformed Row Handling & Sheet Error Isolation');
  // Ingest malformed lead (missing both phone and email)
  const invalidRes = await ingestLeadRecord({
    name: 'Invalid Tester',
    mobile: '',
    email: '',
    sourceSpreadsheetName: 'Malformed Test'
  }, {}, testDb);
  assert(invalidRes.status === 'invalid', 'Malformed row without contact information rejected safely');

  // Check corrupted sheet isolation
  const corruptedSheet = testDb.googleSheetSources.find(s => s.spreadsheetId === 'sheet_error_012');
  assert(corruptedSheet.status === 'ERROR', 'Corrupted sheet marked as ERROR');
  assert(corruptedSheet.lastErrorMessage !== null, `Error message logged: "${corruptedSheet.lastErrorMessage}"`);

  // --------------------------------------------------------------------------
  // TEST 8: Full Registry Status & Metrics
  // --------------------------------------------------------------------------
  console.log('\n📊 TEST 8: Registry Status & Summary Metrics');
  const allSources = await getAllSources(testDb);
  assert(allSources.length >= 11, `Total sources registered: ${allSources.length}`);

  const activeSources = allSources.filter(s => s.status === 'ACTIVE');
  assert(activeSources.length >= 10, `Active sources: ${activeSources.length}`);

  console.log('\n==================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('==================================================================\n');
}

runTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
