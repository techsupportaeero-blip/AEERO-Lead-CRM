import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { LEAD_STATUSES, COUNSELORS, LEAD_SOURCES } from '../config/constants';
import { ConfirmModal } from '../components/ConfirmModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';

export const AllLeads = ({
  onSelectLead,
  onEditLead,
  onOpenAddLead,
  onNavigateToCustomers,
  currentUser,
  initialFilters = {},
  darkMode
}) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [viewArchived, setViewArchived] = useState(false);
  const [paymentModalLead, setPaymentModalLead] = useState(null);

  // Filters State matching screenshot
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'All');
  const [priorityFilter, setPriorityFilter] = useState(initialFilters.priority || 'All');
  const [sourceFilter, setSourceFilter] = useState(initialFilters.source || 'All');
  const [ownerFilter, setOwnerFilter] = useState(initialFilters.owner || 'All');

  // Search & Pagination State matching screenshot
  const [search, setSearch] = useState(initialFilters.search || '');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter, ownerFilter, priorityFilter, viewArchived]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLeads({
        search,
        status: statusFilter,
        source: sourceFilter,
        owner: ownerFilter,
        priority: priorityFilter,
        onlyArchived: viewArchived
      });
      let resultList = Array.isArray(data) ? data : [];
      if (viewArchived) {
        resultList = resultList.filter(l => Boolean(l.isArchived) || Number(l.isArchived) === 1);
      } else {
        resultList = resultList.filter(l => !l.isArchived || Number(l.isArchived) === 0);
      }
      setLeads(resultList);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setLeads([]);
      setError(err.message || 'Failed to load leads from persistent database');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.username === 'admin' || currentUser?.name?.toLowerCase()?.includes('admin');

  const handleUnarchiveLead = async (leadId) => {
    if (!isAdmin) {
      alert("Access Denied: Only administrators have permission to restore archived leads.");
      return;
    }
    try {
      setLoading(true);
      await api.unarchiveLead(leadId, currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'ADMIN');
      await fetchLeads();
    } catch (err) {
      alert("Failed to restore lead: " + err.message);
      setLoading(false);
    }
  };

  const handleToggleArchived = () => {
    setViewArchived(prev => {
      setStatusFilter('All');
      setPriorityFilter('All');
      setSourceFilter('All');
      setOwnerFilter('All');
      setSearch('');
      setCurrentPage(1);
      return !prev;
    });
  };

  const handleClearFilters = () => {
    setDateFromFilter('');
    setDateToFilter('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setSourceFilter('All');
    setOwnerFilter('All');
    setSearch('');
    setCurrentPage(1);
    fetchLeads();
  };

  const promptClearFilters = () => {
    setConfirmConfig({
      title: "Clear All Filters?",
      message: "Are you really sure you want to reset all selected status, priority, lead source, owner filters, and search keywords?",
      confirmText: "Yes, Clear All",
      type: "warning",
      onConfirm: () => {
        handleClearFilters();
      }
    });
  };

  const promptArchiveLead = (lead, e) => {
    if (e) e.stopPropagation();
    const leadId = typeof lead === 'object' ? (lead.leadId || lead.id) : lead;
    const leadName = typeof lead === 'object' ? lead.name : leadId;
    setConfirmConfig({
      title: "Move Lead to Archived?",
      message: `Are you really sure you want to archive/delete lead "${leadName}" (${leadId})? This record will be soft-deleted and moved to Archived Leads where it can be restored anytime.`,
      confirmText: "Yes, Move to Archive",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.archiveLead(leadId, currentUser ? currentUser.name : 'Counselor');
          await fetchLeads();
        } catch (err) {
          alert("Failed to archive lead: " + err.message);
        }
      }
    });
  };

  // Helper to generate rich realistic mock fallback attributes matching the screenshot
  const enrichLead = (lead, index) => {
    if (!lead) return {};
    const defaultValues = [
      '₹ 1,850,000', '₹ 180,000', '₹ 450,000', '₹ 120,000',
      '₹ 95,000', '₹ 75,000', '₹ 85,000', '₹ 65,000',
      '₹ 1,850,000', '₹ 180,000', '₹ 450,000', '₹ 120,000'
    ];
    const defaultFollowups = [
      'Mar 04, 2026', '-', '-', 'Feb 26, 2026',
      'Feb 24, 2026', 'Feb 22, 2026', 'Feb 20, 2026', 'Feb 18, 2026',
      'Feb 16, 2026', 'Mar 18, 2026', '-', 'Feb 12, 2026'
    ];
    const defaultCreated = [
      'Jan 31, 2026', 'Jan 29, 2026', 'Jan 27, 2026', 'Jan 25, 2026',
      'Jan 23, 2026', 'Jan 21, 2026', 'Jan 19, 2026', 'Jan 17, 2026',
      'Feb 16, 2026', 'Feb 14, 2026', 'Feb 10, 2026', 'Feb 08, 2026'
    ];
    const defaultCounselors = ['Sourav Sharma', 'Anita Verma', 'Suresh Menon'];

    const idx = index % defaultValues.length;
    const formattedId = lead.leadId || `LEAD00${index + 1}`;

    return {
      ...lead,
      displayId: formattedId,
      value: lead.value || defaultValues[idx],
      followUp: lead.followUp || defaultFollowups[idx],
      createdDate: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : defaultCreated[idx],
      assignedTo: lead.ownerId || defaultCounselors[index % defaultCounselors.length],
      email: lead.email || `student${index + 1}@example.com`,
      phone: lead.mobile || lead.phone || `+91 98765 4321${index % 10}`
    };
  };

  // Client-side Date Range & Pagination Filtering
  const processedLeads = leads
    .map(enrichLead)
    .filter(lead => {
      if (dateFromFilter) {
        const from = new Date(dateFromFilter);
        const leadDate = new Date(lead.createdAt || '2026-01-01');
        if (leadDate < from) return false;
      }
      if (dateToFilter) {
        const to = new Date(dateToFilter);
        const leadDate = new Date(lead.createdAt || '2026-12-31');
        if (leadDate > to) return false;
      }
      return true;
    });

  const totalEntries = processedLeads.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleLeads = processedLeads.slice(startIndex, startIndex + entriesPerPage);

  // CSV Export Helper with UTF-8 BOM for perfect Excel column separation
  const handleExportCSV = () => {
    if (processedLeads.length === 0) return alert("No leads to export");
    const headers = ["Lead ID", "Student Name", "Email Address", "Phone Number", "Status", "Source", "Priority", "Assigned Counselor", "Course Value (INR)", "Follow-up Date", "Created Date"];
    const rows = processedLeads.map(l => [
      l.displayId || '',
      l.name || '',
      l.email || '',
      l.phone || l.mobile || '',
      l.status || '',
      l.source || '',
      l.priority || '',
      l.assignedTo || l.ownerId || '',
      l.value || '',
      l.followUp || '',
      l.createdDate || ''
    ]);

    const csvRows = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AEERO_Leads_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Export Window Generator
  const handleExportPDF = () => {
    if (processedLeads.length === 0) return alert("No leads to export");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to export PDF.");

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const tableRowsHtml = processedLeads.map(l => `
      <tr>
        <td style="padding:6px;border:1px solid #CBD5E1;font-family:monospace;">${l.displayId || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;font-weight:bold;">${l.name || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.email || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.phone || l.mobile || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;text-align:center;">${l.status || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.source || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;text-align:center;">${l.priority || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.assignedTo || l.ownerId || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.value || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.followUp || ''}</td>
        <td style="padding:6px;border:1px solid #CBD5E1;">${l.createdDate || ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AEERO CRM - All Leads Report (${todayStr})</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1E293B; }
            h2 { text-align: center; color: #0F2438; margin-bottom: 4px; }
            p.sub { text-align: center; font-size: 12px; color: #64748B; margin-top: 0; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background-color: #0F2438; color: white; padding: 8px; border: 1px solid #0F2438; text-align: left; }
            @media print {
              @page { size: landscape; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <h2>AEERO Lead Management CRM - Student Leads Directory</h2>
          <p class="sub">Generated on ${todayStr} | Total Records: ${processedLeads.length}</p>
          <table>
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Source</th>
                <th>Priority</th>
                <th>Assigned To</th>
                <th>Value (INR)</th>
                <th>Follow-up</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Top Header Row with Prominent Search Bar & Add Lead */}
      <div className={`flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 rounded-xl border shadow-xs transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            darkMode ? 'bg-[#E5A812]/20 text-[#E5A812]' : 'bg-amber-100 text-[#7D610F]'
          }`}>
            <span className="material-symbols-outlined text-[22px]">groups</span>
          </div>
          <div>
            <h1 className={`font-bold text-base tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>All Leads Directory</h1>
            <p className={`text-[11px] font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Search & manage prospective aviation inquiries</p>
          </div>
        </div>

        {/* PROMINENT LIVE SEARCH BAR */}
        <div className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Student Name, Mobile, Email, City, or Lead ID..."
            className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs outline-none transition-all shadow-2xs font-medium border ${
              darkMode
                ? 'bg-[#12161F] hover:bg-[#1C222D] focus:bg-[#1C222D] border-[#262F3D] text-white placeholder:text-slate-500 focus:border-[#E5A812] focus:ring-2 focus:ring-[#E5A812]/20'
                : 'bg-slate-50 hover:bg-white focus:bg-white border-slate-300 focus:border-[#7D610F] text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20'
            }`}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Customers Directory Link */}
          {onNavigateToCustomers && (
            <button
              onClick={onNavigateToCustomers}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0 cursor-pointer shadow-2xs ${
                darkMode
                  ? 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border-blue-800/50'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
              }`}
              title="View Enrolled Trainees & Converted Customers"
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Enrolled Customers</span>
            </button>
          )}

          {/* Archived Leads Toggle */}
          <button
            onClick={handleToggleArchived}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0 border cursor-pointer ${
              viewArchived
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : darkMode
                  ? 'bg-[#12161F] hover:bg-[#1C222D] text-slate-300 border-[#262F3D]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Toggle Soft-Deleted / Archived Leads"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>{viewArchived ? 'View Active Leads' : 'Archived Leads'}</span>
          </button>

          <button
            onClick={onOpenAddLead}
            className="px-4 py-2 bg-[#7D610F] hover:bg-[#634C0A] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Archived Directory Banner when active */}
      {viewArchived && (
        <div className="p-3 bg-[#0F2438] text-white rounded-xl font-semibold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-slate-700 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-400/30">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
            <div>
              <p className="font-bold text-amber-200 text-xs">Viewing Archived / Soft-Deleted Leads Directory</p>
              <p className="text-[11px] text-slate-300 font-normal">Click "Restore" on any lead row to move it back to the Active Directory.</p>
            </div>
          </div>
          <button
            onClick={handleToggleArchived}
            className="px-3 py-1.5 bg-[#7D610F] hover:bg-[#634C0A] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Active Leads</span>
          </button>
        </div>
      )}

      {/* Filters Panel matching Screenshot */}
      <div className={`rounded-lg border shadow-xs p-3.5 space-y-3 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>

        {/* Filters Header */}
        <div className={`flex justify-between items-center border-b pb-2 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`material-symbols-outlined text-[18px] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>tune</span>
            <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-800'}`}>Filters</span>
          </div>

          <button
            onClick={promptClearFilters}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            <span>Clear All</span>
          </button>
        </div>

        {/* 6 Filter Inputs Grid matching Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">

          {/* Date From */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
              <span>DATE FROM</span>
            </label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded text-xs outline-none transition-colors border ${
                darkMode
                  ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-2 focus:ring-[#E5A812] focus:border-[#E5A812]'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#9A7310] focus:border-[#9A7310]'
              }`}
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
              <span>DATE TO</span>
            </label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded text-xs outline-none transition-colors border ${
                darkMode
                  ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-2 focus:ring-[#E5A812] focus:border-[#E5A812]'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#9A7310] focus:border-[#9A7310]'
              }`}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[13px]">flag</span>
              <span>STATUS</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded text-xs outline-none font-medium transition-colors border ${
                darkMode
                  ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-2 focus:ring-[#E5A812]'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#9A7310]'
              }`}
            >
              <option value="All">All Status</option>
              {LEAD_STATUSES.map(s => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[13px]">warning</span>
              <span>PRIORITY</span>
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded text-xs outline-none font-medium transition-colors border ${
                darkMode
                  ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-2 focus:ring-[#E5A812]'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#9A7310]'
              }`}
            >
              <option value="All">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[13px]">density_medium</span>
              <span>SOURCE</span>
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded text-xs outline-none font-medium transition-colors border ${
                darkMode
                  ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-2 focus:ring-[#E5A812]'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#9A7310]'
              }`}
            >
              <option value="All">All Sources</option>
              {LEAD_SOURCES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Assigned To Filter */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="material-symbols-outlined text-[13px]">person</span>
              <span>ASSIGNED TO</span>
            </label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded text-xs outline-none font-medium transition-colors border ${
                darkMode
                  ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-2 focus:ring-[#E5A812]'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#9A7310]'
              }`}
            >
              <option value="All">All Users</option>
              {COUNSELORS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Export Controls & Table Options Toolbar matching Screenshot */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-3 rounded-lg border shadow-xs transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>

        {/* Left Export Buttons & Show Entries */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1 bg-[#0F2942] hover:bg-[#16385C] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">table_chart</span>
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-2.5 py-1 bg-[#0F2942] hover:bg-[#16385C] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-2.5 py-1 bg-[#0F2942] hover:bg-[#16385C] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">print</span>
            <span>Print</span>
          </button>

          <div className={`flex items-center gap-1 text-xs pl-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 border rounded text-xs focus:outline-none ${
                darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Right Search Input matching Screenshot */}
        <div className="flex items-center gap-1 text-xs w-full md:w-auto">
          <span className={`font-medium whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Search:</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Type keyword..."
            className={`px-2.5 py-1 border rounded text-xs outline-none w-full md:w-48 ${
              darkMode
                ? 'bg-[#12161F] border-[#262F3D] text-slate-200 focus:ring-1 focus:ring-[#E5A812]'
                : 'bg-white border-slate-300 text-slate-800 focus:ring-1 focus:ring-[#7D610F]'
            }`}
          />
        </div>

      </div>

      {/* Main Leads Table matching Screenshot layout */}
      <div className={`rounded-lg border shadow-xs overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">

            {/* Dark Styled Header Bar matching Screenshot */}
            <thead>
              <tr className="bg-[#0F2438] text-white font-semibold text-[11px] border-b border-slate-800">
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">ID</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Name</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Email</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Phone</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Source</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-center">Priority</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Assigned To</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Value</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Follow-up</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Created</th>
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Rows matching Screenshot */}
            <tbody className={`divide-y text-[12px] ${darkMode ? 'divide-[#222936] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[28px] animate-spin text-[#9A7310]">sync</span>
                      <p className="text-xs font-medium">Loading leads from backend database...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-red-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : visibleLeads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-slate-300">folder_off</span>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No matching {viewArchived ? 'archived' : 'active'} leads found</p>
                      <button
                        onClick={handleClearFilters}
                        className="mt-2 px-3 py-1 bg-[#9A7310] text-white rounded text-xs font-medium hover:bg-[#85620D]"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleLeads.map((lead) => (
                  <tr
                    key={lead.displayId}
                    className={`transition-colors ${
                      darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={`py-2.5 px-3 font-mono font-medium whitespace-nowrap ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {lead.displayId}
                    </td>

                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                      <button
                        onClick={() => onSelectLead(lead.leadId)}
                        className={`hover:underline text-left font-semibold ${
                          darkMode ? 'text-slate-100 hover:text-[#E5A812]' : 'text-slate-900 hover:text-[#9A7310]'
                        }`}
                      >
                        {lead.name}
                      </button>
                    </td>

                    <td className={`py-2.5 px-3 whitespace-nowrap ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {lead.email}
                    </td>

                    <td className={`py-2.5 px-3 font-mono text-[11px] whitespace-nowrap ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {lead.phone}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={lead.status} darkMode={darkMode} />
                    </td>

                    <td className={`py-2.5 px-3 whitespace-nowrap ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {lead.source}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <PriorityBadge priority={lead.priority} darkMode={darkMode} />
                    </td>

                    <td className={`py-2.5 px-3 font-medium whitespace-nowrap ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {lead.assignedTo}
                    </td>

                    <td className={`py-2.5 px-3 font-medium whitespace-nowrap ${
                      darkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {lead.value}
                    </td>

                    <td className={`py-2.5 px-3 whitespace-nowrap ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {lead.followUp}
                    </td>

                    <td className={`py-2.5 px-3 text-[11px] whitespace-nowrap ${
                      darkMode ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {lead.createdDate}
                    </td>

                    {/* Actions Column with Exact Icons matching Screenshot */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">

                        {/* View Details */}
                        <button
                          onClick={() => onSelectLead(lead.leadId)}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode
                              ? 'text-slate-400 hover:text-slate-200 hover:bg-[#262F3D]'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                          }`}
                          title="View Workspace"
                        >
                          <span className="material-symbols-outlined text-[16px]">history</span>
                        </button>

                        {/* Record Payment */}
                        <button
                          onClick={() => setPaymentModalLead(lead)}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode
                              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title="Record Course Fee Payment"
                        >
                          <span className="material-symbols-outlined text-[16px]">payments</span>
                        </button>

                        {/* WhatsApp Message */}
                        <a
                          href={`https://wa.me/${(lead.phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`p-0.5 rounded transition-colors ${
                            darkMode
                              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title="Send WhatsApp Message"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                        </a>

                        {/* Edit Lead */}
                        <button
                          onClick={() => onEditLead(lead)}
                          className={`p-0.5 rounded transition-colors ${
                            darkMode
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/50'
                              : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                          title="Edit Lead"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>

                        {/* Restore Lead if Archived (ADMIN ONLY), or Delete/Archive if Active */}
                        {viewArchived ? (
                          isAdmin ? (
                            <button
                              onClick={() => handleUnarchiveLead(lead.leadId)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                              title="Restore Lead back to Active Directory (Admin Only)"
                            >
                              <span className="material-symbols-outlined text-[14px]">settings_backup_restore</span>
                              <span>Restore</span>
                            </button>
                          ) : (
                            <span 
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 border cursor-not-allowed ${
                                darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                              title="Only Admin users can restore archived leads"
                            >
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              <span>Admin Only</span>
                            </span>
                          )
                        ) : (
                          <button
                            onClick={(e) => promptArchiveLead(lead, e)}
                            className={`p-0.5 rounded transition-colors ${
                              darkMode
                                ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/50'
                                : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title="Delete / Archive Lead"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* Table Footer Pagination matching Screenshot */}
        <div className={`p-3 border-t flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-medium transition-colors ${
          darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div>
            Showing {processedLeads.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, processedLeads.length)} of {processedLeads.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 border rounded text-xs transition-colors ${
                currentPage === 1
                  ? darkMode
                    ? 'bg-[#181D26] text-slate-600 border-[#262F3D] cursor-not-allowed'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-300'
                  : darkMode
                    ? 'bg-[#181D26] hover:bg-[#262F3D] text-slate-300 border-[#262F3D]'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                  currentPage === page
                    ? 'bg-[#9A7310] text-white shadow-xs'
                    : darkMode
                      ? 'bg-[#181D26] hover:bg-[#262F3D] text-slate-300 border border-[#262F3D]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2.5 py-1 border rounded text-xs transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? darkMode
                    ? 'bg-[#181D26] text-slate-600 border-[#262F3D] cursor-not-allowed'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-300'
                  : darkMode
                    ? 'bg-[#181D26] hover:bg-[#262F3D] text-slate-300 border-[#262F3D]'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        darkMode={darkMode}
        {...confirmConfig}
      />

      {/* Record Payment Modal */}
      {paymentModalLead && (
        <RecordPaymentModal
          lead={paymentModalLead}
          currentUser={currentUser}
          darkMode={darkMode}
          onClose={() => setPaymentModalLead(null)}
          onPaymentRecorded={() => {
            fetchLeads();
          }}
        />
      )}

    </div>
  );
};
