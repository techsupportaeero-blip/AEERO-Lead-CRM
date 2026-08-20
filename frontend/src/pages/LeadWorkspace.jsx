import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { LEAD_STATUSES, FOLLOWUP_TYPES, getStatusCode } from '../config/constants';

export const LeadWorkspace = ({ leadId, onBack, onEditLead, currentUser, onNotify, darkMode }) => {
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Note State
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  // Call & Update Form State
  const [outcome, setOutcome] = useState('Given Details');
  const [remarks, setRemarks] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('14:00');
  const [followUpType, setFollowUpType] = useState('Call');
  const [updateStatus, setUpdateStatus] = useState('NEW');
  const [savingCall, setSavingCall] = useState(false);

  const callOutcomes = [
    'No Answer', 'Busy', 'Call Declined', 'Switched Off',
    'Out of Network', 'Wrong Number', 'Call Back', 'Given Details',
    'Interested', 'Not Interested', 'Other'
  ];

  useEffect(() => {
    loadLeadData();
  }, [leadId]);

  const loadLeadData = async () => {
    try {
      setLoading(true);
      const data = await api.getLeadById(leadId);
      if (data) {
        setLead(data);
        setUpdateStatus(getStatusCode(data.status || 'NEW'));

        const acts = await api.getActivities(data.leadId);
        setActivities(Array.isArray(acts) ? acts : []);

        const fups = await api.getFollowups(data.leadId);
        setFollowups(Array.isArray(fups) ? fups : []);

        const nts = await api.getNotes(data.leadId);
        setNotes(Array.isArray(nts) ? nts : []);
      }
    } catch (err) {
      console.error("Error loading lead workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      setAddingNote(true);
      await api.addNote(lead.leadId, {
        title: newNoteTitle.trim() || 'General Note',
        content: newNoteContent.trim(),
        isPinned: newNotePinned,
        createdBy: currentUser ? currentUser.name : 'Counselor'
      });
      const freshNotes = await api.getNotes(lead.leadId);
      setNotes(freshNotes);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNotePinned(false);
      setAddingNote(false);
      if (onNotify) onNotify("Note added successfully!");
    } catch (err) {
      setAddingNote(false);
      alert("Failed to add note: " + err.message);
    }
  };

  const handleTogglePin = async (note) => {
    try {
      await api.updateNote(note.noteId, { isPinned: !note.isPinned });
      const freshNotes = await api.getNotes(lead.leadId);
      setNotes(freshNotes);
    } catch (err) {
      alert("Failed to toggle pin");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.deleteNote(noteId);
      const freshNotes = await api.getNotes(lead.leadId);
      setNotes(freshNotes);
    } catch (err) {
      alert("Failed to delete note");
    }
  };

  const handleSaveCallUpdate = async (e) => {
    e.preventDefault();
    if (!remarks.trim() && !outcome) {
      alert("Please enter call remarks or select an outcome.");
      return;
    }

    try {
      setSavingCall(true);
      const res = await api.recordActivity(lead.leadId, {
        outcome,
        remarks: remarks.trim(),
        additionalInformation: additionalInformation.trim(),
        followUpDate: followUpDate || null,
        followUpTime: followUpTime || '10:00',
        followUpType: followUpType || 'Call',
        leadStatus: updateStatus,
        createdBy: currentUser ? currentUser.name : 'Rahul Sharma'
      });

      setLead(res.lead);
      setActivities(res.activities);
      
      if (followUpDate) {
        const freshFups = await api.getFollowups(lead.leadId);
        setFollowups(freshFups);
      }

      setRemarks('');
      setAdditionalInformation('');
      setFollowUpDate('');
      setSavingCall(false);
      if (onNotify) onNotify("Call activity & lead update saved successfully!");

    } catch (err) {
      setSavingCall(false);
      alert("Failed to save activity: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
        <p className="text-xs font-semibold mt-2">Loading Lead Workspace...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lead record not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-[#7D610F] text-white rounded text-xs font-semibold">
          Return to All Leads
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Top Header Card */}
      <div className={`p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`p-1.5 rounded-full transition-colors ${
                darkMode ? 'text-slate-400 hover:text-white hover:bg-[#1E2633]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Back to All Leads"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <h1 className={`font-bold text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.name}</h1>
            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
              darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-[#7D610F] border-[#CDB46A]'
            }`}>
              {lead.leadId}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
            <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="material-symbols-outlined text-[16px] text-[#7D610F]">person</span>
              <span>Owner: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{lead.ownerId}</strong></span>
            </span>
            <span className="text-xs text-slate-500">|</span>
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Created: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{new Date(lead.createdAt).toLocaleDateString()}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditLead(lead)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-200 border-[#262F3D]' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Lead</span>
          </button>
          
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#7D610F] hover:bg-[#68500C] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">list</span>
            <span>All Leads</span>
          </button>
        </div>

      </div>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Lead Information & Notes Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1: CONTACT INFORMATION */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-4 transition-colors ${
            darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center gap-2 border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <span className="material-symbols-outlined text-[#7D610F] text-[20px]">badge</span>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>SECTION 1: Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Full Name</span>
                <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.name}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Mobile Phone</span>
                <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.mobile}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">WhatsApp Number</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.whatsappNumber || lead.mobile}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Email Address</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.email || 'N/A'}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">City</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.city || 'N/A'}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">State</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.state || 'N/A'}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Age</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.age ? `${lead.age} years` : 'N/A'}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Qualification</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.qualification || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: COURSE INTEREST */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-4 transition-colors ${
            darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center gap-2 border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <span className="material-symbols-outlined text-[#7D610F] text-[20px]">school</span>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>SECTION 2: Course Interest & Requirements</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-3 rounded-lg border sm:col-span-2 ${
                darkMode ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/50 border-[#CDB46A]/40'
              }`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Interested Aviation Course</span>
                <span className={`font-bold text-base ${darkMode ? 'text-amber-300' : 'text-[#7D610F]'}`}>{lead.interestedCourse}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Preferred Study Mode</span>
                <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lead.preferredStudyMode || 'Offline'}</span>
              </div>
              <div className={`p-3 rounded-lg border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Lead Owner / Counselor</span>
                <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lead.ownerId}</span>
              </div>
              {lead.requirement && (
                <div className={`p-3 rounded-lg border sm:col-span-2 ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Student Requirement</span>
                  <p className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.requirement}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: SOURCE & MARKETING */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-4 transition-colors ${
            darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center gap-2 border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <span className="material-symbols-outlined text-[#7D610F] text-[20px]">campaign</span>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>SECTION 3: Source & Marketing Metadata</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Lead Source</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.source}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Campaign</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.campaign || 'N/A'}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Campaign ID</span>
                <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.campaignId || 'N/A'}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Ad Set</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.adSet || 'N/A'}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Ad Set ID</span>
                <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.adSetId || 'N/A'}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Ad Name</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.ad || 'N/A'}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Form ID</span>
                <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.formId || 'N/A'}</span>
              </div>
              <div className={`p-2.5 rounded border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">UTM Source</span>
                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.utmSource || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* CUSTOM NOTES & PINNED NOTES CARD */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-4 transition-colors ${
            darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7D610F] text-[20px]">sticky_note_2</span>
                <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>Counselor Notes & Pinned Instructions</h3>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-[#7D610F] border-[#CDB46A]'
              }`}>
                {notes.length} Notes
              </span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className={`rounded-lg p-3 space-y-2 border ${
              darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Note Title (e.g. Simulator Preference)"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className={`flex-1 border rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                    darkMode ? 'bg-[#181D26] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <label className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer px-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={newNotePinned}
                    onChange={(e) => setNewNotePinned(e.target.checked)}
                    className="text-[#7D610F] focus:ring-[#7D610F]"
                  />
                  <span>Pin Note</span>
                </label>
              </div>
              <textarea
                rows={2}
                placeholder="Enter custom counselor note or internal memo..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className={`w-full border rounded p-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] ${
                  darkMode ? 'bg-[#181D26] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="submit"
                disabled={addingNote || !newNoteContent.trim()}
                className="px-4 py-1.5 bg-[#7D610F] hover:bg-[#68500C] text-white rounded text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : '+ Save Note'}
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-3 pt-1">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No notes added for this lead yet.</p>
              ) : (
                notes.map(n => (
                  <div
                    key={n.noteId}
                    className={`p-3.5 rounded-lg border transition-all ${
                      n.isPinned
                        ? (darkMode ? 'bg-amber-950/30 border-amber-800/40 shadow-sm' : 'bg-amber-50/70 border-[#CDB46A] shadow-sm')
                        : (darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200')
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {n.isPinned && (
                          <span className="material-symbols-outlined text-[16px] text-amber-400 font-bold" title="Pinned Note">
                            push_pin
                          </span>
                        )}
                        <h4 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>{n.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(n)}
                          className={`hover:text-[#7D610F] ${n.isPinned ? 'text-amber-400' : ''}`}
                          title={n.isPinned ? 'Unpin Note' : 'Pin Note'}
                        >
                          <span className="material-symbols-outlined text-[16px]">push_pin</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n.noteId)}
                          className="hover:text-red-400"
                          title="Delete Note"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{n.content}</p>
                    <span className="text-[10px] text-slate-500 block mt-2 font-mono">
                      By {n.createdBy || 'Counselor'} • {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVITY HISTORY TIMELINE */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-4 transition-colors ${
            darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7D610F] text-[20px]">history</span>
                <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>Activity History Timeline</h3>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-[#7D610F] border-[#CDB46A]'
              }`}>
                {activities.length} Records
              </span>
            </div>

            <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 ${
              darkMode ? 'before:bg-slate-700' : 'before:bg-slate-200'
            }`}>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500">No activity history logged yet.</p>
              ) : (
                activities.map(act => (
                  <div key={act.activityId} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-[#7D610F] border-2 border-white ring-2 ring-amber-200" />
                    
                    <div className={`border rounded-lg p-3 space-y-1 ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {act.activityType} — <span className="text-[#7D610F]">{act.outcome}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {act.createdAt ? new Date(act.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                      {act.remarks && <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{act.remarks}</p>}
                      {act.additionalInformation && (
                        <p className={`text-xs p-2 rounded border mt-1 ${
                          darkMode ? 'bg-[#181D26] border-[#262F3D] text-slate-300' : 'bg-white border-slate-200 text-slate-500'
                        }`}>
                          {act.additionalInformation}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-500 block pt-1">Logged by: {act.createdBy || 'Counselor'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CALL & UPDATE PANEL (1 Col) */}
        <div className="space-y-6">
          
          {/* CALL & UPDATE ACTION CARD */}
          <div className={`rounded-xl border-2 p-5 shadow-lg space-y-4 sticky top-[76px] transition-colors ${
            darkMode ? 'bg-[#181D26] border-amber-500/40' : 'bg-white border-[#CDB46A]'
          }`}>
            <div className={`flex items-center gap-2 border-b -mx-5 -mt-5 p-4 rounded-t-xl ${
              darkMode ? 'bg-amber-950/30 border-[#262F3D]' : 'bg-amber-50/60 border-slate-200'
            }`}>
              <span className="material-symbols-outlined text-[#7D610F] text-[22px] font-bold">phone_in_talk</span>
              <div>
                <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Call & Update Panel</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Log interaction activity & schedule follow-up</p>
              </div>
            </div>

            <form onSubmit={handleSaveCallUpdate} className="space-y-4 text-xs">
              
              {/* Outcome Selection */}
              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  Call Outcome <span className="text-red-500">*</span>
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className={`w-full border rounded-lg p-2.5 font-semibold focus:ring-2 focus:ring-[#7D610F] outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {callOutcomes.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  Counselor Remarks
                </label>
                <textarea
                  rows="3"
                  placeholder="Enter detailed conversation summary..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#7D610F] outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Additional Requirements */}
              <div>
                <label className={`block font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  Additional Information / Requirement / Budget
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interested in Hostel facility & simulator labs"
                  value={additionalInformation}
                  onChange={(e) => setAdditionalInformation(e.target.value)}
                  className={`w-full border rounded-lg p-2 outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Schedule Follow-up */}
              <div className={`p-3 rounded-lg border space-y-2 ${
                darkMode ? 'bg-amber-950/20 border-amber-800/30' : 'bg-amber-50/60 border-[#CDB46A]/50'
              }`}>
                <label className="block font-semibold text-[#7D610F] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  <span>Schedule Next Follow-Up (Optional)</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className={`border rounded p-1.5 text-xs ${
                      darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className={`border rounded p-1.5 text-xs ${
                      darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold text-[10px] uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>Follow-Up Channel Type</label>
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value)}
                    className={`w-full border rounded p-1.5 text-xs font-semibold ${
                      darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    {FOLLOWUP_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Change Lead Status */}
              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  Update Standard Lead Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className={`w-full border rounded-lg p-2 font-bold ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {LEAD_STATUSES.map(s => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={savingCall}
                className="w-full py-3 bg-[#7D610F] hover:bg-[#68500C] text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {savingCall ? (
                  <span>Saving Update...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>SAVE & UPDATE LEAD</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* SCHEDULED FOLLOW-UPS CARD */}
          <div className={`p-5 rounded-xl border shadow-sm space-y-3 transition-colors ${
            darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
              <h4 className={`font-bold text-sm flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                <span className="material-symbols-outlined text-[#7D610F] text-[18px]">event_upcoming</span>
                <span>Scheduled Follow-Ups</span>
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-100 text-[#7D610F]'
              }`}>
                {followups.length}
              </span>
            </div>

            <div className="space-y-2">
              {followups.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No follow-ups currently scheduled.</p>
              ) : (
                followups.map(f => (
                  <div key={f.followUpId} className={`p-2.5 border rounded-lg text-xs space-y-1 ${
                    darkMode ? 'bg-amber-950/20 border-amber-800/30 text-slate-200' : 'bg-amber-50/50 border-[#CDB46A]/30 text-slate-800'
                  }`}>
                    <div className="flex justify-between font-semibold">
                      <span>📅 {f.date} at {f.time}</span>
                      <span className="text-[#7D610F] font-bold">{f.type || 'Call'}</span>
                    </div>
                    {f.notes && <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{f.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

