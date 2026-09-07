/**
 * ============================================================================
 * AEERO CRM - Google Drive Folder Sync Script
 * ============================================================================
 * 
 * Instructions:
 * 1. Open https://script.google.com and create a new standalone project.
 * 2. Paste this entire code into `Code.gs`.
 * 3. In Project Settings > Script Properties, add:
 *      CRM_BACKEND_URL   -> https://70da79cabf4bef.lhr.life/api/integrations/google-sheets
 *      CRM_INGEST_SECRET -> aeero_sheets_secret_2026
 *      CRM_INGEST_SECRET -> aeero_sheets_secret_2026
 *      DRIVE_FOLDER_ID   -> <The ID of your Google Drive Folder containing leads sheets>
 * 
 *    (To get the Folder ID, open the folder in Drive, the ID is in the URL: 
 *     e.g., https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ)
 * 
 * 4. Run `syncAllFolderLeads()` ONCE to import all existing rows from ALL sheets.
 * 5. Run `setupAutomatedTrigger()` to enable continuous time-based sync every 5 minutes.
 * 6. If you want to start completely fresh, run `resetAllCursors()` first.
 * ============================================================================
 */

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    crmUrl: 'https://idmlj-2401-4900-1cd6-2017-f452-14f2-e557-133e.free.pinggy.net/api/integrations/google-sheets',
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
  
  // Cleanups
  var fbErrorMsg = "You don't have enough permissions. Please refer to this help page: https://www.facebook.com/business/help/766393076839635";
  for (var key in payload) {
    if (typeof payload[key] === 'string' && payload[key].indexOf(fbErrorMsg) !== -1) {
      payload[key] = "Unknown (FB Permission Error)";
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
  
  var startTime = Date.now();
  var MAX_EXECUTION_TIME = 4.5 * 60 * 1000; // 4.5 mins
  var limitReached = false;
  
  var totalImported = 0;
  var totalUpdated = 0;
  var totalFailed = 0;
  
  Logger.log('📁 Scanning Folder: ' + folder.getName());
  
  while (files.hasNext()) {
    if (limitReached) break;
    
    var file = files.next();
    var ssId = file.getId();
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheets()[0]; // Process the first sheet tab
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    
    var headers = data[0];
    
    // Get cursor for THIS specific file
    var startRow = parseInt(props.getProperty('CURSOR_' + ssId) || '1', 10);
    
    if (startRow >= data.length) {
      // File is fully synced up to current row
      continue;
    }
    
    Logger.log('📄 Processing File: ' + file.getName() + ' (Starting from row ' + (startRow + 1) + ')');
    
    for (var i = startRow; i < data.length; i++) {
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        Logger.log('⏳ Time limit approaching. Pausing gracefully...');
        limitReached = true;
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
      
      var result = sendRowToCRM(config, ss, sheet, headers, rowData, i + 1);
      
      if (result && result.success) {
        if (result.data.action === 'created') totalImported++;
        else totalUpdated++;
      } else {
        totalFailed++;
        if (result && result.status === 429) Utilities.sleep(5000);
      }
      
      // Update cursor for this file
      props.setProperty('CURSOR_' + ssId, String(i + 1));
      Utilities.sleep(250);
    }
  }
  
  Logger.log('═══════════════════════════════════');
  if (limitReached) {
    Logger.log('⏸️ PAUSED DUE TO TIME LIMIT');
    Logger.log('👉 Please click "Run" again to resume the folder scan.');
  } else {
    Logger.log('✅ FOLDER SYNC COMPLETE (All files are up to date)');
  }
  Logger.log('Imported: ' + totalImported + ' | Updated: ' + totalUpdated + ' | Failed: ' + totalFailed);
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
    .everyMinutes(5)
    .create();
  
  Logger.log('✅ Automated trigger set: Folder will be scanned for new rows every 5 minutes.');
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
