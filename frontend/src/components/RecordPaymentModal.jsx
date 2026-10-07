import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const RecordPaymentModal = ({ lead, currentUser, onClose, onPaymentRecorded, darkMode }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fee summary (total course fee / paid so far / due) + EMI plan - students
  // almost always pay in installments rather than the full fee at once, so
  // the counselor needs to see where this payment lands against the total.
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [isEmi, setIsEmi] = useState(false);
  const [emiTotalInstallments, setEmiTotalInstallments] = useState(2);

  useEffect(() => {
    if (!lead) return;
    setSummaryLoading(true);
    api.getPaymentSummary(lead.leadId || lead.id)
      .then(s => {
        setSummary(s);
        // Total installments can never be fewer than the installment this
        // payment itself represents (paymentsCount + 1).
        const minTotal = s.paymentsCount + 1;
        setEmiTotalInstallments(Math.min(Math.max(2, minTotal), s.maxEmiInstallments) || minTotal);
      })
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [lead?.leadId, lead?.id]);

  if (!lead) return null;

  const emiInstallmentNumber = summary ? summary.paymentsCount + 1 : 1;
  // How many installments (including this one) are left to cover the due
  // balance, and what each of those should be - a guide, not a hard rule,
  // so the "total installments" dropdown actually means something concrete.
  const remainingInstallments = summary ? Math.max(1, emiTotalInstallments - summary.paymentsCount) : 1;
  const suggestedInstallmentAmount = summary ? Math.round(summary.dueBalance / remainingInstallments) : 0;

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
        emiInstallmentNumber: isEmi ? emiInstallmentNumber : null,
        emiTotalInstallments: isEmi ? emiTotalInstallments : null,
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
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className="bg-[#574719] text-white px-6 py-4 flex items-center justify-between">
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
          darkMode ? 'bg-[#1A1608] border-[#574719]' : 'bg-slate-50 border-slate-200'
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

          {/* Fee Summary: Total Course Fee / Paid So Far / Due Balance */}
          {summaryLoading ? (
            <div className={`p-3 rounded-lg text-xs font-medium text-center ${darkMode ? 'bg-[#1A1608] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              Loading course fee details...
            </div>
          ) : summary && summary.totalFee > 0 ? (
            <div className={`grid grid-cols-3 gap-2 p-3 rounded-lg border text-center ${darkMode ? 'bg-[#1A1608] border-[#574719]' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <span className={`block text-[9px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Fee</span>
                <span className={`block text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>₹{summary.totalFee.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className={`block text-[9px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paid So Far</span>
                <span className="block text-sm font-bold text-emerald-500">₹{summary.paidSoFar.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className={`block text-[9px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Due Balance</span>
                <span className="block text-sm font-bold text-amber-500">₹{summary.dueBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded-lg text-xs font-medium text-center ${darkMode ? 'bg-[#1A1608] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              No course fee found in Products & Services for "{lead.interestedCourse || lead.campaign || 'this course'}" - add it there to see Total Fee / Due Balance here.
            </div>
          )}

          {summary && summary.payments && summary.payments.length > 0 && (
            <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-[#574719]' : 'border-slate-200'}`}>
              <div className={`px-3 py-1.5 text-[10px] font-bold uppercase ${darkMode ? 'bg-[#1A1608] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                Previous Payments ({summary.payments.length})
              </div>
              <table className="w-full text-xs">
                <tbody className={`divide-y ${darkMode ? 'divide-[#574719] text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                  {summary.payments.map((p, i) => (
                    <tr key={p.id || i}>
                      <td className="px-3 py-1.5 font-semibold">{p.paymentDate || '-'}</td>
                      <td className="px-3 py-1.5 font-bold text-emerald-500 text-right">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-1.5">{p.paymentMethod || '-'}</td>
                      <td className="px-3 py-1.5 text-right text-[11px] text-slate-400">
                        {p.emiTotalInstallments ? `EMI ${p.emiInstallmentNumber}/${p.emiTotalInstallments}` : 'Full'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                  darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* EMI Plan */}
          {summary && summary.totalFee > 0 && (
            <div className={`p-3 rounded-lg border space-y-2 ${darkMode ? 'bg-amber-950/20 border-amber-800/30' : 'bg-amber-50/60 border-amber-200'}`}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmi}
                  onChange={(e) => setIsEmi(e.target.checked)}
                  className="w-3.5 h-3.5 rounded cursor-pointer accent-amber-600"
                />
                <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  This is an EMI installment (student is paying in parts, not full fee at once)
                </span>
              </label>

              {isEmi && (
                <>
                  <div className="flex items-center gap-2 pl-6 text-xs flex-wrap">
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                      Installment {emiInstallmentNumber} of
                    </span>
                    <select
                      value={emiTotalInstallments}
                      onChange={(e) => setEmiTotalInstallments(Number(e.target.value))}
                      className={`border rounded px-2 py-1 text-xs font-bold outline-none ${
                        darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {Array.from(
                        { length: Math.max(1, summary.maxEmiInstallments - emiInstallmentNumber + 1) },
                        (_, i) => emiInstallmentNumber + i
                      ).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                      total (max {summary.maxEmiInstallments} for this course's {summary.durationMonths}-month duration)
                    </span>
                  </div>

                  <div className={`flex items-center justify-between gap-2 pl-6 pt-1 text-xs border-t ${darkMode ? 'border-amber-800/30' : 'border-amber-200'}`}>
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                      Suggested amount for this installment ({remainingInstallments} left ÷ ₹{summary.dueBalance.toLocaleString('en-IN')} due):{' '}
                      <strong className={darkMode ? 'text-white' : 'text-slate-900'}>₹{suggestedInstallmentAmount.toLocaleString('en-IN')}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(suggestedInstallmentAmount))}
                      className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex-shrink-0"
                    >
                      Use This
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
                  darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                  darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className={`pt-3 border-t flex justify-end gap-3 ${darkMode ? 'border-[#574719]' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
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
