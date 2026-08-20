import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const CustomersView = ({ onSelectLead, darkMode }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Header */}
      <div className={`p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F]">group</span>
            <span>Enrolled Students & Converted Customers</span>
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Directory of converted aviation trainees, enrolled students, and fee records</p>
        </div>

        <div className="w-full sm:w-64 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search student or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full border rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#7D610F] transition-colors ${
              darkMode ? 'bg-[#12161F] border-[#262F3D] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
            <p className="text-xs font-semibold mt-2">Loading customer records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-xs font-medium">No customer records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0F2438] text-white font-bold uppercase text-[11px]">
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
                {filtered.map(c => (
                  <tr key={c.customerId} className={`transition-colors ${
                    darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3 px-4 font-mono font-bold text-[#7D610F]">
                      CUST-{String(c.customerId).padStart(4, '0')}
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
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Jan 15, 2026'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectLead && onSelectLead(`LD-${String(c.customerId).padStart(6, '0')}`)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto ${
                          darkMode 
                            ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 border border-amber-800/40' 
                            : 'bg-amber-50 hover:bg-amber-100 text-[#7D610F] border border-amber-200'
                        }`}
                        title="View Student Lead Workspace"
                      >
                        <span className="material-symbols-outlined text-[16px]">history</span>
                        <span>View Lead</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
