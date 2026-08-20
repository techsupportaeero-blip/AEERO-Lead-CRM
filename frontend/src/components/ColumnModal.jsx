import React from 'react';

export const ALL_COLUMNS = [
  { id: 'leadId', label: 'Lead ID', default: true },
  { id: 'name', label: 'Lead Name', default: true },
  { id: 'mobile', label: 'Mobile Number', default: true },
  { id: 'source', label: 'Lead Source', default: true },
  { id: 'interestedCourse', label: 'Interested Course', default: true },
  { id: 'ownerId', label: 'Counselor / Owner', default: true },
  { id: 'priority', label: 'Priority', default: true },
  { id: 'status', label: 'Lead Status', default: true },
  { id: 'createdAt', label: 'Created Date', default: true },
  { id: 'actions', label: 'Actions', default: true },
  // Extended fields
  { id: 'whatsappNumber', label: 'WhatsApp Number', default: false },
  { id: 'email', label: 'Email Address', default: false },
  { id: 'city', label: 'City', default: false },
  { id: 'state', label: 'State', default: false },
  { id: 'age', label: 'Age', default: false },
  { id: 'qualification', label: 'Qualification', default: false },
  { id: 'preferredStudyMode', label: 'Study Mode', default: false },
  { id: 'campaign', label: 'Campaign', default: false },
  { id: 'campaignId', label: 'Campaign ID', default: false },
  { id: 'adSet', label: 'Ad Set', default: false },
  { id: 'adSetId', label: 'Ad Set ID', default: false },
  { id: 'ad', label: 'Ad Name', default: false },
  { id: 'adId', label: 'Ad ID', default: false },
  { id: 'utmSource', label: 'UTM Source', default: false },
  { id: 'utmMedium', label: 'UTM Medium', default: false },
  { id: 'utmCampaign', label: 'UTM Campaign', default: false },
  { id: 'utmContent', label: 'UTM Content', default: false },
  { id: 'utmTerm', label: 'UTM Term', default: false },
];

export const ColumnModal = ({ visibleColumns, setVisibleColumns, onClose, darkMode }) => {
  const toggleColumn = (id) => {
    if (id === 'actions') return; // Cannot hide actions
    if (visibleColumns.includes(id)) {
      if (visibleColumns.length <= 2) return; // Keep at least 2 columns
      setVisibleColumns(visibleColumns.filter(col => col !== id));
    } else {
      setVisibleColumns([...visibleColumns, id]);
    }
  };

  const resetToDefault = () => {
    setVisibleColumns(ALL_COLUMNS.filter(c => c.default).map(c => c.id));
  };

  const selectAll = () => {
    setVisibleColumns(ALL_COLUMNS.map(c => c.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-xl shadow-2xl border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>Column Settings</h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Show or hide columns in the All Leads table view</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Quick Selection Toolbar */}
        <div className={`px-6 py-3 border-b flex justify-between items-center text-xs ${
          darkMode ? 'bg-[#141A23] border-[#262F3D]' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Showing <strong className="text-[#E5A812]">{visibleColumns.length}</strong> of {ALL_COLUMNS.length} fields
          </span>
          <div className="flex gap-3">
            <button onClick={selectAll} className="text-[#E5A812] hover:underline font-medium">
              Select All
            </button>
            <span className={darkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
            <button onClick={resetToDefault} className={`hover:underline font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Reset Default
            </button>
          </div>
        </div>

        {/* Column Checkboxes Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ALL_COLUMNS.map((col) => {
              const isChecked = visibleColumns.includes(col.id);
              const isRequired = col.id === 'actions';
              return (
                <label
                  key={col.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? (darkMode ? 'bg-amber-950/40 border-amber-800/50 text-amber-200' : 'bg-amber-50/60 border-[#D7B967] text-slate-800')
                      : (darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-400 hover:bg-[#1E2633]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')
                  } ${isRequired ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isRequired}
                    onChange={() => toggleColumn(col.id)}
                    className="rounded text-[#9A7310] focus:ring-[#9A7310] h-4 w-4 border-slate-300"
                  />
                  <span className="font-medium">{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
          darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#9A7310] hover:bg-[#85620D] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Apply Columns
          </button>
        </div>

      </div>
    </div>
  );
};
