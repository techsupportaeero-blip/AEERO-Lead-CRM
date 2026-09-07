const fs = require('fs');

let content = fs.readFileSync('./src/pages/Dashboard.jsx', 'utf-8');

if (!content.includes('import Skeleton')) {
  content = content.replace(
    "import React, { useState, useEffect, useMemo } from 'react';",
    "import React, { useState, useEffect, useMemo } from 'react';\nimport Skeleton, { TableSkeleton } from '../components/Skeleton.jsx';"
  );
}

// Replace KPI numbers
content = content.replace(/\{loading \? '\.\.\.' : /g, '{loading ? <Skeleton className="h-8 w-16 inline-block rounded" /> : ');

// Replace Loading details...
content = content.replace(
  /<p className="text-xs font-semibold mt-2 text-slate-400">Loading details\.\.\.<\/p>/g,
  '<TableSkeleton columns={5} rows={5} />'
);

fs.writeFileSync('./src/pages/Dashboard.jsx', content);
console.log('Dashboard updated');
