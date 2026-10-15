/**
 * ============================================================================
 * AEERO CRM - SINGLE SHEET SYNC SCRIPT (testing phase, e.g. "Solar leads")
 * ============================================================================
 *
 * Use this when testing the CRM ingestion pipeline against just ONE Google
 * Sheet, before switching to the folder-wide script (google-apps-script.js)
 * once multiple sheets are ready to go in a Drive folder together.
 *
 * Syncs EVERY tab in the sheet (not a hardcoded list) - add a new tab to the
 * spreadsheet and it gets picked up automatically on the next run.
 *
 * Instructions:
 * 1. Open the test sheet (e.g. "Solar leads") -> Extensions > Apps Script.
 *    This binds the script directly to that sheet - no SPREADSHEET_ID
 *    needed. (You can still set SPREADSHEET_ID in Script Properties instead
 *    if you'd rather run this as a standalone project pointed at one sheet.)
 * 2. Paste this entire code into `Code.gs`.
 * 3. In Project Settings > Script Properties, add:
 *      CRM_BACKEND_URL   -> https://aeero-lead-crm.onrender.com/api/integrations/google-sheets
 *      CRM_INGEST_SECRET -> aeero_sheets_secret_2026
 *
 * 4. Run `syncSingleSheet()` ONCE to backfill every row already in the sheet.
 * 5. Run `setupSingleSheetTrigger()` ONCE for a 1-minute polling safety net.
 * 6. Run `installSingleSheetInstantTrigger()` ONCE for INSTANT (few-second)
 *    sync on top of the poll - same onChange approach as the folder-wide
 *    script. Not required, but recommended.
 * 7. Run `checkStatus()` any time to confirm the CRM backend is reachable.
 * 8. Run `resetSingleSheetCursors()` to re-import every tab from row 1 again.
 * 9. Run `removeSingleSheetTrigger()` / `removeSingleSheetInstantTrigger()`
 *    to stop automatic sync.
 *
 * When you're ready to move this sheet into the folder-wide pipeline: run
 * `removeSingleSheetTrigger()` and `removeSingleSheetInstantTrigger()` here
 * first, so this script and the folder-wide one never process the same
 * sheet at the same time (that's what caused duplicate leads before).
 * ============================================================================
 */

var MAX_ROW_RETRIES = 5;

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

  // Cleanups: Facebook sometimes fills a custom question's answer with its own
  // permission error instead of the actual value. Match on a short, stable
  // fragment (case-insensitive) rather than the full message, since Meta's
  // wording/punctuation for this error has changed before. Kept identical to
  // the main folder-wide script so the CRM shows the same "No Permission"
  // text everywhere, regardless of which script ingested the row.
  var fbErrorNeedle = 'enough permission';
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
// 2. Sync ONE tab from its saved cursor onward
// ─────────────────────────────────────────────

// Shared by the 1-minute poll AND the instant onChange trigger, same
// bounded-retry behavior as the folder-wide script: a row that fails to
// reach the CRM gets retried on later runs instead of being silently and
// permanently skipped, but gives up after MAX_ROW_RETRIES so one bad row
// can't block every lead behind it in the same tab forever.
function syncOneTab(config, props, ss, sheet, deadline) {
  var cursorKey = 'CURSOR_TEST_' + ss.getId() + '_' + sheet.getName();
  var data = sheet.getDataRange().getValues();

  var result = { imported: 0, updated: 0, failed: 0, timeLimited: false, retryPending: false };
  if (data.length < 2) return result;

  var headers = data[0];
  var startRow = parseInt(props.getProperty(cursorKey) || '1', 10);
  if (startRow >= data.length) return result; // already fully synced

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
      props.setProperty(cursorKey, String(i + 1));
      continue;
    }

    var sendResult = sendTestRowToCRM(config, ss, sheet, headers, rowData, i + 1);
    var failCountKey = 'FAILCOUNT_TEST_' + ss.getId() + '_' + sheet.getName() + '_' + (i + 1);

    if (sendResult && sendResult.success) {
      if (sendResult.data.action === 'created') result.imported++;
      else result.updated++;
      props.deleteProperty(failCountKey);
      props.setProperty(cursorKey, String(i + 1));
    } else {
      result.failed++;
      if (sendResult && sendResult.status === 429) Utilities.sleep(5000);

      var failCount = parseInt(props.getProperty(failCountKey) || '0', 10) + 1;

      if (failCount < MAX_ROW_RETRIES) {
        props.setProperty(failCountKey, String(failCount));
        Logger.log('⚠️ Row ' + (i + 1) + ' in tab [' + sheet.getName() + '] failed (attempt ' + failCount + '/' + MAX_ROW_RETRIES + '). Will retry next run instead of skipping it.');
        result.retryPending = true;
        break;
      }

      Logger.log('❌ Row ' + (i + 1) + ' in tab [' + sheet.getName() + '] failed ' + MAX_ROW_RETRIES + ' times in a row - giving up and moving on. Check this row manually: ' + JSON.stringify(rowData));
      props.deleteProperty(failCountKey);
      props.setProperty(cursorKey, String(i + 1));
    }

    Utilities.sleep(250);
  }

  return result;
}

