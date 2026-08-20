import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const AuditLogsView = ({ darkMode }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Header */}
      <div className={`p-5 rounded-xl border shadow-sm flex justify-between items-center transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F]">history_edu</span>
            <span>System Audit Logs & Security Activity</span>
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Immutable trace of lead creation, updates, status transitions, counselor assignments, and database modifications</p>
        </div>

        <button
          onClick={loadAuditLogs}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
            darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300 border-[#262F3D]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Refresh Trace</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
            <p className="text-xs font-semibold mt-2">Loading audit log trace...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-xs font-medium">No audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0F2438] text-white font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {logs.map(log => (
                  <tr key={log.id} className={`transition-colors ${
                    darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      #{log.id}
                    </td>
                    <td className={`py-3 px-4 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {log.user || 'System'}
                    </td>
                    <td className={`py-3 px-4 font-bold ${darkMode ? 'text-amber-400' : 'text-[#7D610F]'}`}>
                      {log.action}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {log.entity}
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {log.entityId}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
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
