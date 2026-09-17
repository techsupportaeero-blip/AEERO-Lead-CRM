import React, { useState } from 'react';

export const SystemSettingsView = ({ currentUser, onNotify, darkMode }) => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Company Profile', icon: 'business' },
    { id: 'branding', label: 'Branding & UI', icon: 'palette' },
    { id: 'integrations', label: 'Integrations', icon: 'api' },
    { id: 'backup', label: 'Data Backup', icon: 'cloud_sync' },
  ];

  return (
    <div className={`space-y-6 font-sans transition-colors min-h-[80vh] ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Page Title */}
      <div className={`flex justify-between items-center p-5 rounded-2xl border shadow-lg transition-colors ${
        darkMode ? 'bg-[#151C24] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`font-extrabold text-2xl flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 shadow-inner">
            <span className="material-symbols-outlined text-[24px]">tune</span>
          </div>
          <span>System Settings</span>
        </h2>
        <button
          onClick={() => onNotify && onNotify("System settings updated successfully!")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>Save Configuration</span>
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
                  ? (darkMode ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-800/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200')
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
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Company Profile</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Global information about your organization.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Company Name</label>
                  <input 
                    type="text" 
                    defaultValue="AEERO Technologies"
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Support Email</label>
                  <input 
                    type="email" 
                    defaultValue="support@aeero.com"
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={`block text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Company Address</label>
                  <textarea 
                    rows={3}
                    defaultValue="123 Tech Park, Innovation Drive, Silicon Valley, CA 94000"
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold ${
                      darkMode ? 'bg-[#0A0D14] border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BRANDING TAB */}
          {activeTab === 'branding' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Branding & UI Customization</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Customize the look and feel of your CRM workspace.</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center flex-col gap-2 cursor-pointer transition-colors ${
                    darkMode ? 'border-slate-700 bg-[#0A0D14] hover:border-indigo-500' : 'border-slate-300 bg-slate-50 hover:border-indigo-500'
                  }`}>
                    <span className="material-symbols-outlined text-3xl text-slate-400">add_photo_alternate</span>
                    <span className="text-xs font-bold text-slate-400">Upload Logo</span>
                  </div>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Logo</h4>
                    <p className={`text-xs mt-1 mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recommended size: 256x256px. Supported formats: PNG, JPG, SVG.</p>
                    <button className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95">
                      Remove Current Logo
                    </button>
                  </div>
                </div>

                <div className={`border-t pt-6 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <label className={`block text-xs font-extrabold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Primary Brand Color</label>
                  <div className="flex gap-4">
                    {['#7D610F', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#F97316'].map((color, idx) => (
                      <div 
                        key={idx} 
                        className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${idx === 0 ? 'border-white shadow-lg ring-2 ring-indigo-500' : 'border-transparent shadow-sm'}`}
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-2 border-dashed ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">add</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Integrations & APIs</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Connect AEERO CRM with third-party tools.</p>
                </div>
                <button className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200">
                  + Add Webhook
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Meta (Facebook) Leads', status: 'Connected', icon: 'public', desc: 'Sync leads automatically from Facebook & Instagram Ads.' },
                  { name: 'Google Sheets', status: 'Connected', icon: 'grid_on', desc: 'Two-way sync with Google Sheets for backup and external reporting.' },
                  { name: 'WhatsApp Business API', status: 'Disconnected', icon: 'chat', desc: 'Send automated WhatsApp messages to new leads.' },
                  { name: 'Zapier Webhooks', status: 'Disconnected', icon: 'webhook', desc: 'Connect to 5000+ apps via Zapier.' },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-5 rounded-xl border ${darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-[#151C24] border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'}`}>
                        <span className="material-symbols-outlined text-indigo-500">{item.icon}</span>
                      </div>
                      <div>
                        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        item.status === 'Connected' 
                          ? (darkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                          : (darkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-600 border border-slate-300')
                      }`}>
                        {item.status}
                      </span>
                      <button className="text-slate-400 hover:text-indigo-500 transition-colors">
                        <span className="material-symbols-outlined">settings</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BACKUP TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className={`text-xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Data Backup & Export</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage system backups and data retention policies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined">cloud_download</span>
                  </div>
                  <h4 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Manual Full Backup</h4>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Download a complete backup of all CRM data including leads, activities, and user data in CSV/JSON format.
                  </p>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95">
                    Generate New Backup
                  </button>
                  <p className={`text-xs mt-3 text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Last backup: Today at 2:00 AM</p>
                </div>

                <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined">delete_forever</span>
                  </div>
                  <h4 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Data Retention</h4>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure how long deleted leads are kept in the trash before being permanently removed from servers.
                  </p>
                  <select className={`w-full px-4 py-2.5 rounded-lg border outline-none font-semibold ${
                    darkMode ? 'bg-[#151C24] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}>
                    <option>Keep for 30 days (Recommended)</option>
                    <option>Keep for 90 days</option>
                    <option>Keep indefinitely</option>
                    <option>Delete immediately</option>
                  </select>
                </div>
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
