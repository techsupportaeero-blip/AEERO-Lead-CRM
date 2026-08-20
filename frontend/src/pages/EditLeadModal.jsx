import React, { useState } from 'react';
import { api } from '../api/client';
import { LEAD_STATUSES, COUNSELORS, LEAD_SOURCES, AVIATION_COURSES, getStatusCode } from '../config/constants';

export const EditLeadModal = ({ lead, onClose, onLeadUpdated, darkMode }) => {
  const [activeTab, setActiveTab] = useState('basic');

  let parsedTags = [];
  try {
    parsedTags = typeof lead.tags === 'string' ? JSON.parse(lead.tags || '[]') : (lead.tags || []);
  } catch(e) {}

  const [formData, setFormData] = useState({
    name: lead.name || '',
    mobile: lead.mobile || '',
    whatsappNumber: lead.whatsappNumber || '',
    email: lead.email || '',
    city: lead.city || '',
    state: lead.state || '',
    age: lead.age || '',
    qualification: lead.qualification || '',
    interestedCourse: lead.interestedCourse || AVIATION_COURSES[0],
    preferredStudyMode: lead.preferredStudyMode || 'Offline',
    source: lead.source || 'Meta Ads',
    campaign: lead.campaign || '',
    campaignId: lead.campaignId || '',
    adSet: lead.adSet || '',
    adSetId: lead.adSetId || '',
    ad: lead.ad || '',
    adId: lead.adId || '',
    utmSource: lead.utmSource || '',
    utmMedium: lead.utmMedium || '',
    utmCampaign: lead.utmCampaign || '',
    utmContent: lead.utmContent || '',
    utmTerm: lead.utmTerm || '',
    ownerId: lead.ownerId || COUNSELORS[0],
    status: getStatusCode(lead.status),
    priority: lead.priority || 'Medium',
    tags: parsedTags
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setErrorMsg("Name and Mobile number are required.");
      return;
    }

    try {
      setLoading(true);
      const updated = await api.updateLead(lead.leadId || lead.id, formData);
      setLoading(false);
      onLeadUpdated(updated);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to update lead.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-xl shadow-2xl border w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-[#D7B967] flex items-center justify-center border border-[#D7B967]/30">
              <span className="material-symbols-outlined text-[24px]">edit</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-tight">Edit Lead Information</h2>
                <span className="font-mono text-xs font-bold text-[#D7B967] bg-white/10 px-2 py-0.5 rounded">
                  {lead.leadId}
                </span>
              </div>
              <p className="text-xs text-slate-400">Created: {new Date(lead.createdAt || Date.now()).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b px-6 flex gap-2 overflow-x-auto text-xs font-semibold ${
          darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-100 border-slate-200'
        }`}>
          {[
            { id: 'basic', label: 'Basic Info', icon: 'person' },
            { id: 'course', label: 'Course Interest', icon: 'school' },
            { id: 'marketing', label: 'Source & Marketing', icon: 'campaign' },
            { id: 'management', label: 'Management & Tags', icon: 'manage_accounts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? (darkMode ? 'border-[#D7B967] text-[#D7B967] bg-[#181D26] font-bold' : 'border-[#9A7310] text-[#9A7310] bg-white font-bold')
                  : (darkMode ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-900')
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <h3 className={`font-bold text-sm border-b pb-2 ${darkMode ? 'text-white border-[#262F3D]' : 'text-slate-800 border-slate-200'}`}>Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lead ID (Read-only)</label>
                  <input type="text" readOnly value={lead.leadId} className={`w-full border rounded-lg py-2 px-3 text-xs font-mono font-bold cursor-not-allowed ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-700'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Mobile Number *</label>
                  <input type="text" required value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>WhatsApp Number</label>
                  <input type="text" value={formData.whatsappNumber} onChange={(e) => handleInputChange('whatsappNumber', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>City</label>
                  <input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>State</label>
                  <input type="text" value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Age</label>
                  <input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Educational Qualification</label>
                  <input type="text" value={formData.qualification} onChange={(e) => handleInputChange('qualification', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'course' && (
            <div className="space-y-4">
              <h3 className={`font-bold text-sm border-b pb-2 ${darkMode ? 'text-white border-[#262F3D]' : 'text-slate-800 border-slate-200'}`}>Course Information</h3>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Interested Course</label>
                <select value={formData.interestedCourse} onChange={(e) => handleInputChange('interestedCourse', e.target.value)} className={`w-full border rounded-lg py-2.5 px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-[#9A7310] ${
                  darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}>
                  {AVIATION_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Preferred Study Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Online', 'Offline', 'Hybrid', 'Not Specified'].map(mode => (
                    <label key={mode} className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formData.preferredStudyMode === mode
                        ? (darkMode ? 'bg-amber-950/40 border-amber-800 text-amber-300 font-bold' : 'bg-amber-50 border-[#9A7310] text-[#9A7310] font-bold')
                        : (darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                    }`}>
                      <input type="radio" name="editPreferredStudyMode" value={mode} checked={formData.preferredStudyMode === mode} onChange={(e) => handleInputChange('preferredStudyMode', e.target.value)} />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="space-y-4">
              <h3 className={`font-bold text-sm border-b pb-2 ${darkMode ? 'text-white border-[#262F3D]' : 'text-slate-800 border-slate-200'}`}>Source & Marketing Data</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lead Source</label>
                  <select value={formData.source} onChange={(e) => handleInputChange('source', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#9A7310] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}>
                    {LEAD_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                  </select>
                </div>
                <div><label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Campaign</label><input type="text" value={formData.campaign} onChange={(e) => handleInputChange('campaign', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
                <div><label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Campaign ID</label><input type="text" value={formData.campaignId} onChange={(e) => handleInputChange('campaignId', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
                <div><label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Ad Set</label><input type="text" value={formData.adSet} onChange={(e) => handleInputChange('adSet', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
                <div><label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Ad Set ID</label><input type="text" value={formData.adSetId} onChange={(e) => handleInputChange('adSetId', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'}`} /></div>
              </div>
            </div>
          )}

          {activeTab === 'management' && (
            <div className="space-y-4">
              <h3 className={`font-bold text-sm border-b pb-2 ${darkMode ? 'text-white border-[#262F3D]' : 'text-slate-800 border-slate-200'}`}>Management & Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Counselor / Owner</label>
                  <select value={formData.ownerId} onChange={(e) => handleInputChange('ownerId', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs font-medium ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'
                  }`}>
                    {COUNSELORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Status</label>
                  <select value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs font-medium ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'
                  }`}>
                    {LEAD_STATUSES.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Priority</label>
                  <select value={formData.priority} onChange={(e) => handleInputChange('priority', e.target.value)} className={`w-full border rounded-lg py-2 px-3 text-xs font-medium ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'
                  }`}>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tags</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)} className={`flex-1 border rounded-lg py-1.5 px-3 text-xs ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300'
                  }`} />
                  <button type="button" onClick={handleAddTag} className="px-3 py-1.5 bg-[#9A7310] hover:bg-[#85620D] text-white rounded-lg text-xs font-semibold">Add</button>
                </div>
                <div className={`flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border ${
                  darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
                }`}>
                  {formData.tags.map(t => (
                    <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs font-semibold ${
                      darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-100 text-[#9A7310] border-[#D7B967]'
                    }`}>
                      <span>{t}</span>
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400"><span className="material-symbols-outlined text-[14px]">close</span></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
          darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            darkMode ? 'bg-[#181D26] hover:bg-[#1E2633] text-slate-300 border border-[#262F3D]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-[#9A7310] hover:bg-[#85620D] text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2">
            {loading ? <span>Updating...</span> : <span>SAVE CHANGES</span>}
          </button>
        </div>

      </div>
    </div>
  );
};
