import React, { useEffect } from 'react';

// type: 'success' | 'error' | 'info' (info = a live new-lead/new-task
// notification popup, distinct styling + optionally clickable to deep-link
// straight to that lead/task).
export const NotificationToast = ({ message, title, type = 'success', onClose, onClick, darkMode }) => {
  const duration = type === 'info' ? 7000 : 4000;

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isInfo = type === 'info';

  const iconName = isInfo ? 'notifications_active' : isSuccess ? 'check_circle' : 'error';
  const iconStyle = isInfo
    ? 'bg-amber-950/40 text-amber-400 border border-amber-800/50'
    : isSuccess
      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
      : 'bg-red-950/40 text-red-400 border border-red-800/50';
  const defaultTitle = isInfo ? 'New Notification' : isSuccess ? 'Success' : 'Notice';

  return (
    <div
      onClick={onClick}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-slide-up transition-all max-w-sm ${
        onClick ? 'cursor-pointer hover:shadow-2xl' : ''
      } ${darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
        <span className="material-symbols-outlined text-[20px]">{iconName}</span>
      </div>
      <div className="min-w-0">
        <h4 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {title || defaultTitle}
        </h4>
        <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="text-slate-400 hover:text-slate-200 ml-2 flex-shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
