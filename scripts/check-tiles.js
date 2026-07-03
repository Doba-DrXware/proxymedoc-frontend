const fs = require('fs');
const path = require('path');
const tilesDir = path.join(process.cwd(), 'public', 'tiles');

function listDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      listDir(p);
    } else {
      const buf = fs.readFileSync(p);
      const header = buf.slice(0, 8).toString('latin1');
      const type = header === '\u0089PNG\r\n\u001a\n' ? 'PNG' : buf.toString('utf8', 0, 20).trim().startsWith('<') ? 'HTML' : 'OTHER';
      console.log(p.replace(process.cwd() + path.sep, ''), buf.length, type);
    }
  }
}

listDir(tilesDir);
