import React from 'react';
import aeeroLogo from '../assets/logo/aeero-logo.png';

// The DB/system role (ADMIN/MANAGER/LEAD_FINDER/VIEWER) drives real
// permissions elsewhere and must stay as-is there - this only controls what
// gets displayed here in the sidebar badge. LEAD_FINDER shows as "Counselor"
// for everyone, except Indu who gets the "Sr. Counsellor" title she actually
// holds.
const getRoleDisplayLabel = (user) => {
  if (!user) return 'ADMIN ROLE';
  const role = user.role || 'ADMIN';
  if (role === 'LEAD_FINDER') {
    const isIndu = (user.name || '').toUpperCase().includes('INDU');
    return isIndu ? 'SR. COUNSELLOR' : 'COUNSELOR';
  }
  return `${role} ROLE`;
};

export const Sidebar = ({ currentRoute, setCurrentRoute, mobileOpen, setMobileOpen, onLogout, leadCount, darkMode, onToggleDarkMode, currentUser }) => {
  // Admin or Sr. Counsellor (any of them, not just Indu specifically) -
  // gets the team-wide Follow-up Stage Tracker link.
  const isElevated = ['ADMIN', 'SR_COUNSELLOR'].includes(currentUser?.role?.toUpperCase());
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const sections = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'leads', label: 'Leads', icon: 'view_list', badge: leadCount },
        { id: 'kanban', label: 'Kanban Board', icon: 'view_kanban' },
        { id: 'activities', label: 'Activities', icon: 'pulse' },
        { id: 'tasks', label: 'Tasks', icon: 'check_box' },
        { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
        ...(isElevated ? [{ id: 'followup-tracker', label: 'Follow-up Tracker', icon: 'event_repeat' }] : []),
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        ...(isAdmin ? [{ id: 'users', label: 'Users Management', icon: 'manage_accounts' }] : []),
        { id: 'products', label: 'Products & Services', icon: 'inventory_2' },
        { id: 'customers', label: 'Customers', icon: 'group' },
        { id: 'lead-sources', label: 'Lead Sources', icon: 'share' },
        { id: 'email-templates', label: 'Email Templates', icon: 'description' },
        { id: 'email-triggers', label: 'Email Triggers', icon: 'bolt' },
        ...(isAdmin ? [{ id: 'whatsapp-templates', label: 'WhatsApp Templates', icon: 'forum' }] : []),
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Settings', icon: 'settings' },
        { id: 'system-settings', label: 'System Settings', icon: 'tune' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'about-app', label: 'About App', icon: 'info' },
      ]
    }
  ];

  const handleNavClick = (item) => {
    setCurrentRoute(item.id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Navigation Shell matching exact Screenshot layout with Dark Bronze Gold Theme */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[220px] flex flex-col z-40 transition-transform duration-300 shadow-xl ${
          darkMode ? 'bg-[#3E3100] text-white border-r border-[#574500]' : 'bg-white text-slate-900 border-r border-slate-200'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Brand Header with Profile Badge matching Screenshot */}
        <div className={`p-4 flex flex-col items-center justify-center relative ${
          darkMode ? 'border-b border-[#574500] bg-black/30' : 'border-b border-slate-200 bg-slate-50'
        }`}>
          <div className="w-24 h-24 flex items-center justify-center mb-1">
            <img
              src={aeeroLogo}
              alt="AEERO Logo"
              className="w-full h-full object-contain filter drop-shadow-lg"
              onError={(e) => { e.target.src = 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100087907540113'; }}
            />
          </div>
          <p className={`text-xs font-extrabold leading-tight drop-shadow-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {currentUser ? currentUser.name : 'Admin User 1'}
          </p>
          <span className={`mt-1.5 px-2.5 py-0.5 text-[10px] font-extrabold rounded-md shadow-xs uppercase tracking-wider ${
            darkMode ? 'bg-[#251E00] border border-[#D4AF37]/40 text-[#E2B134]' : 'bg-amber-50 border border-amber-300 text-amber-700'
          }`}>
            {getRoleDisplayLabel(currentUser)}
          </span>

          <button
            onClick={() => setMobileOpen(false)}
            className={`md:hidden absolute right-3 top-3 ${darkMode ? 'text-amber-200 hover:text-white' : 'text-amber-700 hover:text-slate-900'}`}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pt-1 pb-0.5">
                <span className={`text-[10px] font-extrabold tracking-wider uppercase drop-shadow-2xs ${darkMode ? 'text-[#D4AF37]' : 'text-amber-700'}`}>
                  {section.title}
                </span>
              </div>

              {section.items.map((item) => {
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      darkMode
                        ? (isActive ? 'bg-[#6B540A] text-white shadow-md font-extrabold border border-[#D4AF37]/40' : 'text-slate-100 hover:bg-black/25 hover:text-white font-semibold')
                        : (isActive ? 'bg-amber-100 text-slate-900 shadow-sm font-extrabold border border-amber-300' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold')
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[16px] ${
                        darkMode ? (isActive ? 'text-[#F5D061]' : 'text-[#E2B134]') : 'text-amber-600'
                      }`}>
                        {item.icon}
                      </span>
                      <span className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        darkMode
                          ? (isActive ? 'bg-black/60 text-amber-200 border border-amber-500/40' : 'bg-black/40 text-amber-200 border border-amber-500/20')
                          : (isActive ? 'bg-amber-200 text-amber-900 border border-amber-400' : 'bg-amber-100 text-amber-800 border border-amber-300')
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer & Theme Toggle & Sign Out */}
        <div className={`p-3 space-y-1 ${darkMode ? 'border-t border-[#574500] bg-black/20' : 'border-t border-slate-200 bg-slate-50'}`}>
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-xs font-bold cursor-pointer ${
              darkMode ? 'text-slate-100 hover:text-white hover:bg-black/25' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-[18px] ${darkMode ? 'text-[#E2B134]' : 'text-amber-600'}`}>
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span>Dark Mode</span>
            </div>
            <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-extrabold ${
              darkMode ? 'bg-[#D99B00] text-black font-black' : 'bg-amber-100 text-amber-800'
              }`}>
              {darkMode ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold ${
              darkMode ? 'text-slate-100 hover:text-white hover:bg-black/25' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${darkMode ? 'text-[#E2B134]' : 'text-amber-600'}`}>logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
