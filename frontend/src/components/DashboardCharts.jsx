import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

// Color Palette Tailored for AEERO CRM Luxury Theme
const COLORS = {
  gold: '#7D610F',
  lightGold: '#CDB46A',
  amber: '#D97706',
  emerald: '#10B981',
  blue: '#3B82F6',
  indigo: '#6366F1',
  purple: '#8B5CF6',
  red: '#EF4444',
  slate: '#64748B'
};

const PIE_COLORS = ['#3B82F6', '#D97706', '#8B5CF6', '#10B981', '#EF4444', '#64748B', '#CDB46A'];

// Custom Tooltip Component for Sleek Styling
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs backdrop-blur-md">
        <p className="font-bold text-amber-300 mb-1 border-b border-slate-700 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5" style={{ color: entry.color || entry.fill }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.fill }}></span>
              {entry.name}:
            </span>
            <span className="font-mono font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Error Boundary to prevent any chart error from rendering a blank white page
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Chart Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
          <span className="material-symbols-outlined text-3xl text-amber-600 mb-1">analytics</span>
          <p className="text-xs font-semibold">Visual Analytics plot initialization in progress...</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardChartsInternal = ({ stats = {}, loading }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 animate-pulse">
        <span className="material-symbols-outlined text-4xl mb-2 text-amber-500">analytics</span>
        <p className="text-sm">Loading Real-time DB Interactive Charts...</p>
      </div>
    );
  }

  const safeStats = stats || {};

  // Formatting Status Data for Donut Chart
  const statusData = (safeStats.statusCounts || []).map((s, idx) => ({
    name: s?.status || 'Unknown',
    value: Number(s?.count) || 0,
    color: PIE_COLORS[idx % PIE_COLORS.length]
  }));

  // Source Data
  const sourceData = (safeStats.sourcePerformance || []).map(s => ({
    name: s?.source || 'Direct',
    Total: Number(s?.total) || 0,
    Interested: Number(s?.interested) || 0,
    Converted: Number(s?.converted) || 0
  }));

  // Employee Data
  const employeeData = (safeStats.employeePerformance || []).map(e => ({
    name: e?.name || 'Counselor',
    Assigned: Number(e?.assigned) || 0,
    Contacted: Number(e?.contacted) || 0,
    Converted: Number(e?.converted) || 0
  }));

  // Course Data (safely formatted without crashing on null/undefined)
  const courseData = (safeStats.courseDistribution || []).map((c) => {
    const courseName = c?.course ? String(c.course) : 'General Aviation';
    return {
      name: courseName.length > 18 ? courseName.substring(0, 16) + '...' : courseName,
      fullName: courseName,
      Leads: Number(c?.count) || 0
    };
  });

  // Trend Data
  const trendData = safeStats.leadTrend || [];

  return (
    <div className="space-y-6">

      {/* Chart Section Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7D610F]">bar_chart</span>
            <span>Interactive Analytics & Visual Plots Suite</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Real-time database visualization of lead conversion, acquisition channels, and performance</p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold self-stretch sm:self-auto justify-stretch">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none ${activeTab === 'overview'
                ? 'bg-white text-[#7D610F] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Overview Charts
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none ${activeTab === 'sources'
                ? 'bg-white text-[#7D610F] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Acquisition & Counselor
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Plot 1: Monthly Acquisition & Conversion Trend (Area Chart) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">show_chart</span>
                  <span>Monthly Lead Influx & Conversion Growth</span>
                </h3>
                <p className="text-[11px] text-slate-500">Historical trend showing total volume vs converted students</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                Timeline Area Plot
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="total" name="Total Influx" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="converted" name="Enrolled Admissions" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConverted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plot 2: Status Breakdown Donut Chart */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-lg">pie_chart</span>
                  <span>Lead Pipeline Status Breakdown</span>
                </h3>
                <p className="text-[11px] text-slate-500">Distribution across CRM stage categories</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                Donut Plot
              </span>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {statusData.length === 0 ? (
                <p className="text-xs text-slate-400">No status metrics available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Plot 3: Course Interest Distribution Bar Chart */}
          <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7D610F] text-lg">flight_takeoff</span>
                  <span>Aviation Program Interest & Course Demand</span>
                </h3>
                <p className="text-[11px] text-slate-500">Lead count segmented by selected training courses</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-50 text-[#7D610F] rounded-md border border-[#CDB46A]/40">
                Course Demand Bar Plot
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Leads" fill="#7D610F" radius={[6, 6, 0, 0]} barSize={36}>
                    {courseData.map((entry, index) => (
                      <Cell key={`course-cell-${index}`} fill={index % 2 === 0 ? '#7D610F' : '#CDB46A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Plot 4: Source Acquisition & Conversion Funnel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 text-lg">hub</span>
                  <span>Lead Source Acquisition & Conversion Funnel</span>
                </h3>
                <p className="text-[11px] text-slate-500">Compare Total, Interested, and Converted leads per channel</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                Grouped Bar Plot
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Interested" fill="#D97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Converted" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plot 5: Counselor Performance (Horizontal Bar Chart) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">badge</span>
                  <span>Counselor Productivity & Conversion Efficiency</span>
                </h3>
                <p className="text-[11px] text-slate-500">Comparison of assigned leads, contacted, and admissions closed</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                Horizontal Plot
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={employeeData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Assigned" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Contacted" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Converted" fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export const DashboardCharts = (props) => (
  <ChartErrorBoundary>
    <DashboardChartsInternal {...props} />
  </ChartErrorBoundary>
);
