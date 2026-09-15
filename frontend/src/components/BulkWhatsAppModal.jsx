import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

// Sends the same Meta-approved WhatsApp template to every selected lead.
// WhatsApp only allows business-initiated bulk messages through pre-approved
// templates (freeform text is blocked outside a 24h customer-reply window),
// so "customizing the message" here means picking a template and previewing
// how its {{1}} variable resolves per lead - not typing arbitrary text.
export const BulkWhatsAppModal = ({ isOpen, selectedLeads, currentUser, darkMode, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setError(null);
    setLoadingTemplates(true);
    api.getWhatsAppTemplates()
      .then((list) => {
        setTemplates(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) setTemplateId(list[0].templateId);
      })
      .catch((err) => setError(err.message || 'Failed to load templates'))
      .finally(() => setLoadingTemplates(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedTemplate = templates.find(t => t.templateId === templateId);
  const previewName = selectedLeads[0]?.name || 'Lead Name';
  const previewText = selectedTemplate ? selectedTemplate.body.replace('{{1}}', previewName) : '';

  const handleSend = async () => {
    if (!templateId || selectedLeads.length === 0) return;
    try {
      setSending(true);
      setError(null);
      const leadIds = selectedLeads.map(l => l.leadId);
      const res = await api.bulkSendWhatsApp(leadIds, templateId, currentUser?.name || 'Counselor');
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl border w-full max-w-lg p-6 space-y-5 transform transition-all scale-100 ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600 border-emerald-200">
            <span className="material-symbols-outlined text-[26px]">forum</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-extrabold text-base leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>Bulk WhatsApp Message</h3>
            <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Sending to <span className="font-semibold">{selectedLeads.length}</span> selected lead{selectedLeads.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className={`p-1 rounded ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {!result ? (
          <>
            {/* Template Picker */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Message Template</label>
              {loadingTemplates ? (
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading templates…</p>
              ) : (
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                >
                  {templates.map(t => (
                    <option key={t.templateId} value={t.templateId}>{t.name}</option>
                  ))}
                </select>
              )}
              <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Only Meta-approved templates can be used for bulk sends. Each lead's name auto-fills the {'{{1}}'} slot.
              </p>
            </div>

            {/* Preview */}
            {selectedTemplate && (
              <div className={`p-3 rounded-lg border text-xs whitespace-pre-wrap leading-relaxed ${darkMode ? 'bg-[#1A1608] border-[#574719] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {previewText}
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            )}

            {/* Actions */}
            <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !templateId || selectedLeads.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>{sending ? 'Sending…' : `Send to ${selectedLeads.length} Lead${selectedLeads.length !== 1 ? 's' : ''}`}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results Summary */}
            <div className={`p-3 rounded-lg border text-xs space-y-1 ${darkMode ? 'bg-[#1A1608] border-[#574719]' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{result.message}</p>
              <p className="text-emerald-600 font-medium">✅ Sent: {result.sentCount}</p>
              {result.failedCount > 0 && <p className="text-rose-600 font-medium">❌ Failed: {result.failedCount}</p>}
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {result.results.map((r, i) => (
                <div key={i} className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded ${darkMode ? 'bg-[#1A1608] text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                  <span>{r.name} ({r.mobile})</span>
                  <span className={r.success ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    {r.success ? 'Sent' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>

            <div className={`pt-3 border-t flex items-center justify-end ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 bg-[#0F172A] hover:bg-[#1E293B] text-white"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
