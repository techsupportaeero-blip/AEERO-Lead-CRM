import React from 'react';
import Loader from '../components/Loader';
import { KanbanBoard } from './KanbanBoard';
import { TasksView } from './TasksView';
import { CalendarView } from './CalendarView';
import { CustomersView } from './CustomersView';
import { CoursesView } from './CoursesView';
import { LeadSourcesView } from './LeadSourcesView';
import { AuditLogsView } from './AuditLogsView';

export const ModuleView = ({ routeId, onNavigateToLeads, onSelectLead, currentUser, onNotify, darkMode }) => {
  if (routeId === 'ai-assistant') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] rounded-xl border p-8 shadow-sm text-center ${
        darkMode ? 'bg-[#151C24] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mb-4 text-[#7D610F]">
          <span className="material-symbols-outlined text-[32px]">block</span>
        </div>
        <h2 className="text-xl font-extrabold mb-2">Module Access Blocked</h2>
        <p className={`text-sm max-w-md mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          The AI Assistant feature is currently disabled and blocked by system administration. Please contact your CRM manager for further access.
        </p>
        <button
          onClick={onNavigateToLeads}
          className="px-5 py-2.5 bg-[#7D610F] hover:bg-[#5D4709] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
        >
          Return to Leads Directory
        </button>
      </div>
    );
  }

  if (routeId === 'kanban') {
    return <KanbanBoard onSelectLead={onSelectLead} currentUser={currentUser} onNotify={onNotify} darkMode={darkMode} />;
  }

  if (routeId === 'tasks') {
    return <TasksView currentUser={currentUser} onNotify={onNotify} darkMode={darkMode} />;
  }

  if (routeId === 'calendar') {
    return <CalendarView onSelectLead={onSelectLead} currentUser={currentUser} onNotify={onNotify} darkMode={darkMode} />;
  }

  if (routeId === 'customers') {
    return <CustomersView onSelectLead={onSelectLead} darkMode={darkMode} />;
  }

  if (routeId === 'products') {
    return <CoursesView onNotify={onNotify} darkMode={darkMode} />;
  }

  if (routeId === 'lead-sources') {
    return <LeadSourcesView onNotify={onNotify} darkMode={darkMode} />;
  }

  if (routeId === 'activities') {
    return <AuditLogsView darkMode={darkMode} />;
  }

  // For all in-progress pages (email-triggers, email-templates, settings, system-settings, users, etc.),
  // render ONLY the clean SVG chip loader showing "In Progress" with no extra page elements.
  return (
    <div className={`flex items-center justify-center min-h-[80vh] w-full rounded-2xl border shadow-2xl p-4 overflow-hidden transition-colors ${
      darkMode ? 'bg-[#090C14] border-slate-800' : 'bg-[#0F1420] border-slate-800'
    }`}>
      <div className="w-full max-w-[750px]">
        <Loader text="In Progress" />
      </div>
    </div>
  );
};
