const fs = require('fs');
const path = require('path');

const addImport = (content, importStr) => {
  if (!content.includes('import Skeleton')) {
    return content.replace(
      "import React",
      importStr + "\nimport React"
    );
  }
  return content;
};

const processFile = (fileName, type) => {
  const filePath = path.join(__dirname, 'src', 'pages', fileName);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  content = addImport(content, "import Skeleton, { TableSkeleton, CardSkeleton } from '../components/Skeleton.jsx';");

  if (type === 'dashboard') {
    content = content.replace(/\{loading \? '\.\.\.' : /g, '{loading ? <Skeleton className="h-8 w-16 inline-block rounded" /> : ');
    content = content.replace(
      /<p className="text-xs font-semibold mt-2 text-slate-400">Loading details\.\.\.<\/p>/g,
      '<TableSkeleton columns={5} rows={5} />'
    );
  } else if (type === 'table') {
    content = content.replace(
      /<p className="mt-1">Loading[^<]*<\/p>/g,
      '<TableSkeleton columns={6} rows={8} />'
    );
    content = content.replace(
      /<p className="text-xs font-semibold mt-2">Loading[^<]*<\/p>/g,
      '<TableSkeleton columns={6} rows={8} />'
    );
    content = content.replace(
      /<p className="text-slate-500 font-medium">Loading[^<]*<\/p>/g,
      '<TableSkeleton columns={6} rows={8} />'
    );
  }

  fs.writeFileSync(filePath, content);
  console.log(`${fileName} updated`);
};

processFile('Dashboard.jsx', 'dashboard');
processFile('AllLeads.jsx', 'table');
processFile('TasksView.jsx', 'table');
processFile('KanbanBoard.jsx', 'table');
processFile('LeadSourcesView.jsx', 'table');
processFile('LeadWorkspace.jsx', 'table');
processFile('CustomersView.jsx', 'table');
processFile('CoursesView.jsx', 'table');
processFile('CalendarView.jsx', 'table');
processFile('AuditLogsView.jsx', 'table');