function openTestSpreadsheet(config) {
  try {
    return config.spreadsheetId ? SpreadsheetApp.openById(config.spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log('❌ ERROR: Could not open spreadsheet. Check SPREADSHEET_ID script property.');
    return null;
  }
}

// ─────────────────────────────────────────────
// 3. Sync every tab in this one sheet (1-minute poll entry point)
// ─────────────────────────────────────────────

function syncSingleSheet() {
  // Guard against overlapping runs (the 1-minute poll and the instant
  // onChange trigger both call into this file): if one is still mid-row
  // when the other fires, both would race the CRM's duplicate check on the
  // same row at nearly the same instant and create duplicate leads (this
  // happened once already - see the dedupe cleanup in project memory). If
  // another run already holds the lock, skip this one entirely.
  var lock = LockService.getScriptLock();
  var gotLock = lock.tryLock(5000);
  if (!gotLock) {
    Logger.log('⏭️ Another sync is already running - skipping this run to avoid duplicate leads.');
    return;
  }

  try {
    syncSingleSheetBody();
  } finally {
    lock.releaseLock();
  }
}

function syncSingleSheetBody() {
  var config = getTestConfig();
  var props = PropertiesService.getScriptProperties();
  var ss = openTestSpreadsheet(config);

  if (!ss) {
    Logger.log('❌ ERROR: No spreadsheet found. Either set SPREADSHEET_ID in Script Properties,');
    Logger.log('   or bind this script to a sheet via Extensions > Apps Script.');
    return;
  }

  var deadline = Date.now() + 4.5 * 60 * 1000; // 4.5 mins, same safety margin as the folder-wide script
  var sheets = ss.getSheets(); // every tab - no hardcoded tab list to maintain

  var grandImported = 0;
  var grandUpdated = 0;
  var grandFailed = 0;
  var tabsWithRetryPending = 0;
  var limitReached = false;

  for (var s = 0; s < sheets.length; s++) {
    if (limitReached) break;

    var sheet = sheets[s];
    var result = syncOneTab(config, props, ss, sheet, deadline);

    if (result.imported || result.updated || result.failed) {
      Logger.log('🧪 Tab "' + sheet.getName() + '" → Imported: ' + result.imported + ' | Updated: ' + result.updated + ' | Failed: ' + result.failed);
    }

    grandImported += result.imported;
    grandUpdated += result.updated;
    grandFailed += result.failed;
    if (result.timeLimited) limitReached = true;
    if (result.retryPending) tabsWithRetryPending++;
  }

  Logger.log('═══════════════════════════════════');
  Logger.log('✅ SYNC COMPLETE for "' + ss.getName() + '" (' + sheets.length + ' tab(s) checked)');
  Logger.log('Imported: ' + grandImported + ' | Updated: ' + grandUpdated + ' | Failed: ' + grandFailed);
  if (tabsWithRetryPending > 0) {
    Logger.log('🔁 ' + tabsWithRetryPending + ' tab(s) have a row waiting to retry (will auto-retry on the next run).');
  }
  if (limitReached) {
    Logger.log('⏸️ Stopped early - execution time limit approaching. Will resume the rest on the next run.');
  }
  Logger.log('═══════════════════════════════════');
}

// ─────────────────────────────────────────────
// 4. INSTANT SYNC: fire on every edit to this sheet, any tab
// ─────────────────────────────────────────────

function onSingleSheetChange(e) {
  if (!e || !e.source) return;

  // Same overlap guard as syncSingleSheet() - this and the 1-minute poll
  // must never process the same row at the same time.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log('⏭️ Instant sync skipped - a sync is already running.');
    return;
  }

  try {
    var config = getTestConfig();
    var props = PropertiesService.getScriptProperties();
    var ss = e.source;
    var sheets = ss.getSheets();

    for (var s = 0; s < sheets.length; s++) {
      var result = syncOneTab(config, props, ss, sheets[s]);
      if (result.imported > 0 || result.updated > 0) {
        Logger.log('⚡ Instant sync [' + sheets[s].getName() + ']: +' + result.imported + ' new, ' + result.updated + ' updated');
      }
    }
  } catch (err) {
    Logger.log('❌ onSingleSheetChange error: ' + err.message);
  } finally {
    lock.releaseLock();
  }
}

