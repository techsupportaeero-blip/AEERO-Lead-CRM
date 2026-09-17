import React, { useState } from 'react';

export const SettingsView = ({ currentUser, onNotify, darkMode }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: 'person' },
    { id: 'preferences', label: 'Preferences', icon: 'tune' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  return (
    <div className={`space-y-6 font-sans transition-colors min-h-[80vh] ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Page Title */}
      <div className={`flex justify-between items-center p-5 rounded-2xl border shadow-lg transition-colors ${
        darkMode ? 'bg-[#151C24] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`font-extrabold text-2xl flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#7D610F] shadow-inner">
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </div>
          <span>Account Settings</span>
        </h2>
        <button
          onClick={() => onNotify && onNotify("Settings saved successfully!")}
          className="bg-[#7D610F] hover:bg-[#5D4709] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className={`lg:col-span-1 rounded-2xl border shadow-lg p-4 space-y-2 transition-colors h-fit ${
          darkMode ? 'bg-[#151C24] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${
                activeTab === tab.id 
                  ? (darkMode ? 'bg-[#2A220C] text-[#E2B134] border border-[#574719]' : 'bg-amber-50 text-[#7D610F] border border-amber-200')
                  : (darkMode ? 'text-slate-400 hover:bg-[#1A222C] hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800')
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={`lg:col-span-3 rounded-2xl border shadow-lg p-6 md:p-8 transition-colors ${
          darkMode ? 'bg-[#151C24] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold border-4 shadow-xl ${
                    darkMode ? 'bg-[#0A0D14] border-[#2A220C] text-[#E2B134]' : 'bg-amber-100 border-white text-[#7D610F]'
                  }`}>
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-600 transition-colors shadow-lg">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                </div>
                <div>
                  <h3 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {currentUser?.name || 'Administrator'}
                  </h3>
                  <p className={`text-sm font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentUser?.email || 'admin@aeero.com'}
                  </p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {currentUser?.role || 'Admin'} Role
                  </span>
                </div>
              </div>

              <div className={`border-t pt-8 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={currentUser?.name || 'Administrator'}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                        darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={currentUser?.email || 'admin@aeero.com'}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                        darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                        darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Department</label>
                    <select className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    }`}>
                      <option>Sales & Marketing</option>
                      <option>Counseling</option>
                      <option>Administration</option>
                      <option>Support</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Display Preferences</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customize how the CRM looks and behaves for you.</p>
              </div>

              <div className="space-y-6">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Compact Table View</h4>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Show more rows per page by reducing row padding.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                  </label>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Auto-Refresh Dashboard</h4>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Automatically fetch new leads every 5 minutes.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                  </label>
                </div>
                
                <div className="space-y-2 pt-4">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Timezone</label>
                  <select className={`w-full max-w-md px-4 py-3 rounded-xl border outline-none font-semibold ${
                    darkMode ? 'bg-[#0A0D14] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <option>(GMT+05:30) India Standard Time - Kolkata</option>
                    <option>(GMT+00:00) Greenwich Mean Time - London</option>
                    <option>(GMT-05:00) Eastern Time - New York</option>
                    <option>(GMT-08:00) Pacific Time - Los Angeles</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Password & Security</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage your password and security settings.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 max-w-md">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                </div>
                <div className="space-y-2 max-w-md">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                </div>
                <div className="space-y-2 max-w-md">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    }`}
                  />
                </div>
                <button className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
                  Update Password
                </button>
              </div>

              <div className={`border-t pt-8 mt-8 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <h4 className={`font-extrabold text-lg mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Two-Factor Authentication</h4>
                <div className={`flex items-center justify-between p-5 rounded-xl border ${darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-amber-50 border-amber-200'}`}>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-[#E2B134]' : 'text-[#7D610F]'}`}>Enable 2FA</h4>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Add an extra layer of security to your account.</p>
                  </div>
                  <button className="bg-[#7D610F] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-[#5D4709] transition-colors">
                    Setup 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notification Alerts</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Choose what updates you want to receive.</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'New Lead Assigned', desc: 'Get notified when a new lead is assigned to you.' },
                  { title: 'Task Reminders', desc: 'Receive reminders for upcoming tasks and follow-ups.' },
                  { title: 'System Updates', desc: 'Announcements about CRM updates and maintenance.' },
                  { title: 'Daily Report', desc: 'Receive a daily summary of your team\'s performance.' },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
};
