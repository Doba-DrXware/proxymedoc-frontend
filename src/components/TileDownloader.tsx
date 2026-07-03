'use client';

import { useState } from 'react';

function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

function tileUrl(z: number, x: number, y: number) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

export default function TileDownloader({ centerLat, centerLon }: { centerLat: number; centerLon: number }) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ count: number; bytes: number } | null>(null);

  const startDownload = async () => {
    if (!('caches' in window)) {
      setMessage('Cache API non disponible dans ce navigateur.');
      setStatus('error');
      return;
    }

    // Liste des zooms et rayon en tuiles approximatif
    const zooms = [12, 13];
    const radiusByZoom: Record<number, number> = { 12: 1, 13: 2 };

    // Construire la liste d'URL
    const urls: string[] = [];
    for (const z of zooms) {
      const cx = lon2tile(centerLon, z);
      const cy = lat2tile(centerLat, z);
      const r = radiusByZoom[z] ?? 1;
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const x = cx + dx;
          const y = cy + dy;
          urls.push(tileUrl(z, x, y));
        }
      }
    }

    setStatus('downloading');
    setProgress({ done: 0, total: urls.length });

    try {
      const cache = await caches.open('osm-tiles-v1');
      let done = 0;
      for (const url of urls) {
        try {
          const req = new Request(url, { mode: 'cors' });
          const resp = await fetch(req);
          if (resp && resp.ok) {
            await cache.put(req, resp.clone());
          }
        } catch (err) {
          // ignorer erreur individuelle
          console.warn('tile download fail', url, err);
        }
        done++;
        setProgress({ done, total: urls.length });
      }
      setStatus('done');
      setMessage(`Téléchargé ${done} tuiles.`);
    } catch (err) {
      setStatus('error');
      setMessage('Erreur durant le téléchargement des tuiles.');
      console.error(err);
    }
  };

  const registerSW = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (err) {
        console.warn('SW registration failed', err);
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const checkCache = async () => {
    if (!('caches' in window)) {
      setMessage('Cache API non disponible dans ce navigateur.');
      return;
    }
    try {
      const cache = await caches.open('osm-tiles-v1');
      const keys = await cache.keys();
      let totalBytes = 0;
      // try to estimate size by reading responses
      await Promise.all(
        keys.map(async (req) => {
          try {
            const resp = await cache.match(req);
            if (resp) {
              const buf = await resp.arrayBuffer();
              totalBytes += buf.byteLength;
            }
          } catch (err) {
            // ignore
          }
        })
      );
      setCacheInfo({ count: keys.length, bytes: totalBytes });
      setMessage(`Tiles en cache: ${keys.length} (${formatBytes(totalBytes)})`);
    } catch (err) {
      console.warn(err);
      setMessage('Impossible de lister le cache.');
    }
  };

  const clearCache = async () => {
    if (!('caches' in window)) {
      setMessage('Cache API non disponible dans ce navigateur.');
      return;
    }
    try {
      const ok = await caches.delete('osm-tiles-v1');
      setCacheInfo(null);
      setMessage(ok ? 'Cache vidé.' : 'Cache introuvable.');
    } catch (err) {
      console.warn(err);
      setMessage('Impossible de vider le cache.');
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            await registerSW();
            startDownload();
          }}
          className="btn-primary py-2 px-4 rounded-lg text-sm"
        >
          Télécharger la carte (10 km)
        </button>
        <button onClick={checkCache} className="text-sm py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">
          Vérifier cache
        </button>
        <button onClick={clearCache} className="text-sm py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">
          Vider le cache
        </button>
      </div>

      <div className="mt-3 text-sm text-slate-600">
        {status === 'downloading' && <div>Progress: {progress.done} / {progress.total}</div>}
        {status === 'done' && <div className="text-green-600">{message}</div>}
        {status === 'error' && <div className="text-red-600">{message}</div>}
        {message && status === 'idle' && <div>{message}</div>}
      </div>

      <div className="text-xs text-slate-400 mt-2">
        POC: télécharge quelques tuiles pour zoom 12-13 autour de Total Melen. Evitez d'abuser des tuiles publiques.
      </div>
    </div>
  );
}
