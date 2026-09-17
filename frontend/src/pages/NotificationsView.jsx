import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

// Full-page counterpart to the Header bell's dropdown - same data and
// deep-link behavior, just a complete list instead of a capped preview.
export const NotificationsView = ({ currentUser, onNavigateRoute, onSelectLead, darkMode }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.id]);

  const loadNotifications = async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const list = await api.getNotifications(currentUser.id);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      // Non-critical: list just stays empty if this fails
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const visible = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try { await api.markNotificationRead(notif.id); } catch {}
    }

    // Same deep-link convention as the Header bell: leadId is embedded in
    // the message text (e.g. "... (LD-001564) ...").
    if (notif.type === 'task' && onNavigateRoute) {
      onNavigateRoute('tasks');
    } else if (notif.type === 'lead') {
      const match = notif.message?.match(/\(([A-Za-z]{1,4}-\d+)\)/);
      if (match && onSelectLead) {
        onSelectLead(match[1]);
      } else if (onNavigateRoute) {
        onNavigateRoute('leads');
      }
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await Promise.all(unread.map(n => api.markNotificationRead(n.id).catch(() => {})));
  };

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-xl border shadow-xs transition-colors ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">notifications</span>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">{unreadCount} unread</span>
          )}
        </h2>

        <div className="flex items-center gap-2">
          <div className={`flex items-center rounded-lg border overflow-hidden text-xs font-semibold ${darkMode ? 'border-[#574719]' : 'border-slate-200'}`}>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 transition-colors ${filter === 'all' ? 'bg-[#9A7310] text-white' : darkMode ? 'bg-[#1A1608] text-slate-300 hover:bg-[#3D3212]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 transition-colors ${filter === 'unread' ? 'bg-[#9A7310] text-white' : darkMode ? 'bg-[#1A1608] text-slate-300 hover:bg-[#3D3212]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Unread
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className={`rounded-xl border shadow-xs overflow-hidden transition-colors ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <span className="material-symbols-outlined text-3xl animate-spin text-slate-500">sync</span>
          </div>
        ) : visible.length === 0 ? (
          <div className={`py-16 text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-4xl mb-2 block">notifications_off</span>
            <p className="text-sm font-medium">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className={`divide-y ${darkMode ? 'divide-[#3D3212]' : 'divide-slate-100'}`}>
            {visible.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left px-5 py-3.5 transition-colors flex items-start gap-3 ${
                  darkMode ? 'hover:bg-[#3D3212]' : 'hover:bg-slate-50'
                } ${!notif.isRead ? (darkMode ? 'bg-[#2A220C]' : 'bg-amber-50/50') : ''}`}
              >
                {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#E5A812] mt-1.5 flex-shrink-0" />}
                {notif.isRead && <span className="w-2 h-2 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{notif.title}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                  <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(notif.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