// ─────────────────────────────────────────────
// 5. SETUP / TEARDOWN: triggers
// ─────────────────────────────────────────────

function setupSingleSheetTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncSingleSheet') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('syncSingleSheet')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('✅ Automated trigger set: this sheet will be checked for new rows every 1 minute.');
}

function removeSingleSheetTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncSingleSheet') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log('✅ Removed ' + removed + ' trigger(s). 1-minute polling stopped.');
}

function installSingleSheetInstantTrigger() {
  var config = getTestConfig();
  var ss = openTestSpreadsheet(config);
  if (!ss) return;

  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onSingleSheetChange' && triggers[i].getTriggerSourceId() === ss.getId()) {
      Logger.log('ℹ️ Instant trigger already installed for "' + ss.getName() + '".');
      return;
    }
  }

  ScriptApp.newTrigger('onSingleSheetChange').forSpreadsheet(ss).onChange().create();
  Logger.log('⚡ Instant trigger installed for "' + ss.getName() + '". New rows now reach the CRM within a few seconds.');
}

function removeSingleSheetInstantTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onSingleSheetChange') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log('✅ Removed ' + removed + ' instant trigger(s).');
}

// ─────────────────────────────────────────────
// 6. UTILITY: Reset cursors (start fresh on this sheet)
// ─────────────────────────────────────────────

function resetSingleSheetCursors() {
  var config = getTestConfig();
  var props = PropertiesService.getScriptProperties();
  var ss = openTestSpreadsheet(config);
  if (!ss) return;

  var sheets = ss.getSheets();
  var deletedCursors = 0;
  var deletedFailCounts = 0;
  var allKeys = props.getKeys();

  for (var s = 0; s < sheets.length; s++) {
    var cursorKey = 'CURSOR_TEST_' + ss.getId() + '_' + sheets[s].getName();
    if (props.getProperty(cursorKey) !== null) {
      props.deleteProperty(cursorKey);
      deletedCursors++;
    }
  }

  // Also clear any leftover per-row failure counters for this spreadsheet,
  // so a row that was mid-retry doesn't start with a stale fail count.
  var failPrefix = 'FAILCOUNT_TEST_' + ss.getId() + '_';
  for (var k = 0; k < allKeys.length; k++) {
    if (allKeys[k].indexOf(failPrefix) === 0) {
      props.deleteProperty(allKeys[k]);
      deletedFailCounts++;
    }
  }

  Logger.log('✅ Reset complete! Cleared ' + deletedCursors + ' tab cursor(s) and ' + deletedFailCounts + ' retry counter(s).');
  Logger.log('Next run of syncSingleSheet() will re-import every tab from row 1 again.');
}

// ─────────────────────────────────────────────
// 7. STATUS: Check CRM integration status
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
