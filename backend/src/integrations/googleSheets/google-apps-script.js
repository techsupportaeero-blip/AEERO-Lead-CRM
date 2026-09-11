/**
 * ============================================================================
 * AEERO CRM - Google Drive Folder Sync Script
 * ============================================================================
 * 
 * Instructions:
 * 1. Open https://script.google.com and create a new standalone project.
 * 2. Paste this entire code into `Code.gs`.
 * 3. In Project Settings > Script Properties, add:
 *      CRM_BACKEND_URL   -> https://aeero-lead-crm.onrender.com/api/integrations/google-sheets
 *      CRM_INGEST_SECRET -> aeero_sheets_secret_2026
 *      CRM_INGEST_SECRET -> aeero_sheets_secret_2026
 *      DRIVE_FOLDER_ID   -> <The ID of your Google Drive Folder containing leads sheets>
 * 
 *    (To get the Folder ID, open the folder in Drive, the ID is in the URL: 
 *     e.g., https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ)
 * 
 * 4. Run `syncAllFolderLeads()` ONCE to import all existing rows from ALL sheets.
 * 5. Run `setupAutomatedTrigger()` to enable a 1-minute polling safety net.
 * 6. Run `installInstantTriggers()` to also get INSTANT (few-second) updates -
 *    this attaches an onChange trigger to every sheet in the folder, so a new
 *    row fires straight to the CRM instead of waiting for the next 1-minute
 *    poll. Re-run this any time you add a new spreadsheet to the folder
 *    (syncAllFolderLeads() also self-heals this for you on its next run).
 * 7. If you want to start completely fresh, run `resetAllCursors()` first.
 *
 * NOTE on "instant": Apps Script time-based triggers can't fire faster than
 * once a minute - that's a hard Google platform limit, not something this
 * script can tune. installInstantTriggers() sidesteps that by using an
 * event-driven onChange trigger instead of polling, which is what actually
 * gets new rows into the CRM within a few seconds of being added.
 * ============================================================================
 */

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    crmUrl: props.getProperty('CRM_BACKEND_URL') || 'https://aeero-lead-crm.onrender.com/api/integrations/google-sheets',
    secret: props.getProperty('CRM_INGEST_SECRET') || 'aeero_sheets_secret_2026',
    folderId: props.getProperty('DRIVE_FOLDER_ID') || '10-h5rCot7VfRzVoEwojMOkbq2j4tUVOU'
  };
}

// ─────────────────────────────────────────────
// 1. Core: Send a single row to CRM 
// ─────────────────────────────────────────────

