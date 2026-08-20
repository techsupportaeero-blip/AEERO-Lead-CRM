import React from 'react';
import { getStatusLabel, getStatusCode } from '../config/constants';

export const StatusBadge = ({ status }) => {
  const code = getStatusCode(status);
  const label = getStatusLabel(status);

  const getStyle = (c, rawLabel) => {
    const s = (rawLabel || status || '').toLowerCase();
    if (s.includes('new') || c === 'NEW') return 'bg-sky-100 text-sky-700 border-sky-200';
    if (s.includes('lost') || c === 'LOST') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (s.includes('won') || c === 'WON') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('proposal') || c === 'PROPOSAL_SENT') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s.includes('negotiat') || c === 'NEGOTIATION') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s.includes('qualifi') || c === 'QUALIFIED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('contacted') || c === 'CONTACTED') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('interested') || c === 'INTERESTED') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s.includes('converted') || c === 'CONVERTED') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s.includes('details') || c === 'GIVEN_DETAILS') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (s.includes('follow') || c === 'FOLLOW_UP') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStyle(code, status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const getStyle = (p) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-200 font-bold';
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${getStyle(priority)}`}>
      {priority || 'Medium'}
    </span>
  );
};

