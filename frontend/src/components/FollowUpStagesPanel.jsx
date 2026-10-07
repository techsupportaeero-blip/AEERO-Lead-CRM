import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FOLLOWUP_TYPES } from '../config/constants';

// Pre-fills with the current clock time instead of a fixed default, so the
// field already reflects "now" and only needs changing when a different
// time is actually wanted.
const getCurrentTimeHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Self-contained follow-up history/scheduling card - fetches its own data,
// same as CallUpdatePanel, so it can be dropped into both the full Lead
// Workspace and the quick-access slide-over drawer without either needing
// to hold the followups list in its own state.
export const FollowUpStagesPanel = ({ lead, currentUser, darkMode, onNotify, refreshTrigger }) => {
  const [followups, setFollowups] = useState([]);
  const [loadingFollowups, setLoadingFollowups] = useState(true);

  const [addingStage, setAddingStage] = useState(false);
  const [newStageDate, setNewStageDate] = useState('');
  const [newStageTime, setNewStageTime] = useState(getCurrentTimeHHMM);
  const [newStageType, setNewStageType] = useState('Call');
  const [newStageNotes, setNewStageNotes] = useState('');
  const [savingStage, setSavingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState(null);
  const [stageNotesDraft, setStageNotesDraft] = useState('');
  const [savingStageUpdate, setSavingStageUpdate] = useState(false);

  useEffect(() => {
    if (!lead?.leadId) return;
    loadFollowups();
    // Reset any in-progress form state when switching to a different lead
    // (the drawer variant reuses one mounted instance across multiple leads).
    setAddingStage(false);
    setEditingStageId(null);
    setStageNotesDraft('');
  }, [lead?.leadId, refreshTrigger]);

  const loadFollowups = async () => {
    try {
      setLoadingFollowups(true);
      const fups = await api.getFollowups(lead.leadId);
      setFollowups(Array.isArray(fups) ? fups : []);
    } catch (err) {
      console.error("Failed to load follow-up stages:", err);
    } finally {
      setLoadingFollowups(false);
    }
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    if (!newStageDate) {
      alert("Please pick a date for this follow-up stage.");
      return;
    }
    try {
      setSavingStage(true);
      await api.addFollowup(lead.leadId, {
        date: newStageDate,
        time: newStageTime,
        type: newStageType,
        notes: newStageNotes.trim(),
        assignedTo: currentUser ? currentUser.name : lead.ownerId,
        createdBy: currentUser ? currentUser.name : 'Counselor'
      });
      await loadFollowups();
      setNewStageDate('');
      setNewStageTime(getCurrentTimeHHMM());
      setNewStageType('Call');
      setNewStageNotes('');
      setAddingStage(false);
      if (onNotify) onNotify("Follow-up stage added!");
    } catch (err) {
      alert("Failed to add follow-up stage: " + err.message);
    } finally {
      setSavingStage(false);
    }
  };

  const handleStartStageUpdate = (stage) => {
    setEditingStageId(stage.id);
    setStageNotesDraft(stage.notes || '');
  };

  const handleSaveStageUpdate = async (stage, status) => {
    try {
      setSavingStageUpdate(true);
      await api.updateFollowup(stage.id, { status, notes: stageNotesDraft.trim() });
      await loadFollowups();
      setEditingStageId(null);
      setStageNotesDraft('');
      if (onNotify) onNotify(`Follow-up marked ${status.toLowerCase()}!`);
    } catch (err) {
      alert("Failed to update follow-up stage: " + err.message);
    } finally {
      setSavingStageUpdate(false);
    }
  };

  if (!lead) return null;

  return (
    <div className={`p-5 rounded-xl border shadow-sm space-y-3 transition-colors ${
      darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
    }`}>
      <div className={`flex justify-between items-center border-b pb-2 ${darkMode ? 'border-[#574719]' : 'border-slate-200'}`}>
        <h4 className={`font-bold text-sm flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          <span className="material-symbols-outlined text-[#7D610F] text-[18px]">event_upcoming</span>
          <span>Follow-up Stages</span>
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          darkMode ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-100 text-[#7D610F]'
        }`}>
          {followups.length}
        </span>
      </div>

      {loadingFollowups ? (
        <p className="text-xs text-slate-500 italic">Loading follow-up stages…</p>
      ) : (
        <div className="space-y-2">
          {followups.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No follow-up stages yet. Add the first one below.</p>
          ) : (
            followups.map((f, idx) => {
              const statusUpper = String(f.status || 'PENDING').toUpperCase();
              const statusStyle = statusUpper === 'COMPLETED'
                ? (darkMode ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200')
                : statusUpper === 'MISSED'
                  ? (darkMode ? 'bg-rose-950/40 text-rose-300 border-rose-800/40' : 'bg-rose-100 text-rose-700 border-rose-200')
                  : statusUpper === 'CANCELLED'
                    ? (darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')
                    : (darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-100 text-[#7D610F] border-amber-200');
              return (
                <div key={f.id || f.followUpId || idx} className={`p-2.5 border rounded-lg text-xs space-y-1.5 ${
                  darkMode ? 'bg-amber-950/20 border-amber-800/30 text-slate-200' : 'bg-amber-50/50 border-[#CDB46A]/30 text-slate-800'
                }`}>
                  <div className="flex justify-between items-center font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${darkMode ? 'bg-[#574719] text-[#E2B134]' : 'bg-[#7D610F] text-white'}`}>
                        {idx + 1}
                      </span>
                      📅 {f.date} at {f.time}
                    </span>
                    <span className="text-[#7D610F] font-bold">{f.type || 'Call'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>
                      Stage {idx + 1} — {statusUpper}
                    </span>
                    {statusUpper === 'PENDING' && f.id && editingStageId !== f.id && (
                      <button
                        type="button"
                        onClick={() => handleStartStageUpdate(f)}
                        className={`text-[10px] font-bold underline ${darkMode ? 'text-amber-300' : 'text-[#7D610F]'}`}
                      >
                        Add outcome / mark done
                      </button>
                    )}
                  </div>
                  {f.notes && editingStageId !== f.id && (
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{f.notes}</p>
                  )}

                  {editingStageId === f.id && (
                    <div className="pt-1.5 space-y-1.5">
                      <textarea
                        value={stageNotesDraft}
                        onChange={(e) => setStageNotesDraft(e.target.value)}
                        placeholder="What happened at this stage?"
                        rows={2}
                        className={`w-full px-2 py-1.5 rounded text-[11px] outline-none border resize-none ${
                          darkMode ? 'bg-[#1A1608] border-[#574719] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={savingStageUpdate}
                          onClick={() => handleSaveStageUpdate(f, 'COMPLETED')}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        >
                          Mark Done
                        </button>
                        <button
                          type="button"
                          disabled={savingStageUpdate}
                          onClick={() => handleSaveStageUpdate(f, 'MISSED')}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                        >
                          Mark Missed
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingStageId(null); setStageNotesDraft(''); }}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${darkMode ? 'bg-[#1A1608] text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {addingStage ? (
        <form onSubmit={handleAddStage} className={`p-3 rounded-lg border space-y-2 ${darkMode ? 'bg-[#1A1608] border-[#574719]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={newStageDate}
              onChange={(e) => setNewStageDate(e.target.value)}
              required
              className={`px-2 py-1.5 rounded text-xs outline-none border ${darkMode ? 'bg-[#2A220C] border-[#574719] text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
            />
            <input
              type="time"
              value={newStageTime}
              onChange={(e) => setNewStageTime(e.target.value)}
              className={`px-2 py-1.5 rounded text-xs outline-none border ${darkMode ? 'bg-[#2A220C] border-[#574719] text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
            />
          </div>
          <select
            value={newStageType}
            onChange={(e) => setNewStageType(e.target.value)}
            className={`w-full px-2 py-1.5 rounded text-xs outline-none border ${darkMode ? 'bg-[#2A220C] border-[#574719] text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
          >
            {FOLLOWUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea
            value={newStageNotes}
            onChange={(e) => setNewStageNotes(e.target.value)}
            placeholder="Notes for this stage (optional)"
            rows={2}
            className={`w-full px-2 py-1.5 rounded text-xs outline-none border resize-none ${darkMode ? 'bg-[#2A220C] border-[#574719] text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
          />
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              disabled={savingStage}
              className="px-3 py-1.5 rounded text-xs font-bold bg-[#7D610F] hover:bg-[#68500C] text-white disabled:opacity-50"
            >
              {savingStage ? 'Saving…' : 'Save Stage'}
            </button>
            <button
              type="button"
              onClick={() => setAddingStage(false)}
              className={`px-3 py-1.5 rounded text-xs font-bold ${darkMode ? 'bg-[#1A1608] text-slate-300' : 'bg-slate-100 text-slate-600'}`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingStage(true)}
          className={`w-full py-2 rounded-lg text-xs font-bold border border-dashed flex items-center justify-center gap-1.5 transition-colors ${
            darkMode ? 'border-[#574719] text-amber-300 hover:bg-[#1A1608]' : 'border-amber-300 text-[#7D610F] hover:bg-amber-50'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Add Follow-up Stage
        </button>
      )}
    </div>
  );
};
