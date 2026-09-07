const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.jsx') || f.endsWith('.css'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace Tailwind blue classes with amber classes
  content = content.replace(/blue-50/g, 'amber-50');
  content = content.replace(/blue-100/g, 'amber-100');
  content = content.replace(/blue-200/g, 'amber-200');
  content = content.replace(/blue-300/g, 'amber-300');
  content = content.replace(/blue-400/g, 'amber-400');
  content = content.replace(/blue-500/g, 'amber-500');
  content = content.replace(/blue-600/g, 'amber-600');
  content = content.replace(/blue-700/g, 'amber-700');
  content = content.replace(/blue-800/g, 'amber-800');
  content = content.replace(/blue-900/g, 'amber-900');
  content = content.replace(/blue-950/g, 'amber-950');

  // Replace hardcoded #3B82F6 (Tailwind Blue 500) with a Golden color from Sidebar #D4AF37
  content = content.replace(/#3B82F6/g, '#D4AF37');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});

console.log('Done replacing colors.');
