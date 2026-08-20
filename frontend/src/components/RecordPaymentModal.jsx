import React, { useState } from 'react';
import { api } from '../api/client';

export const RecordPaymentModal = ({ lead, currentUser, onClose, onPaymentRecorded, darkMode }) => {
  if (!lead) return null;

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.recordPayment(lead.leadId || lead.id, {
        amount: Number(amount),
        paymentMethod,
        referenceNo,
        paymentDate,
        notes,
        currentUser: currentUser ? currentUser.name : 'Counselor'
      });

      setLoading(false);
      if (onPaymentRecorded) onPaymentRecorded(res);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to record payment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className={`rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className="bg-[#0F2438] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Record Course Fee Payment</h3>
              <p className="text-xs text-slate-300">Update paid status & reflect income on dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Lead Student Info Summary */}
        <div className={`px-6 py-3 flex items-center justify-between text-xs border-b ${
          darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Student / Trainee</span>
            <strong className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lead.name}</strong>
            <span className="ml-2 font-mono text-[#7D610F] font-semibold text-xs">({lead.leadId || 'LD-XXXXXX'})</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Course</span>
            <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{lead.interestedCourse || 'Aviation Program'}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Amount (INR ₹) */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Payment Amount (INR ₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₹</span>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full border rounded-lg pl-8 pr-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Mode */}
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Payment Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Net Banking">Net Banking / NEFT / RTGS</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash Deposit</option>
                <option value="Cheque">Cheque / Demand Draft</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Reference / Receipt Number */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Transaction / Receipt Ref No.
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-98234123412 or REC-2026-88"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Remarks / Payment Installment Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 1st Installment for Simulator & Flying fees"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className={`pt-3 border-t flex justify-end gap-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Saving Payment...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
