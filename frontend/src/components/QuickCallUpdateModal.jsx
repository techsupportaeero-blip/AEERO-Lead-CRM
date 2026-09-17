import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { LEAD_STATUSES, FOLLOWUP_TYPES, getStatusCode } from '../config/constants';

// Fast-path popup opened by clicking a lead's name in the All Leads table -
// just the Call & Update Panel (the same form LeadWorkspace uses), so a
// counselor can log a call and move on without leaving the leads list.
// Everything else (contact info, notes, activity timeline, follow-up
// stages) still lives behind "View Workspace" for whoever needs the full
// picture.
const callOutcomes = [
  'No Answer', 'Busy', 'Call Declined', 'Switched Off',
  'Out of Network', 'Wrong Number', 'Call Back', 'Given Details',
  'Interested', 'Not Interested', 'Other'
];

export const QuickCallUpdateModal = ({ leadId, onClose, onSaved, onOpenFullWorkspace, currentUser, darkMode }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  const [outcome, setOutcome] = useState('Given Details');
  const [remarks, setRemarks] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('14:00');
  const [followUpType, setFollowUpType] = useState('Call');
  const [updateStatus, setUpdateStatus] = useState('NEW');
  const [savingCall, setSavingCall] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getLeadById(leadId);
        if (cancelled) return;
        setLead(data);
        setUpdateStatus(getStatusCode(data?.status || 'NEW'));
      } catch (err) {
        if (!cancelled) setLead(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [leadId]);

  const handleSave = async (e) => {
    e.preventDefault();
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
      setSavingCall(false);
      if (onSaved) onSaved(res.lead);
      onClose();
    } catch (err) {
      setSavingCall(false);
      alert("Failed to save activity: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-[#2A220C] border-amber-500/40' : 'bg-white border-[#CDB46A]'
      }`}>
        <div className={`flex items-center justify-between gap-2 border-b p-4 sticky top-0 z-10 ${
          darkMode ? 'bg-amber-950/30 border-[#574719]' : 'bg-amber-50/60 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#7D610F] text-[22px]">phone_in_talk</span>
            <div className="min-w-0">
              <h3 className={`font-bold text-base truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {loading ? 'Loading…' : (lead?.name || 'Call & Update')}
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Log interaction activity & schedule follow-up</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1 rounded flex-shrink-0 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[32px] animate-spin text-[#7D610F]">sync</span>
          </div>
        ) : !lead ? (
          <div className="py-16 text-center text-xs text-slate-500">Lead record not found.</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs p-5">

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
                {callOutcomes.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                Counselor Remarks
              </label>
              <textarea
                rows="3"
                placeholder="Enter detailed conversation summary..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#7D610F] outline-none ${
                  darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

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

            <button
              type="submit"
              disabled={savingCall}
              className="w-full py-3 bg-[#7D610F] hover:bg-[#68500C] text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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

            {onOpenFullWorkspace && (
              <button
                type="button"
                onClick={() => { onOpenFullWorkspace(lead.leadId); onClose(); }}
                className={`w-full py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                  darkMode ? 'border-[#574719] text-amber-300 hover:bg-[#1A1608]' : 'border-amber-300 text-[#7D610F] hover:bg-amber-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                View Full Workspace (contact info, notes, history)
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
