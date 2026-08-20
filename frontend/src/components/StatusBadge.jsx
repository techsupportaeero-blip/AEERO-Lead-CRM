import React from 'react';
import { getStatusLabel, getStatusCode } from '../config/constants';

export const StatusBadge = ({ status, darkMode }) => {
  const code = getStatusCode(status);
  const label = getStatusLabel(status);

  const getStyle = (c, rawLabel) => {
    const s = (rawLabel || status || '').toLowerCase();
    if (s.includes('new') || c === 'NEW')
      return darkMode
        ? 'bg-sky-900/40 text-sky-300 border-sky-700/50'
        : 'bg-sky-100 text-sky-700 border-sky-200';
    if (s.includes('no answer') || s.includes('no_answer') || c === 'NO_ANSWER')
      return darkMode
        ? 'bg-slate-800/60 text-slate-300 border-slate-600/50'
        : 'bg-slate-100 text-slate-700 border-slate-200';
    if (s.includes('lost') || c === 'LOST')
      return darkMode
        ? 'bg-rose-900/40 text-rose-300 border-rose-700/50'
        : 'bg-rose-100 text-rose-700 border-rose-200';
    if (s.includes('won') || c === 'WON')
      return darkMode
        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('proposal') || c === 'PROPOSAL_SENT')
      return darkMode
        ? 'bg-purple-900/40 text-purple-300 border-purple-700/50'
        : 'bg-purple-100 text-purple-700 border-purple-200';
    if (s.includes('negotiat') || c === 'NEGOTIATION')
      return darkMode
        ? 'bg-amber-900/40 text-amber-300 border-amber-700/50'
        : 'bg-amber-100 text-amber-800 border-amber-300';
    if (s.includes('qualifi') || c === 'QUALIFIED')
      return darkMode
        ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('contacted') || c === 'CONTACTED')
      return darkMode
        ? 'bg-amber-900/30 text-amber-300 border-amber-700/40'
        : 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('interested') || c === 'INTERESTED')
      return darkMode
        ? 'bg-amber-900/40 text-amber-200 border-amber-600/50'
        : 'bg-amber-100 text-amber-800 border-amber-300';
    if (s.includes('converted') || c === 'CONVERTED')
      return darkMode
        ? 'bg-emerald-900/40 text-emerald-200 border-emerald-600/50'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s.includes('details') || c === 'GIVEN_DETAILS')
      return darkMode
        ? 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50'
        : 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (s.includes('follow') || c === 'FOLLOW_UP')
      return darkMode
        ? 'bg-orange-900/40 text-orange-300 border-orange-700/50'
        : 'bg-orange-100 text-orange-800 border-orange-200';
    return darkMode
      ? 'bg-slate-800/60 text-slate-300 border-slate-600/50'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStyle(code, status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority, darkMode }) => {
  const getStyle = (p) => {
    switch (p) {
      case 'Urgent':
        return darkMode
          ? 'bg-red-900/40 text-red-300 border-red-700/50 font-bold'
          : 'bg-red-100 text-red-700 border-red-200 font-bold';
      case 'High':
        return darkMode
          ? 'bg-rose-900/40 text-rose-300 border-rose-700/50 font-semibold'
          : 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'Medium':
        return darkMode
          ? 'bg-amber-900/30 text-amber-300 border-amber-700/40 font-medium'
          : 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      case 'Low':
        return darkMode
          ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40 font-medium'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      default:
        return darkMode
          ? 'bg-slate-800/60 text-slate-300 border-slate-600/50'
          : 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${getStyle(priority)}`}>
      {priority || 'Medium'}
    </span>
  );
};
