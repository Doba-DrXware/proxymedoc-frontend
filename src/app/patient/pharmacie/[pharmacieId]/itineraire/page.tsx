'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { pharmacies } from '@/lib/data';
import { ArrowLeft, MapPin, Clock, Phone, ExternalLink } from 'lucide-react';

const TileDownloader = dynamic(() => import('@/components/TileDownloader'), { ssr: false });

interface ItinerairePageProps {
  params: Promise<{ pharmacieId: string }>;
}

export default function PatientPharmacieItinerairePage({ params }: ItinerairePageProps) {
  const router = useRouter();
  const routeParams = use(params);
  const pharmacieId = Number(routeParams.pharmacieId);
  const pharmacy = useMemo(
    () => pharmacies.find(ph => ph.id === pharmacieId),
    [pharmacieId]
  );

  const userPosition: [number, number] = [3.8841, 11.4945];

  if (!pharmacy) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-800 mb-3">Pharmacie introuvable</h1>
          <p className="text-sm text-slate-500 mb-5">
            Impossible de trouver la pharmacie demandée.
          </p>
          <button onClick={() => router.push('/patient')} className="btn-primary py-2.5 px-5 rounded-lg text-sm font-medium">
            Retour à la recherche
          </button>
        </div>
      </main>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userPosition[0]},${userPosition[1]}&destination=${pharmacy.latitude},${pharmacy.longitude}&travelmode=driving`;

  return (
    <main className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Carte intégrée</p>
            <h1 className="text-2xl font-semibold text-slate-900">Itinéraire vers la pharmacie</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-500">Pharmacie sélectionnée</p>
                <h2 className="text-xl font-semibold text-slate-900">{pharmacy.nom}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-2">
                  <MapPin size={14} /> {pharmacy.adresse}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Ouverture directe dans Google Maps</p>
                    <p className="mt-1 text-slate-600">L’itinéraire s’ouvre dans Google Maps avec votre position de départ et la pharmacie comme destination.</p>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <ExternalLink size={16} /> Ouvrir l’itinéraire
                  </a>
                </div>
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                <p>Position par défaut : Total Melen, Yaoundé</p>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Détails</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {pharmacy.adresse}</p>
                <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {pharmacy.horaires}</p>
                <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {pharmacy.telephone}</p>
              </div>
              <div className="mt-4">
                <TileDownloader centerLat={3.8841} centerLon={11.4945} />
              </div>
              <Link
                href="/patient"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Retour à la recherche
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
