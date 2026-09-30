import React, { useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

const CATEGORIES = ['Welcome', 'Follow-up', 'Payment', 'Conversion', 'Re-engagement', 'General'];
const VARIABLES = ['{{name}}', '{{course}}', '{{counselor}}', '{{phone}}', '{{email}}', '{{campaign}}'];

const emptyForm = { name: '', category: 'General', subject: '', body: '' };

export const EmailTemplatesView = ({ onNotify, darkMode }) => {
  // Local-only, same as Email Triggers: no email-template backend exists
  // yet, so nothing here persists past this browser tab.
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  const card = darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200';
  const inputCls = `w-full border rounded-lg p-2 outline-none ${
    darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;
  const labelCls = `block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const muted = darkMode ? 'text-slate-400' : 'text-slate-600';

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormError(null); setShowModal(true); };
  const openEdit = (t) => { setEditingId(t.id); setForm({ ...emptyForm, ...t }); setFormError(null); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setFormError('Template name, subject and email body are required.');
      return;
    }
    if (editingId) {
      setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, ...form } : t));
      if (onNotify) onNotify('Email template updated!');
    } else {
      setTemplates(prev => [{ ...form, id: `local-${Date.now()}` }, ...prev]);
      if (onNotify) onNotify('Email template created!');
    }
    setShowModal(false);
  };

  const promptDelete = (t) => setConfirmConfig({
    title: 'Delete Template?',
    message: `"${t.name}" will be removed from this preview list.`,
    confirmText: 'Yes, Delete',
    type: 'danger',
    onConfirm: () => {
      setTemplates(prev => prev.filter(x => x.id !== t.id));
      setConfirmConfig(null);
    }
  });

  const handleDuplicate = (t) => {
    setTemplates(prev => [{ ...t, id: `local-${Date.now()}`, name: `${t.name} (Copy)` }, ...prev]);
    if (onNotify) onNotify('Template duplicated!');
  };

  const handleCopy = async (t) => {
    const text = `Subject: ${t.subject}\n\n${t.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(t.id);
      setTimeout(() => setCopiedId(id => (id === t.id ? null : id)), 1500);
    } catch (err) {
      alert('Could not copy to clipboard: ' + err.message);
    }
  };

  const categoryOptions = ['All', ...CATEGORIES];
  const filteredTemplates = templates.filter(t => {
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!t.name.toLowerCase().includes(term) && !t.subject.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-xl border shadow-xs ${card}`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">description</span>
          <span>Email Templates</span>
          <span className={`text-[11px] font-semibold ${muted}`}>{templates.length} saved</span>
        </h2>
        <button onClick={openAdd}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Template</span>
        </button>
      </div>

      <div className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${
        darkMode ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <span className="material-symbols-outlined text-[16px] mt-px">info</span>
        <span>UI preview: templates you create here are kept only in this browser tab. Use "Copy" to paste one into an email client, or pick variables into your Email Triggers, until the email backend is connected.</span>
      </div>

      {templates.length > 0 && (
        <div className={`flex flex-col sm:flex-row gap-2.5 rounded-xl border p-3 ${card}`}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or subject..."
            className={`flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-xs outline-none ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          >
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {templates.length === 0 ? (
        <div className={`rounded-xl border py-16 px-6 text-center ${card}`}>
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-2 block">mark_email_unread</span>
          <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No email templates yet</p>
          <p className={`text-xs mt-1 mb-4 ${muted}`}>Save reusable subject + body pairs for welcome mails, follow-ups, payment reminders and more.</p>
          <button onClick={openAdd} className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold">Create first template</button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className={`rounded-xl border py-12 px-6 text-center ${card}`}>
          <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No templates match your search/filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredTemplates.map(t => (
            <div key={t.id} className={`rounded-xl border p-4 shadow-xs space-y-3 ${card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-[#7D610F] text-white flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">description</span>
                  </span>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                      {t.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg border p-2.5 text-xs ${darkMode ? 'bg-[#1A1608] border-[#574719]' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.subject}</p>
                <p className={`mt-1 line-clamp-3 whitespace-pre-line ${muted}`}>{t.body}</p>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => handleCopy(t)} className="px-3 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">{copiedId === t.id ? 'check' : 'content_copy'}</span>
                  {copiedId === t.id ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => handleDuplicate(t)} className="px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>Duplicate
                </button>
                <button onClick={() => openEdit(t)} className="px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">edit</span>Edit
                </button>
                <button onClick={() => promptDelete(t)} className="px-3 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">delete</span>Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 ${darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
              <h3 className="font-bold text-base">{editingId ? 'Edit Template' : 'New Email Template'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Template Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Welcome Mail" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Email Subject *</label>
                <input type="text" value={form.subject} onChange={(e) => setField('subject', e.target.value)} placeholder="Welcome to AEERO Academy, {{name}}!" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Email Body *</label>
                <textarea rows={7} value={form.body} onChange={(e) => setField('body', e.target.value)} className={inputCls} placeholder="Hi {{name}}, thanks for your interest in {{course}}..." />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {VARIABLES.map(v => (
                    <button type="button" key={v} onClick={() => setField('body', form.body + v)}
                      className={`px-2 py-0.5 rounded border font-mono text-[10px] ${darkMode ? 'border-[#574719] bg-[#1A1608] text-slate-300 hover:bg-[#3D3212]' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p className="text-rose-600 font-medium">{formError}</p>}

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
                <button type="button" onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-sm">
                  {editingId ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmConfig} onClose={() => setConfirmConfig(null)} darkMode={darkMode} {...confirmConfig} />
    </div>
  );
};
