import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

const emptyForm = { templateId: '', name: '', body: '', variableCount: 1, isActive: true };

export const WhatsAppTemplatesView = ({ currentUser, onNotify, darkMode }) => {
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const card = darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200';
  const inputCls = `w-full border rounded-lg p-2 outline-none ${
    darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;
  const labelCls = `block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const muted = darkMode ? 'text-slate-400' : 'text-slate-600';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.getAllWhatsAppTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load WhatsApp templates:', err);
      setLoadError(err.message || 'Failed to load templates.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[50vh] rounded-xl border p-8 text-center ${card}`}>
        <span className="material-symbols-outlined text-[40px] text-slate-400 mb-2">lock</span>
        <h2 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Admin Access Only</h2>
        <p className={`text-sm max-w-md mt-1 ${muted}`}>
          WhatsApp templates are restricted to administrators, since a wrong template ID or body text breaks live sends for the whole team.
        </p>
      </div>
    );
  }

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditingTemplate(null); setForm(emptyForm); setFormError(null); setShowModal(true); };
  const openEdit = (t) => {
    setEditingTemplate(t);
    setForm({ templateId: t.templateId, name: t.name, body: t.body, variableCount: t.variableCount, isActive: t.isActive });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.templateId.trim() || !form.name.trim() || !form.body.trim()) {
      setFormError('Template ID, name and body are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      if (editingTemplate) {
        const updated = await api.updateWhatsAppTemplate(editingTemplate.id, {
          templateId: form.templateId.trim(),
          name: form.name.trim(),
          body: form.body,
          variableCount: Number(form.variableCount) || 0,
          isActive: form.isActive
        });
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        if (onNotify) onNotify('WhatsApp template updated!');
      } else {
        const created = await api.addWhatsAppTemplate({
          templateId: form.templateId.trim(),
          name: form.name.trim(),
          body: form.body,
          variableCount: Number(form.variableCount) || 0,
          isActive: form.isActive
        });
        setTemplates(prev => [...prev, created]);
        if (onNotify) onNotify('WhatsApp template added!');
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (t) => {
    try {
      const updated = await api.updateWhatsAppTemplate(t.id, { isActive: !t.isActive });
      setTemplates(prev => prev.map(x => x.id === t.id ? updated : x));
    } catch (err) {
      alert('Failed to update template: ' + err.message);
    }
  };

  const promptDelete = (t) => setConfirmConfig({
    title: 'Delete Template?',
    message: `"${t.name}" will be permanently removed from the CRM's registry. It won't affect anything on Omtel/Meta's side - only future bulk sends from this CRM lose access to it.`,
    confirmText: 'Yes, Delete',
    type: 'danger',
    onConfirm: async () => {
      try {
        await api.deleteWhatsAppTemplate(t.id);
        setTemplates(prev => prev.filter(x => x.id !== t.id));
        if (onNotify) onNotify('WhatsApp template deleted.');
      } catch (err) {
        alert('Failed to delete template: ' + err.message);
      } finally {
        setConfirmConfig(null);
      }
    }
  });

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      <div className={`flex justify-between items-center p-3.5 rounded-xl border shadow-xs ${card}`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">forum</span>
          <span>WhatsApp Templates</span>
          <span className={`text-[11px] font-semibold ${muted}`}>{templates.length} registered</span>
        </h2>
        <button onClick={openAdd}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add Template</span>
        </button>
      </div>

      <div className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${
        darkMode ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <span className="material-symbols-outlined text-[16px] mt-px">info</span>
        <span>Meta still has to approve a template's exact text on Omtel's dashboard before it can be used - once it's approved there, register its Template ID, name and exact body text here so it shows up in Bulk WhatsApp. Only Active templates appear in the send picker.</span>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold">
          <span>{loadError}</span>
          <button onClick={loadTemplates} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold">Retry</button>
        </div>
      )}

      {loading ? (
        <div className={`rounded-xl border py-16 px-6 text-center ${card}`}>
          <span className="material-symbols-outlined text-3xl animate-spin text-slate-400">sync</span>
        </div>
      ) : templates.length === 0 ? (
        <div className={`rounded-xl border py-16 px-6 text-center ${card}`}>
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-2 block">forum</span>
          <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No WhatsApp templates registered yet</p>
          <p className={`text-xs mt-1 mb-4 ${muted}`}>Add one that's already been approved on Omtel/Meta's side.</p>
          <button onClick={openAdd} className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold">Add first template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.id} className={`rounded-xl border p-4 shadow-xs space-y-3 ${card} ${t.isActive ? '' : 'opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">forum</span>
                  </span>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                    <p className={`text-[11px] font-mono truncate ${muted}`}>{t.templateId}</p>
                  </div>
                </div>
                <button onClick={() => handleToggleActive(t)} role="switch" aria-checked={t.isActive} title={t.isActive ? 'Pause template' : 'Enable template'}
                  className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${t.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${t.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className={`rounded-lg border p-2.5 text-xs whitespace-pre-wrap ${darkMode ? 'bg-[#1A1608] border-[#574719] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {t.body}
              </div>
              <p className={`text-[11px] ${muted}`}>{t.variableCount} variable{t.variableCount !== 1 ? 's' : ''}</p>

              <div className="flex justify-end gap-2">
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
              <h3 className="font-bold text-base">{editingTemplate ? 'Edit Template' : 'Register Approved Template'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>Template ID *</label>
                <input type="text" value={form.templateId} onChange={(e) => setField('templateId', e.target.value)} placeholder="e.g. crm_leads_ad3zcswlccewknlj" className={`${inputCls} font-mono`} />
                <p className={`mt-1 text-[11px] ${muted}`}>Must exactly match the template ID Omtel/Meta approved.</p>
              </div>

              <div>
                <label className={labelCls}>Template Name *</label>
                <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. crm_leads" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Body Text *</label>
                <textarea rows={5} value={form.body} onChange={(e) => setField('body', e.target.value)} className={inputCls} placeholder="Hello {{1}}, hurry up limited seats are left" />
                <p className={`mt-1 text-[11px] ${muted}`}>Must exactly match the approved text, including {'{{1}}'}, {'{{2}}'}, ... placeholders - Omtel/Meta rejects sends where this doesn't match what was approved.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Variable Count</label>
                  <input type="number" min="0" value={form.variableCount} onChange={(e) => setField('variableCount', e.target.value)} className={inputCls} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="w-3.5 h-3.5 rounded accent-emerald-600" />
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Active (selectable in Bulk WhatsApp)</span>
                </label>
              </div>

              {formError && <p className="text-rose-600 font-medium">{formError}</p>}

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
                <button type="button" onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-sm disabled:opacity-50">
                  {submitting ? 'Saving...' : (editingTemplate ? 'Save Changes' : 'Add Template')}
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
