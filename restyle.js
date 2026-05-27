const fs = require('fs');
const path = require('path');

const mappings = {
  'bg-gray-950': 'bg-slate-50',
  'bg-gray-900': 'bg-white',
  'bg-gray-800': 'bg-slate-100',
  'border-gray-800': 'border-slate-200',
  'border-gray-700': 'border-slate-300',
  'text-white': 'text-tech-blue',
  'text-gray-400': 'text-slate-500',
  'text-gray-500': 'text-slate-500',
  'text-gray-300': 'text-slate-600',
  'text-amber-500': 'text-vial-orange',
  'bg-amber-500': 'bg-vial-orange',
  'border-amber-500': 'border-vial-orange',
  'hover:text-amber-400': 'hover:opacity-80',
  'hover:bg-amber-400': 'hover:opacity-90',
  'text-blue-500': 'text-tech-blue',
  'text-blue-600': 'text-tech-blue',
  'bg-blue-600': 'bg-tech-blue',
  'bg-blue-500': 'bg-tech-blue',
  'hover:bg-gray-700': 'hover:bg-slate-200',
  'hover:border-gray-700': 'hover:border-slate-300'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const [key, value] of Object.entries(mappings)) {
        // Simple global replacement
        // Note: we might want to use word boundaries but class names have hyphens.
        // We'll replace the string directly.
        if (content.includes(key)) {
          content = content.split(key).join(value);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Restyling complete.');
