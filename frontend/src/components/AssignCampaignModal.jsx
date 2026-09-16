import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { COUNSELORS } from '../config/constants';

// Lets Admin / Sr. Counsellor pin a campaign to one counselor, overriding
// the system's hash-based auto-assignment. Optionally sweeps every existing
// lead already under that campaign over to them too, not just future ones.
export const AssignCampaignModal = ({ isOpen, campaignOptions, currentUser, darkMode, onClose, onAssigned }) => {
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [campaignName, setCampaignName] = useState('');
  const [ownerId, setOwnerId] = useState(COUNSELORS[0]);
  const [reassignExisting, setReassignExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setResult(null);
    setCampaignName(campaignOptions?.[0] || '');
    loadAssignments();
  }, [isOpen]);

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const data = await api.getCampaignAssignments();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      // Non-critical: list just stays empty if this fails
    } finally {
      setLoadingAssignments(false);
    }
  };

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!campaignName.trim() || !ownerId) return;
    try {
      setSaving(true);
      setError(null);
      const res = await api.assignCampaignToCounselor(
        campaignName.trim(),
        ownerId,
        reassignExisting,
        currentUser?.name,
        currentUser?.role
      );
      setResult(res);
      await loadAssignments();
      if (onAssigned) onAssigned();
    } catch (err) {
      setError(err.message || 'Failed to assign campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (name) => {
    try {
      await api.removeCampaignAssignment(name, currentUser?.name, currentUser?.role);
      await loadAssignments();
    } catch (err) {
      alert('Failed to remove assignment: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl border w-full max-w-lg p-6 space-y-5 transform transition-all scale-100 ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-sky-100 text-sky-600 border-sky-200">
            <span className="material-symbols-outlined text-[26px]">campaign</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-extrabold text-base leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>Assign Campaign to Counselor</h3>
            <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Overrides auto-assignment. New (and optionally existing) leads under this campaign go to the chosen counselor.
            </p>
          </div>
          <button onClick={onClose} className={`p-1 rounded ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Campaign</label>
            {campaignOptions && campaignOptions.length > 0 ? (
              <select
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs border ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                {campaignOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Type exact campaign name"
                className={`w-full px-3 py-2 rounded-lg text-xs border ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Assign To</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-xs border ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            >
              {COUNSELORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={reassignExisting}
              onChange={(e) => setReassignExisting(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-sky-600"
            />
            <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
              Also reassign every existing lead already under this campaign
            </span>
          </label>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          {result && <p className="text-xs text-emerald-600 font-medium">{result.message}</p>}
        </div>

        {/* Current Assignments List */}
        <div className={`border-t pt-3 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
          <p className={`text-[10px] font-bold uppercase mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current Overrides</p>
          {loadingAssignments ? (
            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading…</p>
          ) : assignments.length === 0 ? (
            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No manual overrides set - all campaigns use auto-assignment.</p>
          ) : (
            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
              {assignments.map(a => (
                <div key={a.id} className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded ${darkMode ? 'bg-[#1A1608] text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                  <span className="truncate"><strong>{a.campaignName}</strong> → {a.ownerId}</span>
                  <button onClick={() => handleRemove(a.campaignName)} className="text-rose-500 hover:text-rose-600 flex-shrink-0 ml-2" title="Remove override">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={saving || !campaignName.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{saving ? 'Assigning…' : 'Assign Campaign'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
