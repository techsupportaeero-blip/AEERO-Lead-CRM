import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

export const LeadSourcesView = ({ onNotify, darkMode }) => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterType, setFilterType] = useState('All Types');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Form Fields
  const [sourceName, setSourceName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('Online');
  const [category, setCategory] = useState('Social Media');
  const [costPerLead, setCostPerLead] = useState('-');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await api.getLeadSources();
      setSources(data);
    } catch (err) {
      console.error("Failed to load lead sources:", err);
    } finally {
      setLoading(false);
    }
  };

  const promptClearFilters = () => {
    setConfirmConfig({
      title: "Clear All Filters?",
      message: "Are you really sure you want to reset and clear all selected status, source type, category filters, and search keywords?",
      confirmText: "Yes, Clear All",
      type: "warning",
      onConfirm: () => {
        setFilterStatus('All Status');
        setFilterType('All Types');
        setFilterCategory('All Categories');
        setSearchTerm('');
        setCurrentPage(1);
      }
    });
  };

  const handleOpenAddModal = () => {
    setEditingSource(null);
    setSourceName('');
    setDescription('');
    setSourceType('Online');
    setCategory('Social Media');
    setCostPerLead('-');
    setStatus('Active');
    setShowModal(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingSource(s);
    setSourceName(s.name || '');
    setDescription(s.description || '');
    setSourceType(s.type || 'Online');
    setCategory(s.category || 'Other');
    setCostPerLead(s.costPerLead || '-');
    setStatus(s.status || 'Active');
    setShowModal(true);
  };

  const handleSubmitSource = async (e) => {
    e.preventDefault();
    if (!sourceName.trim()) return;

    try {
      if (editingSource) {
        await api.updateLeadSource(editingSource.id, {
          name: sourceName,
          description,
          type: sourceType,
          category,
          costPerLead,
          status
        });
        if (onNotify) onNotify("Lead source updated successfully!");
      } else {
        await api.addLeadSource({
          name: sourceName,
          description,
          type: sourceType,
          category,
          costPerLead,
          status
        });
        if (onNotify) onNotify("Lead source added!");
      }
      setShowModal(false);
      loadSources();
    } catch (err) {
      alert("Failed to save lead source: " + err.message);
    }
  };

  const promptDeleteSource = (s) => {
    setConfirmConfig({
      title: "Delete Lead Source?",
      message: `Are you sure you want to permanently delete lead source "${s.name}"?`,
      confirmText: "Yes, Delete Source",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.deleteLeadSource(s.id);
          if (onNotify) onNotify("Lead source removed");
          loadSources();
        } catch (err) {
          alert("Failed to delete lead source: " + err.message);
        }
      }
    });
  };

  const handleExportCSV = () => {
    if (sources.length === 0) return alert("No sources to export");
    const headers = ["ID", "Source Name", "Description", "Type", "Category", "Cost/Lead", "Status", "Created"];
    const rows = sources.map(s => [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.description || '').replace(/"/g, '""')}"`,
      s.type || '',
      s.category || '',
      s.costPerLead || '-',
      s.status || 'Active',
      s.created || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AEERO_Lead_Sources_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSources = (sources || []).filter(s => {
    if (filterStatus !== 'All Status' && s.status !== filterStatus) return false;
    if (filterType !== 'All Types' && s.type !== filterType) return false;
    if (filterCategory !== 'All Categories' && s.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(term);
      const matchDesc = (s.description || '').toLowerCase().includes(term);
      const matchCat = (s.category || '').toLowerCase().includes(term);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredSources.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredSources.length / entriesPerPage) || 1;

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Page Title & Add Button Bar */}
      <div className={`flex justify-between items-center p-3.5 rounded-xl border shadow-xs transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">menu</span>
          <span>Lead Sources</span>
        </h2>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>+ Add Source</span>
        </button>
      </div>

      {/* Filters Collapsible Card */}
      <div className={`rounded-xl border p-4 shadow-xs space-y-3 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2.5 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
          <span className={`font-bold text-xs flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <span className="material-symbols-outlined text-xs">filter_alt</span>
            <span>Filters</span>
          </span>

          <button
            onClick={promptClearFilters}
            className="bg-[#334155] hover:bg-[#1E293B] text-white px-3 py-1.5 rounded text-[11px] font-bold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            <span>Clear All</span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className={`block uppercase font-bold text-[10px] mb-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STATUS</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full border rounded-lg p-2 font-medium outline-none transition-colors ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div>
            <label className={`block uppercase font-bold text-[10px] mb-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SOURCE TYPE</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full border rounded-lg p-2 font-medium outline-none transition-colors ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option>All Types</option>
              <option>Offline</option>
              <option>Online</option>
              <option>Paid</option>
              <option>Direct</option>
            </select>
          </div>

          <div>
            <label className={`block uppercase font-bold text-[10px] mb-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CATEGORY</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full border rounded-lg p-2 font-medium outline-none transition-colors ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option>All Categories</option>
              <option>Social Media</option>
              <option>Search Engine</option>
              <option>Event</option>
              <option>Partner</option>
              <option>Email Campaign</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={`rounded-xl border shadow-xs overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Table Action Bar */}
        <div className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b text-xs ${
          darkMode ? 'border-[#262F3D]' : 'border-slate-100'
        }`}>
          
          {/* Export & Show entries controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-3 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">file_download</span>
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-3 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-3 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">print</span>
              <span>Print</span>
            </button>

            <div className={`flex items-center gap-1 font-medium ml-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`border rounded px-2 py-1 text-xs outline-none ${
                  darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border rounded px-2.5 py-1 text-xs outline-none w-full sm:w-48 ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`font-bold uppercase text-[11px] tracking-wider border-b ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-300' : 'bg-[#0F172A] text-white border-slate-800'
              }`}>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Source Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Cost/Lead</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl animate-spin text-slate-600">sync</span>
                    <p className="mt-1">Loading lead sources...</p>
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                    No lead sources found matching filters
                  </td>
                </tr>
              ) : (
                currentEntries.map(s => (
                  <tr key={s.id} className={`transition-colors ${
                    darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50/80'
                  }`}>
                    <td className={`py-3 px-4 font-mono font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.id}</td>
                    <td className={`py-3 px-4 font-bold ${darkMode ? 'text-sky-400 hover:text-sky-300' : 'text-[#0284C7] hover:underline'} cursor-pointer`}>{s.name}</td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.description || '-'}</td>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{s.type || 'Online'}</td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.category || 'Other'}</td>
                    <td className={`py-3 px-4 text-center font-mono font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{s.costPerLead || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {s.status || 'Active'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.created || 'Jan 27, 2026'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alert(`Source ID: ${s.id}\nName: ${s.name}\nDescription: ${s.description}\nType: ${s.type}\nCategory: ${s.category}\nCost/Lead: ${s.costPerLead}`)}
                          className="w-7 h-7 rounded bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center hover:bg-sky-100 transition-colors"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="w-7 h-7 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                          title="Edit Source"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => promptDeleteSource(s)}
                          className="w-7 h-7 rounded bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-colors"
                          title="Delete Source"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className={`p-3.5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-medium transition-colors ${
          darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'
        }`}>
          <div>
            Showing {filteredSources.length > 0 ? indexOfFirst + 1 : 0} to {Math.min(indexOfLast, filteredSources.length)} of {filteredSources.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={`px-3 py-1 rounded border disabled:opacity-50 text-xs font-semibold transition-colors ${
                darkMode ? 'bg-[#181D26] border-[#262F3D] text-slate-300 hover:bg-[#1E2633]' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
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
                darkMode ? 'bg-[#181D26] border-[#262F3D] text-slate-300 hover:bg-[#1E2633]' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Add / Edit Source Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-lg p-6 space-y-4 ${
            darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingSource ? 'Edit Lead Source' : 'Add New Lead Source'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitSource} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Source Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Walk-In, Google Ads"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Cost per Lead</label>
                  <input
                    type="text"
                    placeholder="e.g. 50 or -"
                    value={costPerLead}
                    onChange={(e) => setCostPerLead(e.target.value)}
                    className={`w-full border rounded-lg p-2 font-mono outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Short channel description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full border rounded-lg p-2 outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>Offline</option>
                    <option>Online</option>
                    <option>Paid</option>
                    <option>Direct</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>Other</option>
                    <option>Social Media</option>
                    <option>Search Engine</option>
                    <option>Event</option>
                    <option>Partner</option>
                    <option>Email Campaign</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-sm"
                >
                  {editingSource ? 'Update Source' : 'Save Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        darkMode={darkMode}
        {...confirmConfig}
      />

    </div>
  );
};
