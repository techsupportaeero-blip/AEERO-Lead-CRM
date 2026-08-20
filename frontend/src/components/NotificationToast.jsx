import React, { useEffect } from 'react';

export const NotificationToast = ({ message, type = 'success', onClose, darkMode }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-slide-up transition-all ${
      darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50' : 'bg-red-950/40 text-red-400 border border-red-800/50'}`}>
        <span className="material-symbols-outlined text-[20px]">
          {isSuccess ? 'check_circle' : 'error'}
        </span>
      </div>
      <div>
        <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {isSuccess ? 'Success' : 'Notice'}
        </h4>
        <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-200 ml-2">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
