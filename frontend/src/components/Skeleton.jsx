import React from 'react';

const Skeleton = ({ className = '', variant = 'text' }) => {
  // Base classes for the skeleton animation
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700/50';
  
  // Variant specific classes
  const variants = {
    text: 'h-4 rounded w-3/4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    button: 'h-10 rounded-lg w-32',
    avatar: 'h-10 w-10 rounded-full'
  };

  const variantClass = variants[variant] || variants.text;

  return (
    <div className={`${baseClasses} ${variantClass} ${className}`}></div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2021]">
      <div className="flex bg-slate-50 dark:bg-[#1A1C1E] border-b border-slate-200 dark:border-slate-800 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 pr-4">
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex p-4 items-center">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 pr-4">
                <Skeleton className={`h-4 ${colIndex === 0 ? 'w-3/4' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-4 md:p-6 bg-white dark:bg-[#1E2021] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Skeleton className="w-1/3 h-5" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton className="w-1/2 h-8 mt-2" />
      <Skeleton className="w-1/4 h-4 mt-1" />
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 8, rows = 10 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100 dark:border-[#222936]">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-3">
              <Skeleton className={`h-4 ${colIndex === 0 ? 'w-3/4' : 'w-full'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default Skeleton;
