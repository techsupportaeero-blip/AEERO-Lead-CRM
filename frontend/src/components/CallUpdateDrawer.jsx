import React, { useState } from 'react';
import { CallUpdatePanel } from './CallUpdatePanel';
import { FollowUpStagesPanel } from './FollowUpStagesPanel';

// Quick-access slide-over opened by clicking a lead's name in All Leads -
// just the Call & Update Panel, half the screen, so a counselor can log a
// call without leaving the list. The full Lead Workspace (history, notes,
// tasks, follow-up stages) stays a separate, deliberate action via the
// "View Workspace" button.
export const CallUpdateDrawer = ({ lead, currentUser, darkMode, onClose, onSaved, onNotify, onOpenFullWorkspace }) => {
  const [followupsRefreshKey, setFollowupsRefreshKey] = useState(0);

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Half-screen side panel */}
      <div className={`relative w-full md:w-1/2 lg:w-2/5 h-full overflow-y-auto custom-scrollbar shadow-2xl transition-colors ${
        darkMode ? 'bg-[#120E00]' : 'bg-slate-50'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b backdrop-blur-sm transition-colors ${
          darkMode ? 'bg-[#1A1608]/95 border-[#574719]' : 'bg-white/95 border-slate-200'
        }`}>
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Quick Call & Update</p>
            <h2 className={`font-extrabold text-base truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.name}</h2>
            <p className={`text-xs font-mono ${darkMode ? 'text-amber-200/90' : 'text-slate-500'}`}>{lead.displayId || lead.leadId} · {lead.phone || lead.mobile}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenFullWorkspace && (
              <button
                onClick={() => onOpenFullWorkspace(lead.leadId)}
                title="Open full Lead Workspace"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  darkMode ? 'bg-[#2A220C] hover:bg-[#3D3212] text-amber-300 border border-[#574719]' : 'bg-amber-50 hover:bg-amber-100 text-[#7D610F] border border-amber-200'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                <span>View Workspace</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-[#2A220C]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Panel */}
        <div className="p-5 space-y-5">
          <CallUpdatePanel
            lead={lead}
            currentUser={currentUser}
            darkMode={darkMode}
            onNotify={onNotify}
            onSaved={onSaved}
            onFollowupScheduled={() => setFollowupsRefreshKey(k => k + 1)}
          />

          <FollowUpStagesPanel
            lead={lead}
            currentUser={currentUser}
            darkMode={darkMode}
            onNotify={onNotify}
            refreshTrigger={followupsRefreshKey}
          />
        </div>
      </div>
    </div>
  );
};