function sendRowToCRM(config, ss, sheet, headers, rowData, rowNumber) {
  var payload = {};
  
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (!header || String(header).trim() === '' || String(header).trim() === '.') {
      header = 'remark_column_' + (i + 1);
    }
    var value = (i < rowData.length) ? rowData[i] : '';
    payload[String(header).trim()] = (value !== null && value !== undefined) ? String(value) : '';
  }
  
  // Add metadata
  payload['sourceSpreadsheetId'] = ss.getId();
  payload['sourceSpreadsheetName'] = ss.getName();
  payload['sourceSheetName'] = sheet.getName();
  payload['sourceRowNumber'] = rowNumber;
  
  // Field mappings
  var fieldMap = {
    'id': 'externalLeadId', 'full_name': 'name', 'phone_number': 'mobile',
    'campaign_name': 'campaign', 'campaign_id': 'campaignId',
    'adset_name': 'adSet', 'adset_id': 'adSetId',
    'ad_name': 'ad', 'ad_id': 'adId',
    'form_id': 'formId', 'form_name': 'formName',
    'created_time': 'leadDateTime', 'lead_status': 'status'
  };
  for (var origKey in fieldMap) {
    if (payload[origKey] !== undefined && payload[origKey] !== '') {
      var crmKey = fieldMap[origKey];
      if (!payload[crmKey] || payload[crmKey] === '') payload[crmKey] = payload[origKey];
    }
  }
  
  // Cleanups: Facebook sometimes fills a custom question's answer with its own
  // permission error instead of the actual value. Match on a short, stable
  // fragment (case-insensitive) rather than the full message, since Meta's
  // wording/punctuation for this error has changed before.
  var fbErrorNeedle = 'enough permissions';
  for (var key in payload) {
    if (typeof payload[key] === 'string' && payload[key].toLowerCase().indexOf(fbErrorNeedle) !== -1) {
      payload[key] = 'No Permission';
    }
  }
  
  if (payload['mobile'] && payload['mobile'].indexOf('p:') === 0) payload['mobile'] = payload['mobile'].substring(2);
  if (payload['phone_number'] && payload['phone_number'].indexOf('p:') === 0) payload['phone_number'] = payload['phone_number'].substring(2);
  if (payload['externalLeadId'] && payload['externalLeadId'].indexOf('l:') === 0) payload['externalLeadId'] = payload['externalLeadId'].substring(2);
  
  var prefixFields = ['adId', 'ad_id', 'adSetId', 'adset_id', 'campaignId', 'campaign_id', 'formId', 'form_id'];
  for (var pf = 0; pf < prefixFields.length; pf++) {
    if (payload[prefixFields[pf]]) payload[prefixFields[pf]] = String(payload[prefixFields[pf]]).replace(/^(ag|as|c|f):/, '');
  }
  
  if (payload['what_is_your_highest_qualification?'] && !payload['qualification']) payload['qualification'] = payload['what_is_your_highest_qualification?'];
  if (payload['education_level'] && !payload['qualification']) payload['qualification'] = payload['education_level'];
  if (payload['when_do_you_want_to_start_the_course?'] && !payload['requirement']) payload['requirement'] = payload['when_do_you_want_to_start_the_course?'];
  
  var remarkParts = [];
  var standardKeys = ['id','created_time','ad_id','ad_name','adset_id','adset_name','campaign_id','campaign_name',
    'form_id','form_name','is_organic','platform','full_name','phone_number','education_level','lead_status',
    'sourceSpreadsheetId','sourceSpreadsheetName','sourceSheetName','sourceRowNumber',
    'externalLeadId','name','mobile','campaign','campaignId','adSet','adSetId','ad','adId','formId','formName',
    'leadDateTime','status','qualification','requirement','email',
    'what_is_your_highest_qualification?','when_do_you_want_to_start_the_course?',
    'are_you_ready_to_attend_a_3-month_solar_pv_installer_training_program?'];
    
  for (var rk in payload) {
    if (rk.indexOf('remark_column_') === 0 && payload[rk]) {
      remarkParts.push(payload[rk]);
    } else if (standardKeys.indexOf(rk) === -1 && payload[rk]) {
      remarkParts.push('[' + rk + ']: ' + payload[rk]);
    }
  }
  if (remarkParts.length > 0) payload['remarks'] = remarkParts.join(' | ');
  if (!payload['source']) payload['source'] = 'Meta Ads';
  
  // API Call with Retry Logic
  var url = config.crmUrl + '/ingest';
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.secret,
      'x-integration-secret': config.secret,
      'Bypass-Tunnel-Reminder': 'true'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();
      var body = response.getContentText();
      
      if ((code === 503 || code === 502 || code === 408 || code === 429) && attempt < 3) {
        Logger.log('⚠️ Tunnel unstable (Code ' + code + ') on Row ' + rowNumber + '. Retrying in 5s (Attempt ' + attempt + '/3)...');
        Utilities.sleep(5000);
        continue;
      }
      
      var result = {};
      try {
        result = JSON.parse(body);
      } catch (e) {
        if (attempt < 3) {
           Utilities.sleep(5000);
           continue;
        }
        return { success: false, status: code, error: 'Non-JSON response' };
      }
      
      Logger.log('[' + ss.getName() + '] Row ' + rowNumber + ' → ' + code + ' → ' + (result.action || result.status));
      return { success: code >= 200 && code < 300, status: code, data: result };
      
    } catch (error) {
      if (attempt < 3) {
        Utilities.sleep(5000);
        continue;
      }
      return { success: false, error: error.message };
    }
  }
}

// ─────────────────────────────────────────────
// 2. IMPORT / SYNC: Process all sheets in Folder
// ─────────────────────────────────────────────

