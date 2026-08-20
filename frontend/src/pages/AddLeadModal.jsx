import React, { useState } from 'react';
import { api } from '../api/client';
import { LEAD_STATUSES, COUNSELORS, LEAD_SOURCES, AVIATION_COURSES } from '../config/constants';

export const AddLeadModal = ({ onClose, onLeadCreated, onDuplicateDetected, currentUser, darkMode }) => {

  const [formData, setFormData] = useState({
    name: '',
    company: 'AEERO',
    jobTitle: 'Student / Aviation Aspirant',
    industry: 'Aviation & Aerospace',
    mobile: '',
    whatsappNumber: '',
    email: '',
    country: 'India',
    city: '',
    state: '',
    address: '',
    interestedCourse: AVIATION_COURSES[0],
    website: '',
    linkedin: '',
    source: 'Meta Ads',
    status: 'NEW',
    priority: 'Medium',
    estimatedValue: '185000',
    currency: 'INR',
    ownerId: currentUser?.name || COUNSELORS[0],
    nextFollowupDate: '',
    lastContactDate: new Date().toISOString().slice(0, 10),
    requirement: '',
    remarks: '',
    tags: []
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
      setErrorMsg("Customer Name and Mobile Number are required.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Pre-check duplicate
      const dupCheck = await api.checkDuplicate({
        mobile: formData.mobile,
        email: formData.email
      });

      if (dupCheck.isDuplicate) {
        setLoading(false);
        onDuplicateDetected(dupCheck.existingLead || dupCheck.match, formData);
        return;
      }

      // Create Lead
      const created = await api.createLead(formData);
      setLoading(false);
      onLeadCreated(created);

    } catch (err) {
      setLoading(false);
      if (err.isDuplicate) {
        onDuplicateDetected(err.existingLead, formData);
      } else {
        setErrorMsg(err.message || "Failed to create lead.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className={`rounded-xl shadow-2xl border w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-300'
      }`}>

        {/* Navy Header */}
        <div className="bg-[#0F2438] text-white px-6 py-3.5 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <h3 className="font-bold text-base tracking-wide">+ Add Lead</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Customer & Company Details Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 pb-1.5 border-b font-bold uppercase tracking-wider text-[11px] ${
              darkMode ? 'border-[#262F3D] text-amber-400' : 'border-slate-200 text-[#0F2438]'
            }`}>
              <span className="material-symbols-outlined text-[18px]">business</span>
              <span>Company & Customer Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Customer / Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourav Sharma"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Company Name</label>
                <input
                  type="text"
                  placeholder="AEERO"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Job Title / Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. 12th Pass / Graduate"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Industry</label>
                <input
                  type="text"
                  placeholder="Aviation & Training"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. Classification Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 pb-1.5 border-b font-bold uppercase tracking-wider text-[11px] ${
              darkMode ? 'border-[#262F3D] text-amber-400' : 'border-slate-200 text-[#0F2438]'
            }`}>
              <span className="material-symbols-outlined text-[18px]">sell</span>
              <span>Classification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lead Source *</label>
                <select
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lead Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {LEAD_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Estimated Value (INR ₹)</label>
                <input
                  type="number"
                  placeholder="185000"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Currency</label>
                <input
                  type="text"
                  readOnly
                  value="INR (₹)"
                  className={`w-full border rounded px-3 py-2 text-xs font-bold ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 3. Assignment & Follow-up Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 pb-1.5 border-b font-bold uppercase tracking-wider text-[11px] ${
              darkMode ? 'border-[#262F3D] text-amber-400' : 'border-slate-200 text-[#0F2438]'
            }`}>
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Assignment & Follow-up</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Assigned Counselor *</label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => handleInputChange('ownerId', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {COUNSELORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Next Follow-Up Date</label>
                <input
                  type="date"
                  value={formData.nextFollowupDate}
                  onChange={(e) => handleInputChange('nextFollowupDate', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Last Contact Date</label>
                <input
                  type="date"
                  value={formData.lastContactDate}
                  onChange={(e) => handleInputChange('lastContactDate', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 4. Location Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 pb-1.5 border-b font-bold uppercase tracking-wider text-[11px] ${
              darkMode ? 'border-[#262F3D] text-amber-400' : 'border-slate-200 text-[#0F2438]'
            }`}>
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>City</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 12, Dwarka"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 5. Additional Information Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 pb-1.5 border-b font-bold uppercase tracking-wider text-[11px] ${
              darkMode ? 'border-[#262F3D] text-amber-400' : 'border-slate-200 text-[#0F2438]'
            }`}>
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Additional Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Products / Course Interested *</label>
                <select
                  value={formData.interestedCourse}
                  onChange={(e) => handleInputChange('interestedCourse', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {AVIATION_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Website</label>
                <input
                  type="text"
                  placeholder="https://"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>LinkedIn URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tags (Comma Separated)</label>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. CPL Batch 2026, Urgent"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                      className={`flex-1 border rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                        darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className={`px-3 py-1.5 rounded text-xs font-bold ${
                        darkMode ? 'bg-[#1E2633] text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      + Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.tags.map(t => (
                        <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-100 text-[#7D610F] border-amber-300'
                        }`}>
                          <span>{t}</span>
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Notes / Counseling Remarks</label>
                <textarea
                  rows="3"
                  placeholder="Enter student counseling remarks..."
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className={`w-full border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`pt-4 border-t flex justify-end items-center gap-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0F2438] hover:bg-[#16385C] text-white font-bold text-xs px-5 py-2.5 rounded shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Saving Lead...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Save</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`font-bold text-xs px-5 py-2.5 rounded transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300 border border-[#262F3D]' : 'bg-slate-600 hover:bg-slate-700 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">close</span>
              <span>Cancel</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
