#!/usr/bin/env node
// Simple tile downloader for a small area around a center point.
// Usage: node scripts/download-tiles.js --lat=3.8841 --lon=11.4945 --zooms=12,13 --radius=1

const fs = require('fs');
const path = require('path');
const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(arg => {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom));
}

function tileUrl(z, x, y) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function mkdirpSync(dir) {
  if (!fs.existsSync(dir)) {
    mkdirpSync(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error('Failed to download ' + url + ' status ' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch(e) {}
      reject(err);
    });
  });
}

(async function main() {
  const args = parseArgs();
  const lat = parseFloat(args.lat || '3.8841');
  const lon = parseFloat(args.lon || '11.4945');
  const zooms = (args.zooms || '12,13').split(',').map(z => parseInt(z,10));
  const radius = parseInt(args.radius || '1', 10);
  const outDir = path.join(process.cwd(), 'public', 'tiles');

  const tasks = [];
  for (const z of zooms) {
    const cx = lon2tile(lon, z);
    const cy = lat2tile(lat, z);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = cx + dx;
        const y = cy + dy;
        const dir = path.join(outDir, String(z), String(x));
        const dest = path.join(dir, `${y}.png`);
        mkdirpSync(dir);
        const url = tileUrl(z, x, y);
        tasks.push({ url, dest });
      }
    }
  }

  console.log(`Downloading ${tasks.length} tiles to ${outDir}`);

  let i = 0;
  for (const t of tasks) {
    i++;
    try {
      process.stdout.write(`[${i}/${tasks.length}] ${t.url} -> ${t.dest}\n`);
      await download(t.url, t.dest);
    } catch (err) {
      console.error('Error', err.message);
    }
  }

  console.log('Done');
})();
