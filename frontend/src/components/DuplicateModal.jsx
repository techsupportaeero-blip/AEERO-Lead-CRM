import React from 'react';

export const DuplicateModal = ({ duplicateData, onViewExisting, onCreateAnyway, onClose, darkMode }) => {
  if (!duplicateData) return null;

  const lead = duplicateData.existingLead || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-xl shadow-2xl border w-full max-w-lg overflow-hidden transition-all transform scale-100 ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header Warning Bar */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Duplicate Lead Detected</h3>
              <p className="text-xs text-amber-100">Matching record found in database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body - Existing Lead Info Card */}
        <div className="p-6 space-y-4">
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {duplicateData.message || (
              <>
                Duplicate Lead Detected! {duplicateData.duplicateField || 'Mobile Number / Email'} <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{duplicateData.duplicateValue || lead.mobile || lead.email}</strong> is already registered to <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{lead.name || 'Existing Lead'}</strong> (<span className="font-mono text-[#E5A812] font-bold">{lead.leadId || 'LD-XXXXXX'}</span>).
              </>
            )}
          </p>

          <div className={`rounded-lg p-4 space-y-3 border ${
            darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex justify-between items-start border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <div>
                <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.name || 'Unnamed Lead'}</h4>
                <p className="text-xs font-mono text-amber-400 font-semibold">{lead.leadId || 'LD-XXXXXX'}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                {lead.status || 'New'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Interested Course</span>
                <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{lead.interestedCourse || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Lead Source</span>
                <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{lead.source || 'Meta Ads'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Assigned Counselor</span>
                <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{lead.ownerId || 'Rahul Sharma'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase tracking-wider font-semibold text-[10px]">Created Date</span>
                <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className={`px-6 py-4 border-t flex flex-col sm:flex-row justify-end gap-3 ${
          darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={() => onViewExisting(lead.leadId || lead.id)}
            className="w-full sm:w-auto px-4 py-2 bg-[#9A7310] text-white rounded-lg font-medium text-sm hover:bg-[#85620D] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>View Existing Lead</span>
          </button>
          
          <button
            onClick={onCreateAnyway}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              darkMode ? 'bg-[#181D26] hover:bg-[#1E2633] text-slate-300 border border-[#262F3D]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Anyway</span>
          </button>
        </div>

      </div>
    </div>
  );
};
