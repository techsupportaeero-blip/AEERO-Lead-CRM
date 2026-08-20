import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const KanbanBoard = ({ onSelectLead, currentUser, onNotify, darkMode }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  const columns = [
    { code: 'NEW', title: 'New Leads', color: 'border-blue-500' },
    { code: 'NO_ANSWER', title: 'No Answer', color: 'border-amber-500' },
    { code: 'GIVEN_DETAILS', title: 'Given Details', color: 'border-[#7D610F]' },
    { code: 'INTERESTED', title: 'Interested', color: 'border-emerald-500' },
    { code: 'FOLLOW_UP', title: 'Follow-up', color: 'border-purple-500' },
    { code: 'CONVERTED', title: 'Converted / Enrolled', color: 'border-green-600' },
    { code: 'LOST', title: 'Lost / Closed', color: 'border-red-500' }
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load kanban leads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatusCode) => {
    e.preventDefault();
    const leadId = draggedLeadId || e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    try {
      // Optimistic update
      setLeads(prev => prev.map(l => (l.leadId === leadId || String(l.id) === String(leadId)) ? { ...l, status: targetStatusCode } : l));

      await api.updateLeadStatus(leadId, targetStatusCode, currentUser ? currentUser.name : 'Counselor');
      if (onNotify) onNotify(`Lead status updated to ${targetStatusCode}!`);
      loadLeads();
    } catch (err) {
      alert("Failed to update status: " + err.message);
      loadLeads();
    } finally {
      setDraggedLeadId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
        <p className="text-xs font-semibold mt-2">Loading Pipeline Kanban...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[calc(100vh-140px)] min-h-[500px] space-y-3 transition-colors ${
      darkMode ? 'text-slate-200' : 'text-slate-800'
    }`}>

      {/* Board Header */}
      <div className={`p-3.5 rounded-xl border shadow-xs flex justify-between items-center flex-shrink-0 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F] text-[20px]">view_kanban</span>
            <span>AEERO Lead Pipeline Kanban</span>
          </h2>
          <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Drag and drop lead cards across sales stages to update status in real-time</p>
        </div>
        <button
          onClick={loadLeads}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
            darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300 border-[#262F3D]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 flex gap-3.5 overflow-x-auto pb-2 custom-scrollbar min-h-0">
        {columns.map(col => {
          const colLeads = (leads || []).filter(l => l && l.status === col.code);
          return (
            <div
              key={col.code}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.code)}
              className={`w-[265px] min-w-[265px] h-full rounded-xl border-t-4 ${col.color} border-x border-b p-2.5 flex flex-col shadow-xs flex-shrink-0 min-h-0 transition-colors ${
                darkMode ? 'bg-[#141A23] border-[#262F3D]' : 'bg-white border-slate-200/80'
              }`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between pb-2 mb-2 border-b flex-shrink-0 ${
                darkMode ? 'border-[#262F3D]' : 'border-slate-200/70'
              }`}>
                <span className={`font-bold text-xs tracking-tight ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{col.title}</span>
                <span className={`w-5 h-5 rounded-full border font-bold text-[10px] flex items-center justify-center shadow-xs ${
                  darkMode ? 'bg-[#1E2633] border-[#262F3D] text-[#E5A812]' : 'bg-white border-slate-300 text-[#7D610F]'
                }`}>
                  {colLeads.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
                {colLeads.length === 0 ? (
                  <div className={`h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-[11px] italic ${
                    darkMode ? 'border-[#262F3D] text-slate-600' : 'border-slate-200 text-slate-400'
                  }`}>
                    Drop leads here
                  </div>
                ) : (
                  colLeads.map(lead => (
                    <div
                      key={lead.leadId || lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.leadId || lead.id)}
                      onClick={() => onSelectLead(lead.leadId || lead.id)}
                      className={`rounded-lg border p-2.5 shadow-xs transition-all cursor-grab active:cursor-grabbing border-l-4 border-l-[#7D610F] space-y-1 group ${
                        darkMode ? 'bg-[#181D26] border-[#262F3D] hover:bg-[#1E2633]' : 'bg-white border-slate-200 hover:shadow-md'
                      }`}
                    >
                      {/* Top Bar: ID + Status */}
                      <div className="flex justify-between items-center gap-1">
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-[#7D610F] border-[#CDB46A]/60'
                        }`}>
                          {lead.leadId}
                        </span>
                        <StatusBadge status={lead.status} />
                      </div>

                      {/* Lead Name */}
                      <h4 className={`font-bold text-xs leading-tight truncate transition-colors ${
                        darkMode ? 'text-white group-hover:text-[#E5A812]' : 'text-slate-900 group-hover:text-[#7D610F]'
                      }`}>
                        {lead.name}
                      </h4>

                      {/* Info Row: Phone & Course */}
                      <div className="flex items-center justify-between text-[10px] gap-1 pt-0.5">
                        <span className={`truncate font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>📞 {lead.mobile}</span>
                        <span className={`truncate font-semibold px-1.5 py-0.5 rounded text-[9px] ${
                          darkMode ? 'bg-[#12161F] text-slate-300 border border-[#262F3D]' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {lead.interestedCourse || 'General'}
                        </span>
                      </div>

                      {/* Footer Row: Source & Owner */}
                      <div className={`pt-1 border-t flex justify-between items-center text-[9px] ${
                        darkMode ? 'border-[#262F3D] text-slate-500' : 'border-slate-100 text-slate-400'
                      }`}>
                        <span>Source: <strong className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{lead.source || 'Direct'}</strong></span>
                        <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{lead.ownerId || 'Agent'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
