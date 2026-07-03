'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store-context';
import { MapPin, Clock3, LocateFixed } from 'lucide-react';

const toKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

export default function LandingPage() {
  const { pharmacies } = useStore();
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        setPosition({ lat: currentPosition.coords.latitude, lon: currentPosition.coords.longitude });
      },
      () => {
        setGeoError('Impossible d’obtenir votre position actuelle. Les distances affichées restent celles du scénario de démonstration.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const gardeProches = useMemo(() => {
    const gardes = [...pharmacies].filter(ph => ph.garde);

    if (position) {
      return gardes
        .map((ph) => ({ ...ph, distanceCalc: toKm(position.lat, position.lon, ph.latitude, ph.longitude) }))
        .sort((a, b) => a.distanceCalc - b.distanceCalc)
        .slice(0, 3);
    }

    return gardes.sort((a, b) => a.distance - b.distance).slice(0, 3);
  }, [pharmacies, position]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5%] top-[-10%] h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[-4%] h-60 w-60 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>
      <section className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 lg:px-8 lg:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-blue-100 bg-white/80 px-4 py-3 shadow-sm shadow-blue-100/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
              <Image src="/proxymedoc-logo.png" alt="Logo ProxyMédoc" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">ProxyMédoc</p>
              <p className="text-xs text-slate-500">Pharmacie de proximité</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth" className="rounded-full border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-blue-700 hover:bg-blue-50">
              Se connecter ou s’inscrire
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Trouvez rapidement un médicament ou une pharmacie de garde proche de vous.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Cette plateforme vous aide à réduire les déplacements inutiles, améliore le repérage des pharmacies de garde et offre un parcours simple depuis la recherche jusqu’à l’accès aux informations utiles.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.35)] backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Pharmacies de garde proches</p>
                <p className="text-sm text-slate-500">Basées sur votre position actuelle</p>
              </div>
              <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                <Clock3 size={14} className="mr-1 inline" />
                Disponible maintenant
              </div>
            </div>

            {geoError ? (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <LocateFixed size={16} className="mt-0.5 flex-shrink-0" />
                <span>{geoError}</span>
              </div>
            ) : null}

            <div className="space-y-3">
              {gardeProches.map((pharmacie) => (
                <div key={pharmacie.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{pharmacie.nom}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin size={14} /> {pharmacie.adresse}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {position ? `${'distanceCalc' in pharmacie ? pharmacie.distanceCalc : pharmacie.distance} km` : `${pharmacie.distance} km`}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-white px-2.5 py-1">{pharmacie.telephone}</span>
                    <span className="rounded-full bg-white px-2.5 py-1">{pharmacie.horaires}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link href={`/patient/pharmacie/${pharmacie.id}/itineraire`} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                      Itinéraire
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
