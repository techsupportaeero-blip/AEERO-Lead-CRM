import Skeleton, { TableSkeleton, CardSkeleton } from '../components/Skeleton.jsx';
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const CustomersView = ({ onSelectLead, onNotify, darkMode }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (customers || []).filter(c =>
    !search ||
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && String(c.phone).includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;

  const handleExportCSV = () => {
    if (filtered.length === 0) return alert("No customers to export");
    const asExcelText = (v) => v ? `="${v}"` : '';
    const headers = ["Customer ID", "Student Name", "Mobile", "WhatsApp", "Email", "City", "State", "Notes", "Enrolled Date"];
    const rows = filtered.map(c => [
      `CUST-${String(c.id).padStart(4, '0')}`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      asExcelText(c.phone),
      asExcelText(c.whatsapp),
      c.email || '',
      c.city || '',
      c.state || '',
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,﻿" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AEERO_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setEditName(c.name || '');
    setEditEmail(c.email || '');
    setEditPhone(c.phone || '');
    setEditWhatsapp(c.whatsapp || '');
    setEditCity(c.city || '');
    setEditState(c.state || '');
    setEditNotes(c.notes || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      setSaving(true);
      const updated = await api.updateCustomer(editingCustomer.id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        whatsapp: editWhatsapp,
        city: editCity,
        state: editState,
        notes: editNotes
      });
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingCustomer(null);
      if (onNotify) onNotify("Customer details updated successfully!");
    } catch (err) {
      alert("Failed to update customer: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Header */}
      <div className={`p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F]">group</span>
            <span>Enrolled Students & Converted Customers</span>
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Directory of converted aviation trainees, enrolled students, and fee records</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#b58d16] hover:bg-[#6B540A] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span>CSV</span>
          </button>

          <div className="w-full sm:w-64 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search student or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] transition-colors ${
                darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200'
      }`}>
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
            <TableSkeleton columns={6} rows={8} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-xs font-medium">No customer records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#574719] text-white font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Mobile & WhatsApp</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">City / State</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {currentEntries.map(c => (
                  <tr key={c.id} className={`transition-colors ${
                    darkMode ? 'hover:bg-[#3D3212]' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3 px-4 font-mono font-bold text-[#7D610F]">
                      CUST-{String(c.id).padStart(4, '0')}
                    </td>
                    <td className={`py-3 px-4 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {c.name}
                    </td>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      {c.phone}
                    </td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      {c.email || 'N/A'}
                    </td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      {c.city ? `${c.city}, ${c.state}` : 'N/A'}
                    </td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {c.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="w-7 h-7 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                          title="Edit Customer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        {c.leadId && (
                          <button
                            onClick={() => onSelectLead && onSelectLead(c.leadId)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                              darkMode
                                ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 border border-amber-800/40'
                                : 'bg-amber-50 hover:bg-amber-100 text-[#7D610F] border border-amber-200'
                            }`}
                            title="View Student Lead Workspace"
                          >
                            <span className="material-symbols-outlined text-[16px]">history</span>
                            <span>View Lead</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className={`p-3.5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-medium transition-colors ${
            darkMode ? 'bg-[#1A1608] border-[#574719] text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'
          }`}>
            <div>
              Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={`px-3 py-1 rounded border disabled:opacity-50 text-xs font-semibold transition-colors ${
                  darkMode ? 'bg-[#2A220C] border-[#574719] text-slate-300 hover:bg-[#3D3212]' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-[#0F172A] text-white rounded text-xs font-bold">
                {currentPage}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={`px-3 py-1 rounded border disabled:opacity-50 text-xs font-semibold transition-colors ${
                  darkMode ? 'bg-[#2A220C] border-[#574719] text-slate-300 hover:bg-[#3D3212]' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-lg p-6 space-y-4 ${
            darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Edit Customer - CUST-{String(editingCustomer.id).padStart(4, '0')}
              </h3>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Student Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full border rounded-lg p-2 outline-none ${
                    darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Mobile</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>WhatsApp</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`w-full border rounded-lg p-2 outline-none ${
                    darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className={`w-full border rounded-lg p-2 outline-none ${
                    darkMode ? 'bg-[#1A1608] border-[#574719] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-sm disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
