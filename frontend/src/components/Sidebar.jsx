import React from 'react';
import aeeroLogo from '../assets/logo/aeero-logo.png';

export const Sidebar = ({ currentRoute, setCurrentRoute, mobileOpen, setMobileOpen, onLogout, leadCount, darkMode, onToggleDarkMode, currentUser }) => {
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
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'users', label: 'Users Management', icon: 'manage_accounts' },
        { id: 'products', label: 'Products & Services', icon: 'inventory_2' },
        { id: 'customers', label: 'Customers', icon: 'group' },
        { id: 'lead-sources', label: 'Lead Sources', icon: 'share' },
        { id: 'email-templates', label: 'Email Templates', icon: 'description' },
        { id: 'email-triggers', label: 'Email Triggers', icon: 'bolt' },
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
        className={`fixed top-0 left-0 h-screen w-[220px] bg-[#3E3100] text-white flex flex-col z-40 transition-transform duration-300 shadow-xl border-r border-[#574500] ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Brand Header with Profile Badge matching Screenshot */}
        <div className="p-4 flex flex-col items-center justify-center border-b border-[#574500] relative bg-black/30">
          <div className="w-24 h-24 flex items-center justify-center mb-1">
            <img 
              src={aeeroLogo} 
              alt="AEERO Logo" 
              className="w-full h-full object-contain filter drop-shadow-lg"
              onError={(e) => { e.target.src = 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100087907540113'; }}
            />
          </div>
          <p className="text-xs font-extrabold text-white leading-tight drop-shadow-xs">
            {currentUser ? currentUser.name : 'Admin User 1'}
          </p>
          <span className="mt-1.5 px-2.5 py-0.5 bg-[#251E00] border border-[#D4AF37]/40 text-[#E2B134] text-[10px] font-extrabold rounded-md shadow-xs uppercase tracking-wider">
            {currentUser ? `${currentUser.role || 'ADMIN'} ROLE` : 'ADMIN ROLE'}
          </span>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute right-3 top-3 text-amber-200 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pt-1 pb-0.5">
                <span className="text-[10px] font-extrabold text-[#D4AF37] tracking-wider uppercase drop-shadow-2xs">
                  {section.title}
                </span>
              </div>

              {section.items.map((item) => {
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive
                        ? 'bg-[#6B540A] text-white shadow-md font-extrabold border border-[#D4AF37]/40'
                        : 'text-slate-100 hover:bg-black/25 hover:text-white font-semibold'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[16px] ${isActive ? 'text-[#F5D061]' : 'text-[#E2B134]'}`}>
                        {item.icon}
                      </span>
                      <span className="text-slate-100 font-bold">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-black/60 text-amber-200 border border-amber-500/40' : 'bg-black/40 text-amber-200 border border-amber-500/20'
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
        <div className="p-3 border-t border-[#574500] bg-black/20 space-y-1">
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-1.5 text-slate-100 hover:text-white hover:bg-black/25 rounded-lg transition-colors text-xs font-bold cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#E2B134] text-[18px]">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span>Dark Mode</span>
            </div>
            <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-extrabold ${darkMode ? 'bg-[#D99B00] text-black font-black' : 'bg-black/40 text-amber-200'
              }`}>
              {darkMode ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-100 hover:text-white hover:bg-black/25 rounded-lg transition-colors text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[#E2B134] text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