// Scans ONE already-open spreadsheet from its saved cursor onward and pushes
// any unsynced rows to the CRM. Shared by the 1-minute folder poll AND the
// instant onChange trigger, so both paths stay in sync (same de-dupe cursor,
// same field mapping, same retry logic).
// `deadline` (optional, ms epoch) lets a multi-file caller cut a single
// file's scan short if the overall run is close to Apps Script's execution
// limit; the instant single-row trigger doesn't need it.
function syncOneSpreadsheet(config, props, ss, deadline) {
  var ssId = ss.getId();
  var sheet = ss.getSheets()[0]; // Process the first sheet tab
  var data = sheet.getDataRange().getValues();

  var result = { imported: 0, updated: 0, failed: 0, timeLimited: false };
  if (data.length < 2) return result;

  var headers = data[0];
  var startRow = parseInt(props.getProperty('CURSOR_' + ssId) || '1', 10);
  if (startRow >= data.length) return result; // already fully synced

  Logger.log('📄 Processing File: ' + ss.getName() + ' (Starting from row ' + (startRow + 1) + ')');

  for (var i = startRow; i < data.length; i++) {
    if (deadline && Date.now() > deadline) {
      Logger.log('⏳ Time limit approaching. Pausing gracefully...');
      result.timeLimited = true;
      break;
    }

    var rowData = data[i];
    var hasData = false;
    for (var j = 0; j < rowData.length; j++) {
      if (rowData[j] !== null && rowData[j] !== undefined && String(rowData[j]).trim() !== '') {
        hasData = true;
        break;
      }
    }

    if (!hasData) {
      props.setProperty('CURSOR_' + ssId, String(i + 1));
      continue;
    }

    var sendResult = sendRowToCRM(config, ss, sheet, headers, rowData, i + 1);

    if (sendResult && sendResult.success) {
      if (sendResult.data.action === 'created') result.imported++;
      else result.updated++;
    } else {
      result.failed++;
      if (sendResult && sendResult.status === 429) Utilities.sleep(5000);
    }

    props.setProperty('CURSOR_' + ssId, String(i + 1));
    Utilities.sleep(250);
  }

  return result;
}

function syncAllFolderLeads() {
  var config = getConfig();

  if (!config.folderId) {
    Logger.log('❌ ERROR: DRIVE_FOLDER_ID is missing in Script Properties.');
    Logger.log('Please add it: Project Settings -> Script Properties');
    return;
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(config.folderId);
  } catch (e) {
    Logger.log('❌ ERROR: Could not find folder. Please check your DRIVE_FOLDER_ID.');
    return;
  }

  var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  var props = PropertiesService.getScriptProperties();

  var deadline = Date.now() + 4.5 * 60 * 1000; // 4.5 mins
  var limitReached = false;

  var totalImported = 0;
  var totalUpdated = 0;
  var totalFailed = 0;
  var triggersInstalled = 0;

  Logger.log('📁 Scanning Folder: ' + folder.getName());

  while (files.hasNext()) {
    if (limitReached) break;

    var file = files.next();
    var ss = SpreadsheetApp.openById(file.getId());

    // Self-healing: any spreadsheet that lands in the folder without an
    // instant (onChange) trigger yet gets one attached here automatically,
    // so you don't have to remember to re-run installInstantTriggers()
    // every time a new sheet shows up.
    if (ensureInstantTrigger(ss)) triggersInstalled++;

    var fileResult = syncOneSpreadsheet(config, props, ss, deadline);
    totalImported += fileResult.imported;
    totalUpdated += fileResult.updated;
    totalFailed += fileResult.failed;
    if (fileResult.timeLimited) limitReached = true;
  }

  Logger.log('═══════════════════════════════════');
  if (limitReached) {
    Logger.log('⏸️ PAUSED DUE TO TIME LIMIT');
    Logger.log('👉 Please click "Run" again to resume the folder scan.');
  } else {
    Logger.log('✅ FOLDER SYNC COMPLETE (All files are up to date)');
  }
  Logger.log('Imported: ' + totalImported + ' | Updated: ' + totalUpdated + ' | Failed: ' + totalFailed);
  if (triggersInstalled > 0) {
    Logger.log('⚡ Instant (onChange) trigger auto-installed for ' + triggersInstalled + ' new sheet(s).');
  }
  Logger.log('═══════════════════════════════════');
}

// ─────────────────────────────────────────────
// 2b. INSTANT SYNC: fire on every sheet edit instead of waiting for
//     the 1-minute poll (attached via installInstantTriggers() below)
// ─────────────────────────────────────────────

// Installable onChange trigger handler. Fires within seconds of a row being
// added/edited in a watched spreadsheet (Meta Lead Ads / Zapier / manual
// entry all write through the Sheets API, which onChange sees). Only scans
// the ONE spreadsheet that changed, not the whole folder, so it's fast.
function onSheetChange(e) {
  try {
    if (!e || !e.source) return;
    var config = getConfig();
    var props = PropertiesService.getScriptProperties();
    var ss = e.source;
    var result = syncOneSpreadsheet(config, props, ss);
    if (result.imported > 0 || result.updated > 0) {
      Logger.log('⚡ Instant sync [' + ss.getName() + ']: +' + result.imported + ' new, ' + result.updated + ' updated');
    }
  } catch (err) {
    Logger.log('❌ onSheetChange error: ' + err.message);
  }
}

