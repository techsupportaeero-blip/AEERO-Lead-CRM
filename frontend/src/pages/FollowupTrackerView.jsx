import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

// Admin / Sr. Counsellor view: which counselor's leads are stuck at which
// follow-up stage (1st, 2nd, 3rd... attempt), so a manager can spot leads
// that have had many follow-ups with no resolution.
export const FollowupTrackerView = ({ currentUser, onSelectLead, darkMode }) => {
  const isElevated = currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.name?.toUpperCase()?.includes('INDU');
  const [tracker, setTracker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isElevated) {
      setLoading(false);
      return;
    }
    loadTracker();
  }, [isElevated]);

  const loadTracker = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFollowupStageTracker(currentUser?.name, currentUser?.role);
      setTracker(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load follow-up stage tracker');
    } finally {
      setLoading(false);
    }
  };

  if (!isElevated) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] rounded-xl border p-8 shadow-sm text-center ${
        darkMode ? 'bg-[#151C24] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mb-4 text-[#7D610F]">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        <h2 className="text-xl font-extrabold mb-2">Admin / Sr. Counsellor Only</h2>
        <p className={`text-sm max-w-md ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The Follow-up Stage Tracker is only available to administrators and Sr. Counsellor.
        </p>
      </div>
    );
  }

  const filtered = tracker.filter(row => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (row.leadName || '').toLowerCase().includes(q)
      || (row.leadId || '').toLowerCase().includes(q)
      || (row.counselor || '').toLowerCase().includes(q);
  });

  const statusStyle = (status) => {
    const s = String(status || 'PENDING').toUpperCase();
    if (s === 'COMPLETED') return darkMode ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'MISSED') return darkMode ? 'bg-rose-950/40 text-rose-300 border-rose-800/40' : 'bg-rose-100 text-rose-700 border-rose-200';
    if (s === 'CANCELLED') return darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200';
    return darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-100 text-[#7D610F] border-amber-200';
  };

  return (
    <div className="space-y-5">
      <div className={`p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F]">event_repeat</span>
            <span>Follow-up Stage Tracker</span>
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>See which counselor's leads are on which follow-up stage, across the whole team</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead / counselor..."
            className={`px-3 py-2 rounded-lg text-xs border outline-none ${darkMode ? 'bg-[#1A1608] border-[#574719] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          />
          <button
            onClick={loadTracker}
            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300 border-[#574719]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden ${darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'}`}>
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
            <p className="text-xs font-semibold mt-2">Loading follow-up stages...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 text-xs font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No follow-up stages recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`font-bold uppercase text-[10px] ${darkMode ? 'bg-[#574719] text-slate-300' : 'bg-[#3E3100] text-[#F5D061]'}`}>
                  <th className="py-2.5 px-3">Counselor</th>
                  <th className="py-2.5 px-3">Lead</th>
                  <th className="py-2.5 px-3 text-center">Current Stage</th>
                  <th className="py-2.5 px-3">Latest Follow-up</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {filtered.map(row => (
                  <tr
                    key={row.leadRelId}
                    onClick={() => onSelectLead && onSelectLead(row.leadId)}
                    className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-[#1E2532]' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`py-2.5 px-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{row.counselor || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{row.leadName}</span>
                      <span className="block font-mono text-[10px] text-[#7D610F]">{row.leadId}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${darkMode ? 'bg-[#574719] text-[#E2B134]' : 'bg-[#7D610F] text-white'}`}>
                        {row.currentStageNumber}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {row.latestFollowup?.date} at {row.latestFollowup?.time} · {row.latestFollowup?.type}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(row.latestFollowup?.status)}`}>
                        {String(row.latestFollowup?.status || 'PENDING').toUpperCase()}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 max-w-[220px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} title={row.latestFollowup?.notes}>
                      {row.latestFollowup?.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
