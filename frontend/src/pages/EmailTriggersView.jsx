import React, { useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

const EVENTS = [
  { id: 'NEW_LEAD', label: 'New lead created', icon: 'person_add', desc: 'Fires when a lead arrives from any source.' },
  { id: 'STATUS_CHANGED', label: 'Lead status changed', icon: 'swap_horiz', desc: 'Fires when a lead moves to a chosen status.' },
  { id: 'FOLLOWUP_DUE', label: 'Follow-up due', icon: 'event_upcoming', desc: 'Fires when a scheduled follow-up date arrives.' },
  { id: 'NO_ACTIVITY', label: 'No activity for N days', icon: 'hourglass_empty', desc: 'Fires when a lead has been untouched for a set time.' },
  { id: 'CONVERTED', label: 'Lead converted', icon: 'verified', desc: 'Fires when a lead becomes a customer.' }
];

const STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST'];
const VARIABLES = ['{{name}}', '{{course}}', '{{counselor}}', '{{phone}}'];

const emptyForm = {
  name: '', event: 'NEW_LEAD', status: 'CONTACTED', days: 3, delayMinutes: 0,
  filterCampaign: '', subject: '', body: '', active: true
};

export const EmailTriggersView = ({ darkMode }) => {
  // Every counselor gets access, not just Admin/Manager/Sr. Counsellor.
  // Local-only: no email-trigger backend exists yet, so nothing persists.
  const [triggers, setTriggers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const card = darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200';
  const inputCls = `w-full border rounded-lg p-2 outline-none ${
    darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;
  const labelCls = `block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const muted = darkMode ? 'text-slate-400' : 'text-slate-600';

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const eventOf = (id) => EVENTS.find(e => e.id === id) || EVENTS[0];

  const describe = (t) => {
    if (t.event === 'STATUS_CHANGED') return `Status becomes ${t.status}`;
    if (t.event === 'NO_ACTIVITY') return `No activity for ${t.days} day(s)`;
    return eventOf(t.event).label;
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormError(null); setShowModal(true); };
  const openEdit = (t) => { setEditingId(t.id); setForm({ ...emptyForm, ...t }); setFormError(null); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setFormError('Trigger name, subject and email body are required.');
      return;
    }
    if (form.event === 'NO_ACTIVITY' && !(Number(form.days) >= 1)) {
      setFormError('Days must be at least 1.');
      return;
    }
    if (editingId) {
      setTriggers(prev => prev.map(t => t.id === editingId ? { ...t, ...form } : t));
    } else {
      setTriggers(prev => [{ ...form, id: `local-${Date.now()}` }, ...prev]);
    }
    setShowModal(false);
  };

  const toggleActive = (id) => setTriggers(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));

  const promptDelete = (t) => setConfirmConfig({
    title: 'Delete Trigger?',
    message: `"${t.name}" will be removed from this preview list.`,
    confirmText: 'Yes, Delete',
    type: 'danger',
    onConfirm: () => { setTriggers(prev => prev.filter(x => x.id !== t.id)); setConfirmConfig(null); }
  });

  const activeCount = triggers.filter(t => t.active).length;

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      <div className={`flex justify-between items-center p-3.5 rounded-xl border shadow-xs ${card}`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">bolt</span>
          <span>Email Triggers</span>
          <span className={`text-[11px] font-semibold ${muted}`}>{activeCount} active / {triggers.length} total</span>
        </h2>
        <button onClick={openAdd}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Trigger</span>
        </button>
      </div>

      <div className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${
        darkMode ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <span className="material-symbols-outlined text-[16px] mt-px">info</span>
        <span>UI preview: triggers you create here are kept only in this browser tab. No emails are sent, and nothing is saved, until the email backend is connected.</span>
      </div>

      {triggers.length === 0 ? (
        <div className={`rounded-xl border py-16 px-6 text-center ${card}`}>
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-2 block">forward_to_inbox</span>
          <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No email triggers yet</p>
          <p className={`text-xs mt-1 mb-4 ${muted}`}>Automatically email leads when something happens, e.g. a welcome mail on every new lead.</p>
          <button onClick={openAdd} className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold">Create first trigger</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {triggers.map(t => {
            const ev = eventOf(t.event);
            return (
              <div key={t.id} className={`rounded-xl border p-4 shadow-xs space-y-3 ${card} ${t.active ? '' : 'opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-[#7D610F] text-white flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{ev.icon}</span>
                    </span>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                      <p className={`text-[11px] ${muted}`}>
                        When: {describe(t)}
                        {t.delayMinutes > 0 && ` · send after ${t.delayMinutes} min`}
                        {t.filterCampaign && ` · campaign: ${t.filterCampaign}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(t.id)} role="switch" aria-checked={t.active} title={t.active ? 'Pause trigger' : 'Enable trigger'}
                    className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${t.active ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${t.active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className={`rounded-lg border p-2.5 text-xs ${darkMode ? 'bg-[#1A1608] border-[#574719]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.subject}</p>
                  <p className={`mt-1 line-clamp-2 whitespace-pre-line ${muted}`}>{t.body}</p>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => openEdit(t)} className="px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span>Edit
                  </button>
                  <button onClick={() => promptDelete(t)} className="px-3 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">delete</span>Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 ${darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
              <h3 className="font-bold text-base">{editingId ? 'Edit Trigger' : 'New Email Trigger'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>Trigger Name *</label>
                <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Welcome mail for new leads" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>When this happens</label>
                <select value={form.event} onChange={(e) => setField('event', e.target.value)} className={inputCls}>
                  {EVENTS.map(ev => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                </select>
                <p className={`mt-1 text-[11px] ${muted}`}>{eventOf(form.event).desc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {form.event === 'STATUS_CHANGED' && (
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={inputCls}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {form.event === 'NO_ACTIVITY' && (
                  <div>
                    <label className={labelCls}>Days without activity</label>
                    <input type="number" min="1" value={form.days} onChange={(e) => setField('days', e.target.value)} className={inputCls} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Send after (minutes)</label>
                  <input type="number" min="0" value={form.delayMinutes} onChange={(e) => setField('delayMinutes', Number(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Only for campaign <span className="font-normal opacity-60">(optional)</span></label>
                  <input type="text" value={form.filterCampaign} onChange={(e) => setField('filterCampaign', e.target.value)} placeholder="All campaigns" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email Subject *</label>
                <input type="text" value={form.subject} onChange={(e) => setField('subject', e.target.value)} placeholder="Welcome to AEERO Academy, {{name}}!" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Email Body *</label>
                <textarea rows={6} value={form.body} onChange={(e) => setField('body', e.target.value)} className={inputCls} placeholder="Hi {{name}}, thanks for your interest in {{course}}..." />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {VARIABLES.map(v => (
                    <button type="button" key={v} onClick={() => setField('body', form.body + v)}
                      className={`px-2 py-0.5 rounded border font-mono text-[10px] ${darkMode ? 'border-[#574719] bg-[#1A1608] text-slate-300 hover:bg-[#3D3212]' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setField('active', e.target.checked)} className="w-3.5 h-3.5 rounded accent-emerald-600" />
                <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Enable trigger</span>
              </label>

              {formError && <p className="text-rose-600 font-medium">{formError}</p>}

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
                <button type="button" onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-sm">
                  {editingId ? 'Save Changes' : 'Create Trigger'}
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
