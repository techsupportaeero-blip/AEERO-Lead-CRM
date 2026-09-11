/**
 * ============================================================================
 * AEERO CRM - SINGLE SHEET TEST SCRIPT (for testing only, not the folder-wide sync)
 * ============================================================================
 *
 * Use this when you want to test the CRM ingestion pipeline against just ONE
 * Google Sheet, instead of scanning the whole Drive folder.
 *
 * Instructions:
 * 1. Open https://script.google.com and create a new standalone project
 *    (or open the sheet you want to test, then Extensions > Apps Script,
 *    which binds the script to that sheet automatically).
 * 2. Paste this entire code into `Code.gs`.
 * 3. In Project Settings > Script Properties, add:
 *      CRM_BACKEND_URL   -> https://aeero-lead-crm.onrender.com/api/integrations/google-sheets
 *      CRM_INGEST_SECRET -> aeero_sheets_secret_2026
 *      SPREADSHEET_ID    -> <ID of the ONE test sheet>  (skip this if you bound
 *                            the script directly to the sheet via Extensions > Apps Script)
 *
 *    (To get the Spreadsheet ID, open the sheet, the ID is in the URL:
 *     e.g., https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit)
 *
 * 4. RULE 1 — OLD LEADS: Run `syncSingleSheetTest()` ONCE to backfill all existing
 *    rows already in the sheet into the CRM.
 * 5. RULE 2 — NEW LEADS: Run `setupSingleSheetTrigger()` ONCE to start an automatic
 *    time-based sync (every 1 minute) so any new row added to the sheet later
 *    is picked up and shows up in the CRM on its own, with no manual run needed.
 * 6. Run `checkStatus()` any time to confirm the CRM backend is reachable.
 * 7. Run `resetTestCursor()` if you want to re-import everything from row 1 again.
 * 8. Run `removeSingleSheetTrigger()` to stop the automatic sync.
 * ============================================================================
 */

function getTestConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    crmUrl: props.getProperty('CRM_BACKEND_URL') || 'https://aeero-lead-crm.onrender.com/api/integrations/google-sheets',
    secret: props.getProperty('CRM_INGEST_SECRET') || 'aeero_sheets_secret_2026',
    spreadsheetId: props.getProperty('SPREADSHEET_ID') || ''
  };
}

// ─────────────────────────────────────────────
// 1. Core: Send a single row to CRM
// ─────────────────────────────────────────────

function sendTestRowToCRM(config, ss, sheet, headers, rowData, rowNumber) {
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
        Logger.log('⚠️ Backend unstable (Code ' + code + ') on Row ' + rowNumber + '. Retrying in 5s (Attempt ' + attempt + '/3)...');
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

      Logger.log('[TEST: ' + ss.getName() + '] Row ' + rowNumber + ' → ' + code + ' → ' + (result.action || result.status));
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
// 2. TEST: Sync just this ONE sheet
// ─────────────────────────────────────────────

function syncSingleSheetTest() {
  var config = getTestConfig();
  var props = PropertiesService.getScriptProperties();

  var ss;
  try {
    ss = config.spreadsheetId ? SpreadsheetApp.openById(config.spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log('❌ ERROR: Could not open spreadsheet. Check SPREADSHEET_ID script property.');
    return;
  }

  if (!ss) {
    Logger.log('❌ ERROR: No spreadsheet found. Either set SPREADSHEET_ID in Script Properties,');
    Logger.log('   or bind this script to a sheet via Extensions > Apps Script.');
    return;
  }

  var sheet = ss.getSheets()[0]; // Process the first sheet tab only
  var data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    Logger.log('ℹ️ Sheet "' + ss.getName() + '" has no data rows to sync.');
    return;
  }

  var headers = data[0];
  var cursorKey = 'CURSOR_TEST_' + ss.getId();
  var startRow = parseInt(props.getProperty(cursorKey) || '1', 10);

  if (startRow >= data.length) {
    Logger.log('✅ Sheet "' + ss.getName() + '" is already fully synced (up to row ' + startRow + ').');
    return;
  }

  Logger.log('🧪 TEST SYNC → Sheet: ' + ss.getName() + ' (Starting from row ' + (startRow + 1) + ')');

  var totalImported = 0;
  var totalUpdated = 0;
  var totalFailed = 0;

  for (var i = startRow; i < data.length; i++) {
    var rowData = data[i];
    var hasData = false;
    for (var j = 0; j < rowData.length; j++) {
      if (rowData[j] !== null && rowData[j] !== undefined && String(rowData[j]).trim() !== '') {
        hasData = true;
        break;
      }
    }

    if (!hasData) {
      props.setProperty(cursorKey, String(i + 1));
      continue;
    }

    var result = sendTestRowToCRM(config, ss, sheet, headers, rowData, i + 1);

    if (result && result.success) {
      if (result.data.action === 'created') totalImported++;
      else totalUpdated++;
    } else {
      totalFailed++;
      if (result && result.status === 429) Utilities.sleep(5000);
    }

    props.setProperty(cursorKey, String(i + 1));
    Utilities.sleep(250);
  }

  Logger.log('═══════════════════════════════════');
  Logger.log('✅ TEST SYNC COMPLETE for "' + ss.getName() + '"');
  Logger.log('Imported: ' + totalImported + ' | Updated: ' + totalUpdated + ' | Failed: ' + totalFailed);
  Logger.log('═══════════════════════════════════');
}

// ─────────────────────────────────────────────
// 3. RULE 2: Auto-sync new leads as they're added to the sheet
// ─────────────────────────────────────────────

function setupSingleSheetTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncSingleSheetTest') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('syncSingleSheetTest')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('✅ Automated trigger set: this sheet will be checked for new rows every 1 minute.');
  Logger.log('   Any new lead added to the sheet will now show up in the CRM automatically.');
}

function removeSingleSheetTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncSingleSheetTest') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log('✅ Removed ' + removed + ' trigger(s). Automatic sync stopped.');
}

// ─────────────────────────────────────────────
// 4. UTILITY: Reset the test cursor (start fresh on this sheet)
// ─────────────────────────────────────────────

function resetTestCursor() {
  var config = getTestConfig();
  var props = PropertiesService.getScriptProperties();

  var ss;
  try {
    ss = config.spreadsheetId ? SpreadsheetApp.openById(config.spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log('❌ ERROR: Could not open spreadsheet. Check SPREADSHEET_ID script property.');
    return;
  }

  var cursorKey = 'CURSOR_TEST_' + ss.getId();
  props.deleteProperty(cursorKey);
  Logger.log('✅ Reset complete! Next run of syncSingleSheetTest() will re-import from row 1.');
}

// ─────────────────────────────────────────────
// 5. STATUS: Check CRM integration status
// ─────────────────────────────────────────────

function checkStatus() {
  var config = getTestConfig();
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
