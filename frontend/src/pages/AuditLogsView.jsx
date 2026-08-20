import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';

export const AuditLogsView = ({ onSelectLead, onNotify, darkMode }) => {
  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('user_pulse'); // 'user_pulse' | 'event_stream'
  const [selectedUser, setSelectedUser] = useState(null); // User object for detail modal
  const [modalSearch, setModalSearch] = useState('');
  const [modalActionFilter, setModalActionFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, usersData] = await Promise.all([
        api.getAuditLogs().catch(() => []),
        api.getUsers().catch(() => [])
      ]);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setUsersList(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to load audit pulse data:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Human friendly relative time formatter
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Friendly Action Label and Color Mapper
  const getActionBadge = (action = '') => {
    const act = String(action).toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('REGISTER')) {
      return {
        label: action.replace(/_/g, ' '),
        icon: 'add_circle',
        color: darkMode ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
    }
    if (act.includes('STATUS') || act.includes('TRANSITION') || act.includes('STAGE')) {
      return {
        label: action.replace(/_/g, ' '),
        icon: 'swap_horiz',
        color: darkMode ? 'bg-amber-900/40 text-amber-300 border-amber-700/50' : 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }
    if (act.includes('CALL') || act.includes('PHONE') || act.includes('CONTACT')) {
      return {
        label: action.replace(/_/g, ' '),
        icon: 'phone_in_talk',
        color: darkMode ? 'bg-blue-900/40 text-blue-300 border-blue-700/50' : 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }
    if (act.includes('NOTE') || act.includes('REMARK') || act.includes('COMMENT')) {
      return {
        label: action.replace(/_/g, ' '),
        icon: 'edit_note',
        color: darkMode ? 'bg-purple-900/40 text-purple-300 border-purple-700/50' : 'bg-purple-100 text-purple-800 border-purple-200'
      };
    }
    if (act.includes('DELETE') || act.includes('ARCHIVE') || act.includes('REMOVE')) {
      return {
        label: action.replace(/_/g, ' '),
        icon: 'delete',
        color: darkMode ? 'bg-rose-900/40 text-rose-300 border-rose-700/50' : 'bg-rose-100 text-rose-800 border-rose-200'
      };
    }
    if (act.includes('PAYMENT') || act.includes('FEE') || act.includes('TRANSACTION')) {
      return {
        label: action.replace(/_/g, ' '),
        icon: 'payments',
        color: darkMode ? 'bg-teal-900/40 text-teal-300 border-teal-700/50' : 'bg-teal-100 text-teal-800 border-teal-200'
      };
    }
    return {
      label: action.replace(/_/g, ' ') || 'SYSTEM ACTION',
      icon: 'bolt',
      color: darkMode ? 'bg-slate-800/60 text-slate-300 border-slate-600/50' : 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  // Group and Aggregate Audit Logs per User / Actor
  const userPulseList = useMemo(() => {
    const map = new Map();

    // First, register all known system users
    usersList.forEach(u => {
      const uName = u.name || u.username;
      map.set(uName, {
        userName: uName,
        role: u.role || 'Counselor',
        email: u.email || '',
        avatarInitial: (uName || 'U').charAt(0).toUpperCase(),
        logs: [],
        latestLog: null,
        totalActivities: 0
      });
    });

    // Also ensure System user exists
    if (!map.has('System')) {
      map.set('System', {
        userName: 'System',
        role: 'Automated Bot / Database',
        email: 'system@aeero.internal',
        avatarInitial: '⚡',
        logs: [],
        latestLog: null,
        totalActivities: 0
      });
    }

    // Now aggregate each log into its respective user
    logs.forEach(log => {
      const actor = log.user || 'System';
      if (!map.has(actor)) {
        map.set(actor, {
          userName: actor,
          role: actor.includes('API') || actor.includes('Integration') ? 'API Integration' : 'Team Member',
          email: `${actor.toLowerCase().replace(/[^a-z0-9]/g, '')}@aeero.internal`,
          avatarInitial: (actor || 'A').charAt(0).toUpperCase(),
          logs: [],
          latestLog: null,
          totalActivities: 0
        });
      }

      const userEntry = map.get(actor);
      userEntry.logs.push(log);
      userEntry.totalActivities += 1;
      
      // Track latest log
      if (!userEntry.latestLog) {
        userEntry.latestLog = log;
      } else {
        const currTime = new Date(log.timestamp || 0).getTime();
        const latestTime = new Date(userEntry.latestLog.timestamp || 0).getTime();
        if (currTime > latestTime || (currTime === latestTime && log.id > userEntry.latestLog.id)) {
          userEntry.latestLog = log;
        }
      }
    });

    // Sort logs inside each user by timestamp descending
    const list = Array.from(map.values()).map(entry => {
      entry.logs.sort((a, b) => {
        const tA = new Date(a.timestamp || 0).getTime();
        const tB = new Date(b.timestamp || 0).getTime();
        return tB !== tA ? tB - tA : (b.id || 0) - (a.id || 0);
      });
      if (entry.logs.length > 0) {
        entry.latestLog = entry.logs[0];
      }
      return entry;
    });

    // Sort user list so users with most recent activities appear on top
    list.sort((a, b) => {
      const timeA = a.latestLog ? new Date(a.latestLog.timestamp || 0).getTime() : 0;
      const timeB = b.latestLog ? new Date(b.latestLog.timestamp || 0).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [logs, usersList]);

  // Filtered users for search query
  const filteredUserPulse = useMemo(() => {
    if (!searchQuery.trim()) return userPulseList;
    const q = searchQuery.toLowerCase();
    return userPulseList.filter(u => 
      u.userName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.latestLog && (
        String(u.latestLog.action).toLowerCase().includes(q) ||
        String(u.latestLog.entity).toLowerCase().includes(q) ||
        String(u.latestLog.entityId).toLowerCase().includes(q)
      ))
    );
  }, [userPulseList, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalUsers = userPulseList.length;
    const activeUsersCount = userPulseList.filter(u => u.totalActivities > 0).length;
    const totalLogsCount = logs.length;
    
    // Most active counselor
    const nonSystemUsers = userPulseList.filter(u => u.userName !== 'System');
    const topUser = nonSystemUsers.length > 0 
      ? nonSystemUsers.reduce((max, u) => u.totalActivities > max.totalActivities ? u : max, nonSystemUsers[0])
      : null;

    return {
      totalUsers,
      activeUsersCount,
      totalLogsCount,
      topUserName: topUser && topUser.totalActivities > 0 ? `${topUser.userName} (${topUser.totalActivities} acts)` : 'N/A'
    };
  }, [userPulseList, logs]);

  // Filtered logs inside selected user modal
  const modalFilteredLogs = useMemo(() => {
    if (!selectedUser) return [];
    let list = selectedUser.logs || [];
    
    if (modalActionFilter !== 'All') {
      list = list.filter(l => String(l.action).toUpperCase().includes(modalActionFilter.toUpperCase()));
    }
    
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      list = list.filter(l => 
        String(l.action).toLowerCase().includes(q) ||
        String(l.entity).toLowerCase().includes(q) ||
        String(l.entityId).toLowerCase().includes(q) ||
        String(l.newValue || '').toLowerCase().includes(q) ||
        String(l.oldValue || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedUser, modalSearch, modalActionFilter]);

  const handleEntityClick = (entity, entityId) => {
    if (entityId && (entityId.startsWith('LD-') || entity === 'LEAD' || entity === 'Lead')) {
      if (onSelectLead) {
        onSelectLead(entityId);
      }
    }
  };

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Top Banner Header */}
      <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className="material-symbols-outlined text-[#E5A812]">pulse</span>
              <span>Team Activity Pulse & Real-Time Presence</span>
            </h2>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Live consolidated user activity board — track real-time entity updates, latest actions, and drill into complete user traces on click.
          </p>
        </div>

        {/* View Mode Switch & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex rounded-xl p-1 border text-xs font-semibold ${
            darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('user_pulse')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'user_pulse'
                  ? (darkMode ? 'bg-[#E5A812] text-black font-bold shadow-xs' : 'bg-[#7D610F] text-white font-bold shadow-xs')
                  : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>User Pulse ({userPulseList.length})</span>
            </button>
            <button
              onClick={() => setViewMode('event_stream')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'event_stream'
                  ? (darkMode ? 'bg-[#E5A812] text-black font-bold shadow-xs' : 'bg-[#7D610F] text-white font-bold shadow-xs')
                  : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
              <span>Raw Stream ({logs.length})</span>
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh Live Audit Trace"
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300 border-[#262F3D]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        
        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Counselors</span>
            <span className="material-symbols-outlined text-blue-500 text-lg">badge</span>
          </div>
          <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{metrics.totalUsers}</p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">{metrics.activeUsersCount} active with logs</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Trace Events</span>
            <span className="material-symbols-outlined text-amber-500 text-lg">history_edu</span>
          </div>
          <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{metrics.totalLogsCount}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Immutable audit logs</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Top Active Member</span>
            <span className="material-symbols-outlined text-emerald-500 text-lg">military_tech</span>
          </div>
          <p className={`text-sm md:text-base font-bold truncate mt-1.5 ${darkMode ? 'text-amber-300' : 'text-[#7D610F]'}`}>
            {metrics.topUserName}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Most actions performed</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sync Status</span>
            <span className="material-symbols-outlined text-purple-500 text-lg">wifi_tethering</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Real-Time Active</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Auto-updates on action</p>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className={`p-3.5 rounded-xl border shadow-xs flex items-center justify-between gap-3 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'user_pulse' ? "Search users, actions, or entity ID..." : "Filter raw event stream..."}
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border outline-none transition-colors ${
              darkMode 
                ? 'bg-[#12161F] border-[#262F3D] text-slate-200 placeholder-slate-500 focus:border-[#E5A812]' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#7D610F]'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-400 hidden sm:block">
          {viewMode === 'user_pulse' 
            ? `Showing ${filteredUserPulse.length} of ${userPulseList.length} Team Members`
            : `Showing ${logs.length} Log Entries`
          }
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. USER PULSE VIEW (1 ROW PER USER WITH LATEST ACTION & TIMESTAMP)        */}
      {/* ========================================================================= */}
      {viewMode === 'user_pulse' && (
        <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <span className="material-symbols-outlined text-[36px] animate-spin text-[#E5A812]">sync</span>
              <p className="text-xs font-semibold mt-2">Consolidating team presence & activity pulse...</p>
            </div>
          ) : filteredUserPulse.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <span className="material-symbols-outlined text-[36px] text-slate-300 mb-1">person_search</span>
              <p className="text-xs font-medium">No team members match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0F2438] text-white font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">User / Counselor</th>
                    <th className="py-3 px-4">Latest Action</th>
                    <th className="py-3 px-4">Entity & Entity ID</th>
                    <th className="py-3 px-4">Last Activity Time</th>
                    <th className="py-3 px-4 text-center">Total Activities</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                  {filteredUserPulse.map(user => {
                    const badge = getActionBadge(user.latestLog?.action || '');
                    const hasActivity = user.totalActivities > 0;
                    
                    return (
                      <tr 
                        key={user.userName} 
                        onClick={() => setSelectedUser(user)}
                        className={`cursor-pointer transition-all ${
                          darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-amber-50/40'
                        }`}
                        title="Click to view all activity details for this user"
                      >
                        {/* User Identity Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 border shadow-xs ${
                              user.userName === 'System'
                                ? (darkMode ? 'bg-purple-950/60 text-purple-300 border-purple-800/40' : 'bg-purple-100 text-purple-700 border-purple-200')
                                : (darkMode ? 'bg-amber-950/50 text-amber-300 border-amber-800/40' : 'bg-amber-100 text-[#7D610F] border-amber-200')
                            }`}>
                              {user.avatarInitial}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {user.userName}
                                </span>
                                {hasActivity && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active user"></span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {user.role} {user.email ? `• ${user.email}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Latest Action Badge */}
                        <td className="py-3.5 px-4">
                          {hasActivity ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                              <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                              <span className="capitalize">{badge.label.toLowerCase()}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No activity recorded yet</span>
                          )}
                        </td>

                        {/* Latest Entity ID */}
                        <td className="py-3.5 px-4 font-medium">
                          {hasActivity && user.latestLog ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {user.latestLog.entity || 'LOG'}
                              </span>
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEntityClick(user.latestLog.entity, user.latestLog.entityId);
                                }}
                                className={`font-mono font-bold text-xs ${
                                  user.latestLog.entityId?.startsWith('LD-')
                                    ? (darkMode ? 'text-[#E5A812] hover:underline cursor-pointer' : 'text-[#7D610F] hover:underline cursor-pointer')
                                    : (darkMode ? 'text-slate-200' : 'text-slate-800')
                                }`}
                                title={user.latestLog.entityId?.startsWith('LD-') ? "Open Lead Workspace" : ""}
                              >
                                {user.latestLog.entityId || '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Timestamp with Relative Live Display */}
                        <td className="py-3.5 px-4">
                          {hasActivity && user.latestLog ? (
                            <div>
                              <div className={`font-bold flex items-center gap-1 text-xs ${
                                darkMode ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                                <span>{formatTimeAgo(user.latestLog.timestamp)}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {user.latestLog.timestamp ? new Date(user.latestLog.timestamp).toLocaleString('en-IN') : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Never</span>
                          )}
                        </td>

                        {/* Total Activities Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black border ${
                            user.totalActivities > 0
                              ? (darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-[#7D610F] border-amber-200')
                              : (darkMode ? 'bg-slate-800/40 text-slate-500 border-slate-700/40' : 'bg-slate-50 text-slate-400 border-slate-200')
                          }`}>
                            {user.totalActivities} {user.totalActivities === 1 ? 'Action' : 'Actions'}
                          </span>
                        </td>

                        {/* Drilldown Button */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto border transition-all ${
                              darkMode
                                ? 'bg-[#12161F] hover:bg-[#E5A812] hover:text-black text-slate-200 border-[#262F3D]'
                                : 'bg-slate-100 hover:bg-[#7D610F] hover:text-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>View Trace</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RAW EVENT STREAM VIEW (CHRONOLOGICAL EVENT LOGS)                       */}
      {/* ========================================================================= */}
      {viewMode === 'event_stream' && (
        <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-[36px] animate-spin text-[#E5A812]">sync</span>
              <p className="text-xs font-semibold mt-2">Loading audit log stream...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-xs font-medium">No audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0F2438] text-white font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">User / Actor</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4">Details / Metadata</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                  {logs
                    .filter(log => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        String(log.user).toLowerCase().includes(q) ||
                        String(log.action).toLowerCase().includes(q) ||
                        String(log.entity).toLowerCase().includes(q) ||
                        String(log.entityId).toLowerCase().includes(q) ||
                        String(log.newValue || '').toLowerCase().includes(q)
                      );
                    })
                    .map(log => {
                      const badge = getActionBadge(log.action);
                      return (
                        <tr key={log.id} className={`transition-colors ${
                          darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50'
                        }`}>
                          <td className="py-3 px-4 font-mono text-slate-500 font-bold">
                            #{log.id}
                          </td>
                          <td className={`py-3 px-4 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {log.user || 'System'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                              <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                              <span>{log.action}</span>
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {log.entity}
                          </td>
                          <td className="py-3 px-4">
                            <span 
                              onClick={() => handleEntityClick(log.entity, log.entityId)}
                              className={`font-mono font-bold ${
                                log.entityId?.startsWith('LD-')
                                  ? (darkMode ? 'text-[#E5A812] hover:underline cursor-pointer' : 'text-[#7D610F] hover:underline cursor-pointer')
                                  : (darkMode ? 'text-slate-200' : 'text-slate-800')
                              }`}
                            >
                              {log.entityId || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-500 text-[11px]">
                            {log.newValue || log.oldValue || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '-'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. USER DRILL-DOWN MODAL: SARI DETAILS JO US USER NE KARI HAI              */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
              darkMode ? 'bg-[#151B24] border-[#262F3D] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between transition-colors ${
              darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shadow-xs ${
                  selectedUser.userName === 'System'
                    ? (darkMode ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200')
                    : (darkMode ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-[#7D610F] border-amber-300')
                }`}>
                  {selectedUser.avatarInitial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedUser.userName}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      darkMode ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-amber-50 text-[#7D610F] border-amber-200'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Complete activity trace — Total {selectedUser.totalActivities} events recorded
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedUser(null);
                  setModalSearch('');
                  setModalActionFilter('All');
                }}
                className={`p-2 rounded-xl border transition-colors ${
                  darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-400 hover:text-white border-[#262F3D]' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Controls & Stats Sub-header */}
            <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
              darkMode ? 'bg-[#12161F]/60 border-[#262F3D]' : 'bg-slate-50/50 border-slate-100'
            }`}>
              {/* Search inside user activities */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[16px]">search</span>
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search in this user's logs..."
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border outline-none ${
                    darkMode 
                      ? 'bg-[#151B24] border-[#262F3D] text-slate-200 focus:border-[#E5A812]' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-[#7D610F]'
                  }`}
                />
              </div>

              {/* Action Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {['All', 'CREATE', 'UPDATE', 'CALL', 'NOTE', 'STATUS'].map(type => (
                  <button
                    key={type}
                    onClick={() => setModalActionFilter(type)}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                      modalActionFilter === type
                        ? (darkMode ? 'bg-[#E5A812] text-black font-bold' : 'bg-[#7D610F] text-white font-bold')
                        : (darkMode ? 'bg-[#181D26] text-slate-400 hover:text-white border border-[#262F3D]' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Activity History List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {modalFilteredLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[32px] text-slate-400 mb-1">history_toggle_off</span>
                  <p className="text-xs font-semibold">No activity logs found matching the filter.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {modalFilteredLogs.map((log, index) => {
                    const badge = getActionBadge(log.action);
                    const isLead = log.entityId && log.entityId.startsWith('LD-');

                    return (
                      <div 
                        key={log.id || index}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          darkMode ? 'bg-[#181D26] border-[#262F3D] hover:border-[#E5A812]/40' : 'bg-white border-slate-200 hover:border-[#7D610F]/40 shadow-xs'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${badge.color}`}>
                            <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {log.action}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {log.entity || 'ENTITY'}
                              </span>
                              <span className="text-slate-400 text-xs font-mono">#{log.id}</span>
                            </div>

                            {/* Details message if available */}
                            {(log.newValue || log.oldValue) && (
                              <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {log.newValue || log.oldValue}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Entity Link & Exact Timestamp */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          {isLead ? (
                            <button
                              onClick={() => {
                                setSelectedUser(null);
                                if (onSelectLead) onSelectLead(log.entityId);
                              }}
                              className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded border transition-all ${
                                darkMode 
                                  ? 'bg-[#E5A812]/10 text-[#E5A812] border-[#E5A812]/30 hover:bg-[#E5A812] hover:text-black' 
                                  : 'bg-amber-50 text-[#7D610F] border-amber-200 hover:bg-[#7D610F] hover:text-white'
                              }`}
                              title="Open this lead in Workspace"
                            >
                              <span>{log.entityId}</span>
                              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                            </button>
                          ) : (
                            <span className={`font-mono text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {log.entityId || '-'}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '-'}
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-between items-center ${
              darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs text-slate-400">
                Showing {modalFilteredLogs.length} events for {selectedUser.userName}
              </span>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setModalSearch('');
                  setModalActionFilter('All');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-200 border border-[#262F3D]' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                Close Trace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
