const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outFile = path.join(root, 'assets.json');

function walk(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      walk(full, list);
    } else {
      const rel = path.relative(root, full).replace(/\\/g, '/');
      const stat = fs.statSync(full);
      list.push({ path: rel, name: e.name, size: stat.size, mtime: stat.mtimeMs });
    }
  }
  return list;
}

try {
  const items = walk(root);
  fs.writeFileSync(outFile, JSON.stringify(items, null, 2), 'utf8');
  console.log(`Wrote ${outFile} with ${items.length} items`);
} catch (err) {
  console.error('Error generating assets.json:', err);
  process.exit(1);
}
