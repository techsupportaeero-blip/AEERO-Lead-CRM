import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { LEAD_STATUSES, FOLLOWUP_TYPES, getStatusCode } from '../config/constants';

// Pre-fills the follow-up time with the current clock time, so the
// counselor doesn't have to manually set it on every call - it already
// reflects "now" and they only need to change it if they actually want a
// different time.
const getCurrentTimeHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const CALL_OUTCOMES = [
  'No Answer', 'Busy', 'Call Declined', 'Switched Off',
  'Out of Network', 'Wrong Number', 'Call Back', 'Given Details',
  'Interested', 'Not Interested', 'Other'
];

// The "log a call, optionally schedule a follow-up, optionally move the
// lead's status" form - shared by the full Lead Workspace (embedded in its
// sidebar) and the quick-access slide-over opened from the All Leads list
// (CallUpdateDrawer), so the two never drift out of sync the way they would
// if each had its own copy of this logic.
export const CallUpdatePanel = ({ lead, currentUser, darkMode, onSaved, onFollowupScheduled, onNotify }) => {
  const [outcome, setOutcome] = useState('Given Details');
  const [remarks, setRemarks] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState(getCurrentTimeHHMM);
  const [followUpType, setFollowUpType] = useState('Call');
  const [updateStatus, setUpdateStatus] = useState(() => getStatusCode(lead?.status || 'NEW'));
  const [savingCall, setSavingCall] = useState(false);
  const remarksRef = useRef(null);

  // Reset the form when a different lead is loaded into this panel (the
  // drawer variant reuses one mounted instance across multiple leads, so a
  // plain `autoFocus` prop would only ever fire once and never again after
  // switching leads - focus the remarks field imperatively here instead, so
  // opening a lead from All Leads lets you start typing immediately without
  // an extra click into the panel).
  useEffect(() => {
    setOutcome('Given Details');
    setRemarks('');
    setAdditionalInformation('');
    setFollowUpDate('');
    setFollowUpTime(getCurrentTimeHHMM());
    setFollowUpType('Call');
    setUpdateStatus(getStatusCode(lead?.status || 'NEW'));
    remarksRef.current?.focus();
  }, [lead?.leadId]);

  const handleSaveCallUpdate = async (e) => {
    e.preventDefault();
    if (!lead) return;
    if (!remarks.trim() && !outcome) {
      alert("Please enter call remarks or select an outcome.");
      return;
    }

    try {
      setSavingCall(true);
      const res = await api.recordActivity(lead.leadId, {
        outcome,
        remarks: remarks.trim(),
        additionalInformation: additionalInformation.trim(),
        followUpDate: followUpDate || null,
        followUpTime: followUpTime || '10:00',
        followUpType: followUpType || 'Call',
        leadStatus: updateStatus,
        createdBy: currentUser ? currentUser.name : 'Counselor'
      });

      if (onSaved) onSaved({ lead: res.lead, activities: res.activities });
      if (followUpDate && onFollowupScheduled) await onFollowupScheduled();

      setRemarks('');
      setAdditionalInformation('');
      setFollowUpDate('');
      setSavingCall(false);
      if (onNotify) onNotify("Call activity & lead update saved successfully!");

    } catch (err) {
      setSavingCall(false);
      alert("Failed to save activity: " + err.message);
    }
  };

  return (
    <div className={`rounded-xl border-2 p-5 shadow-lg space-y-4 transition-colors ${
      darkMode ? 'bg-[#2A220C] border-amber-500/40' : 'bg-white border-[#CDB46A]'
    }`}>
      <div className={`flex items-center gap-2 border-b -mx-5 -mt-5 p-4 rounded-t-xl ${
        darkMode ? 'bg-amber-950/30 border-[#574719]' : 'bg-amber-50/60 border-slate-200'
      }`}>
        <span className="material-symbols-outlined text-[#7D610F] text-[22px] font-bold">phone_in_talk</span>
        <div>
          <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Call & Update Panel</h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Log interaction activity & schedule follow-up</p>
        </div>
      </div>

      <form onSubmit={handleSaveCallUpdate} className="space-y-4 text-xs">

        {/* Outcome Selection */}
        <div>
          <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
            Call Outcome <span className="text-red-500">*</span>
          </label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className={`w-full border rounded-lg p-2.5 font-semibold focus:ring-2 focus:ring-[#7D610F] outline-none ${
              darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            {CALL_OUTCOMES.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Remarks */}
        <div>
          <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
            Counselor Remarks
          </label>
          <textarea
            ref={remarksRef}
            rows="3"
            placeholder="Enter detailed conversation summary..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#7D610F] outline-none ${
              darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Additional Requirements */}
        <div>
          <label className={`block font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
            Additional Information / Requirement / Budget
          </label>
          <input
            type="text"
            placeholder="e.g. Interested in Hostel facility & simulator labs"
            value={additionalInformation}
            onChange={(e) => setAdditionalInformation(e.target.value)}
            className={`w-full border rounded-lg p-2 outline-none ${
              darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Schedule Follow-up */}
        <div className={`p-3 rounded-lg border space-y-2 ${
          darkMode ? 'bg-amber-950/20 border-amber-800/30' : 'bg-amber-50/60 border-[#CDB46A]/50'
        }`}>
          <label className="block font-semibold text-[#7D610F] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">event</span>
            <span>Schedule Next Follow-Up (Optional)</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={`border rounded p-1.5 text-xs ${
                darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
            <input
              type="time"
              value={followUpTime}
              onChange={(e) => setFollowUpTime(e.target.value)}
              className={`border rounded p-1.5 text-xs ${
                darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className={`block font-semibold text-[10px] uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Follow-Up Channel Type</label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className={`w-full border rounded p-1.5 text-xs font-semibold ${
                darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {FOLLOWUP_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Change Lead Status */}
        <div>
          <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
            Update Standard Lead Status
          </label>
          <select
            value={updateStatus}
            onChange={(e) => setUpdateStatus(e.target.value)}
            className={`w-full border rounded-lg p-2 font-bold ${
              darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            {LEAD_STATUSES.map(s => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={savingCall}
          className="w-full py-3 bg-[#7D610F] hover:bg-[#68500C] text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {savingCall ? (
            <span>Saving Update...</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>SAVE & UPDATE LEAD</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
};
