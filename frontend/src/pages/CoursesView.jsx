import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

export const CoursesView = ({ onNotify, darkMode }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Filters State
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterDuration, setFilterDuration] = useState('All Durations');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pilot Training');
  const [duration, setDuration] = useState('1 Year');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const promptClearFilters = () => {
    setConfirmConfig({
      title: "Clear All Filters?",
      message: "Are you really sure you want to reset and clear all selected status, category, duration filters, and search keywords?",
      confirmText: "Yes, Clear All",
      type: "warning",
      onConfirm: () => {
        setFilterStatus('All Status');
        setFilterCategory('All Categories');
        setFilterDuration('All Durations');
        setSearchTerm('');
        setCurrentPage(1);
      }
    });
  };

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setCode(`CRS-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setDescription('');
    setCategory('Pilot Training');
    setDuration('1 Year');
    setPrice('1850000');
    setStatus('Active');
    setShowModal(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCourse(c);
    setCode(c.code || '');
    setName(c.name || '');
    setDescription(c.description || '');
    setCategory(c.category || 'Pilot Training');
    setDuration(c.duration || '1 Year');
    setPrice(String(c.price || ''));
    setStatus(c.status || 'Active');
    setShowModal(true);
  };

  const promptDeleteCourse = (c) => {
    setConfirmConfig({
      title: "Delete Course / Service?",
      message: `Are you sure you want to permanently delete "${c.name}" from the product offerings catalog?`,
      confirmText: "Yes, Delete Course",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.deleteCourse(c.id);
          if (onNotify) onNotify("Course removed from catalog");
          loadCourses();
        } catch (err) {
          alert("Failed to delete course: " + err.message);
        }
      }
    });
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, {
          code,
          name,
          description,
          category,
          duration,
          price: Number(price) || 0,
          status
        });
        if (onNotify) onNotify("Course updated successfully!");
      } else {
        await api.addCourse({
          code,
          name,
          description,
          category,
          duration,
          price: Number(price) || 0,
          status
        });
        if (onNotify) onNotify("Course added to catalog!");
      }
      setShowModal(false);
      loadCourses();
    } catch (err) {
      alert("Failed to save course: " + err.message);
    }
  };

  // CSV Export Helper
  const handleExportCSV = () => {
    if (courses.length === 0) return alert("No courses to export");
    const headers = ["ID", "Code", "Name", "Category", "Duration", "Tuition Fee", "Status", "Created"];
    const rows = courses.map(c => [
      c.id,
      c.code || '',
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.category || '',
      c.duration || '',
      c.price || 0,
      c.status || 'Active',
      c.created || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AEERO_Courses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtering Logic
  const filteredCourses = (courses || []).filter(c => {
    if (filterStatus !== 'All Status' && c.status !== filterStatus) return false;
    if (filterCategory !== 'All Categories' && c.category !== filterCategory) return false;
    if (filterDuration !== 'All Durations') {
      if (filterDuration === 'Under 1 Year' && (c.duration || '').includes('Year') && !(c.duration || '').includes('Months')) return false;
      if (filterDuration === '1 Year' && c.duration !== '1 Year') return false;
      if (filterDuration === 'Over 1 Year' && !(c.duration || '').includes('Years') && !(c.duration || '').includes('18 Months')) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(term);
      const matchCode = (c.code || '').toLowerCase().includes(term);
      const matchCategory = (c.category || '').toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchCategory) return false;
    }
    return true;
  });

  // Metrics Calculation
  const totalProducts = courses.length;
  const totalPriceSum = courses.reduce((sum, c) => sum + Number(c.price || 0), 0);
  const avgPrice = totalProducts > 0 ? Math.round(totalPriceSum / totalProducts) : 0;

  // Pagination
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentEntries = filteredCourses.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCourses.length / entriesPerPage) || 1;

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Page Title & Add Button Bar */}
      <div className={`flex justify-between items-center p-3.5 rounded-xl border shadow-xs transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">inventory_2</span>
          <span>Products & Services</span>
        </h2>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>+ Add Product/Service</span>
        </button>
      </div>

      {/* Top Metrics Cards Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3 transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200">
            <span className="material-symbols-outlined text-[24px]">category</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Offerings</span>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalProducts} Programs</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3 transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Average Fee</span>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>₹{avgPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3 transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Top Specialization</span>
            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Technical Diploma</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs flex items-center gap-3 transition-colors ${
          darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-200">
            <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Catalog Value</span>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>₹{totalPriceSum.toLocaleString()}</span>
          </div>
        </div>

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
            <label className={`block uppercase font-bold text-[10px] mb-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CATEGORY</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full border rounded-lg p-2 font-medium outline-none transition-colors ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option>All Categories</option>
              <option>Pilot Training</option>
              <option>Cabin Crew & Ground</option>
              <option>Engineering</option>
              <option>Safety & Officer</option>
              <option>Technical Diploma</option>
            </select>
          </div>

          <div>
            <label className={`block uppercase font-bold text-[10px] mb-1 tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DURATION</label>
            <select
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
              className={`w-full border rounded-lg p-2 font-medium outline-none transition-colors ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option>All Durations</option>
              <option>Under 1 Year</option>
              <option>1 Year</option>
              <option>Over 1 Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table / Grid */}
      <div className={`rounded-xl border shadow-xs overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        
        {/* Table Action Bar & View Switcher */}
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

            {/* View Mode Toggle: Table vs Cards Grid */}
            <div className={`flex p-0.5 rounded border ml-3 ${
              darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  viewMode === 'table' ? 'bg-[#0F172A] text-white shadow-xs' : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
                title="Table View"
              >
                <span className="material-symbols-outlined text-[14px]">table_rows</span>
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                  viewMode === 'grid' ? 'bg-[#0F172A] text-white shadow-xs' : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
                title="Grid Cards View"
              >
                <span className="material-symbols-outlined text-[14px]">grid_view</span>
                <span>Cards</span>
              </button>
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

        {/* VIEW MODE 1: DATA TABLE */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0F172A] text-white font-bold uppercase text-[11px] tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Product / Course Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Tuition Fee</th>
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
                      <p className="mt-1">Loading products & services...</p>
                    </td>
                  </tr>
                ) : currentEntries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                      No products/courses found matching filters
                    </td>
                  </tr>
                ) : (
                  currentEntries.map(c => (
                    <tr key={c.id} className={`transition-colors ${
                      darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50/80'
                    }`}>
                      <td className={`py-3 px-4 font-mono font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.id}</td>
                      <td className={`py-3 px-4 font-bold ${darkMode ? 'text-sky-400 hover:text-sky-300' : 'text-[#0284C7] hover:underline'} cursor-pointer`}>
                        {c.name}
                        <span className="block text-[10px] text-slate-400 font-normal font-mono">{c.code}</span>
                      </td>
                      <td className={`py-3 px-4 max-w-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{c.description || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                          {c.category || 'Pilot Training'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{c.duration || '1 Year'}</td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        ₹{Number(c.price || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {c.status || 'Active'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.created || 'Jan 10, 2026'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="w-7 h-7 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                            title="Edit Product"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => promptDeleteCourse(c)}
                            className="w-7 h-7 rounded bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-colors"
                            title="Delete Product"
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
        ) : (
          /* VIEW MODE 2: PRODUCT CARDS GRID */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentEntries.map(c => (
              <div key={c.id} className={`rounded-xl border p-4 shadow-xs transition-all space-y-3 flex flex-col justify-between ${
                darkMode ? 'bg-[#181D26] border-[#262F3D] hover:bg-[#1E2633]' : 'bg-white border-slate-200 hover:shadow-md'
              }`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      darkMode ? 'bg-[#12161F] text-slate-300 border-[#262F3D]' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {c.id} • {c.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.status || 'Active'}
                    </span>
                  </div>

                  <h3 className={`font-bold text-sm leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>{c.name}</h3>
                  <p className={`text-xs line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.description || 'No description provided'}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                      {c.category || 'Pilot Training'}
                    </span>
                    <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>⏱️ {c.duration || '1 Year'}</span>
                  </div>
                </div>

                <div className={`pt-3 border-t flex justify-between items-center text-xs ${
                  darkMode ? 'border-[#262F3D]' : 'border-slate-100'
                }`}>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tuition Fee</span>
                    <span className={`font-mono font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>₹{Number(c.price || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="px-2.5 py-1 bg-[#F59E0B]/10 text-amber-700 border border-amber-200 rounded text-[11px] font-bold hover:bg-amber-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => promptDeleteCourse(c)}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-bold hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Footer / Pagination */}
        <div className={`p-3.5 border-t flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-medium transition-colors ${
          darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'
        }`}>
          <div>
            Showing {filteredCourses.length > 0 ? indexOfFirst + 1 : 0} to {Math.min(indexOfLast, filteredCourses.length)} of {filteredCourses.length} entries
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-lg p-6 space-y-4 ${
            darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingCourse ? 'Edit Product/Course' : 'Add New Product/Course'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitCourse} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Pilot License (CPL)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Product Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CPL-2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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
                  placeholder="Program syllabus & training details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full border rounded-lg p-2 outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>Pilot Training</option>
                    <option>Cabin Crew & Ground</option>
                    <option>Engineering</option>
                    <option>Safety & Officer</option>
                    <option>Technical Diploma</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className={`w-full border rounded-lg p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                    <option>18 Months</option>
                    <option>3 Years</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tuition Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="1850000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`w-full border rounded-lg p-2 font-mono outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
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
                  {editingCourse ? 'Update Product' : 'Save Product'}
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
