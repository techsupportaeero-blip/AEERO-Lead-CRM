import React from 'react';

export const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Yes, Proceed",
  cancelText = "Cancel",
  type = "warning", // 'warning', 'danger', 'info'
  onConfirm,
  onClose,
  darkMode
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  const iconName = isDanger ? 'delete_forever' : isWarning ? 'help' : 'info';
  const iconBg = isDanger ? 'bg-rose-100 text-rose-600 border-rose-200' : isWarning ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-600 border-blue-200';
  const buttonBg = isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white' : isWarning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md p-6 space-y-5 transform transition-all scale-100 ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header with Icon */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <span className="material-symbols-outlined text-[26px]">{iconName}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-extrabold text-base leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{message}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 ${buttonBg}`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