// Attaches an onChange trigger to `ss` if it doesn't already have one.
// Returns true if a new trigger was installed, false if one already existed.
function ensureInstantTrigger(ss) {
  var ssId = ss.getId();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onSheetChange' && triggers[i].getTriggerSourceId() === ssId) {
      return false;
    }
  }
  ScriptApp.newTrigger('onSheetChange').forSpreadsheet(ss).onChange().create();
  return true;
}

// Run this ONCE after pasting/updating this script to switch every sheet in
// the folder from "wait up to 1 minute" to "updates within a few seconds".
// The 1-minute poll (setupAutomatedTrigger) stays on as a safety net in case
// an onChange event is ever missed.
function installInstantTriggers() {
  var config = getConfig();
  if (!config.folderId) {
    Logger.log('❌ ERROR: DRIVE_FOLDER_ID is missing in Script Properties.');
    return;
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(config.folderId);
  } catch (e) {
    Logger.log('❌ ERROR: Could not find folder. Please check your DRIVE_FOLDER_ID.');
    return;
  }

  var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  var installed = 0;
  var alreadySet = 0;

  while (files.hasNext()) {
    var file = files.next();
    var ss = SpreadsheetApp.openById(file.getId());
    if (ensureInstantTrigger(ss)) {
      installed++;
      Logger.log('⚡ Instant trigger installed: ' + file.getName());
    } else {
      alreadySet++;
    }
  }

  Logger.log('═══════════════════════════════════');
  Logger.log('✅ Instant triggers ready. Installed: ' + installed + ' | Already set: ' + alreadySet);
  Logger.log('New rows in any of these sheets now reach the CRM within a few seconds.');
  Logger.log('═══════════════════════════════════');
}

// ─────────────────────────────────────────────
// 3. UTILITY: Reset all cursors (Start Fresh)
// ─────────────────────────────────────────────

function resetAllCursors() {
  var props = PropertiesService.getScriptProperties();
  var allKeys = props.getKeys();
  var deletedCount = 0;
  
  for (var i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('CURSOR_') === 0) {
      props.deleteProperty(allKeys[i]);
      deletedCount++;
    }
  }
  Logger.log('✅ Reset complete! Deleted ' + deletedCount + ' file cursors.');
  Logger.log('You can now run syncAllFolderLeads() to import everything from row 1 again.');
}

// ─────────────────────────────────────────────
// 3b. UTILITY: Reset cursor for ONE file only, by name
//     (targeted backfill without rescanning every sheet)
// ─────────────────────────────────────────────

function resetCursorForFile(fileNamePart) {
  var config = getConfig();
  if (!fileNamePart) {
    Logger.log('❌ ERROR: Pass a (partial) file name, e.g. resetCursorForFile("Solar leedssss").');
    return;
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(config.folderId);
  } catch (e) {
    Logger.log('❌ ERROR: Could not find folder. Please check your DRIVE_FOLDER_ID.');
    return;
  }

  var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  var props = PropertiesService.getScriptProperties();
  var matchLower = fileNamePart.toLowerCase();
  var matched = 0;

  while (files.hasNext()) {
    var file = files.next();
    if (file.getName().toLowerCase().indexOf(matchLower) !== -1) {
      props.deleteProperty('CURSOR_' + file.getId());
      matched++;
      Logger.log('✅ Cursor reset for: ' + file.getName() + ' (' + file.getId() + ')');
    }
  }

  if (matched === 0) {
    Logger.log('⚠️ No spreadsheet in the folder matched "' + fileNamePart + '".');
  } else {
    Logger.log('Now run syncAllFolderLeads() to re-scan just this file from row 1.');
    Logger.log('Existing leads (matched by their Meta Lead ID) will be UPDATED in place, not duplicated.');
  }
}

// ─────────────────────────────────────────────
// 4. SETUP: Create automated time-based trigger
// ─────────────────────────────────────────────

function setupAutomatedTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncAllFolderLeads') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger('syncAllFolderLeads')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('✅ Automated trigger set: Folder will be scanned for new rows every 1 minute.');
}

// ─────────────────────────────────────────────
// 5. STATUS: Check CRM integration status
// ─────────────────────────────────────────────

function checkStatus() {
  var config = getConfig();
  var url = config.crmUrl + '/status';
  var options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + config.secret,
      'Bypass-Tunnel-Reminder': 'true'
    },
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var body = JSON.parse(response.getContentText());
  Logger.log('CRM Status: ' + JSON.stringify(body, null, 2));
  return body;
}
