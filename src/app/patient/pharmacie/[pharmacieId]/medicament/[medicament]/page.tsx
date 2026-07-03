'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pharmacies, Pharmacie, Medicament } from '@/lib/data';
import { useStore } from '@/lib/store-context';
import { MapPin, Phone, Clock, ArrowLeft, ShoppingCart, Navigation } from 'lucide-react';

interface PatientMedicamentPageProps {
  params: Promise<{
    pharmacieId: string;
    medicament: string;
  }>;
}

export default function PatientMedicamentPage({ params }: PatientMedicamentPageProps) {
  const { addToCart } = useStore();
  const router = useRouter();
  const routeParams = use(params);
  const pharmacieId = Number(routeParams.pharmacieId);
  const medicamentNom = decodeURIComponent(routeParams.medicament);

  const pharmacy = useMemo(
    () => pharmacies.find(ph => ph.id === pharmacieId),
    [pharmacieId]
  );

  const medicament = useMemo<Medicament | undefined>(() => {
    const query = medicamentNom.toLowerCase();
    return pharmacy?.meds.find(m => {
      const nom = m.nom.toLowerCase();
      return nom === query || nom.includes(query) || query.includes(nom) || nom.startsWith(query);
    });
  }, [pharmacy, medicamentNom]);

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const totalPrice = medicament ? quantity * medicament.prix : 0;

  const handleAddToCart = () => {
    if (!pharmacy || !medicament) {
      return;
    }

    addToCart({
      pharmacieId: pharmacy.id,
      pharmacieName: pharmacy.nom,
      medicament,
      quantity,
    });

    window.alert('Médicament ajouté au panier. Vous allez être redirigé vers la page d\'accueil.');
    router.push('/patient');
  };

  if (!pharmacy || !medicament) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-800 mb-3">Information non trouvée</h1>
          <p className="text-sm text-slate-500 mb-5">
            La pharmacie ou le médicament demandé n'existe pas dans les données disponibles.
          </p>
          <button onClick={() => router.push('/patient')} className="btn-primary py-2.5 px-5 rounded-lg text-sm font-medium">
            Retour à la recherche
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Détail du médicament</p>
            <h1 className="text-2xl font-semibold text-slate-900">{medicament.nom}</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center min-h-80">
              <img
                src={medicament.image}
                alt={medicament.nom}
                className="w-48 h-48 object-contain mb-4"
              />
              <div className="text-center mt-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
                  {medicament.categorie.replace('-', ' ')}
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">{medicament.nom}</h2>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Pharmacie</p>
                  <h2 className="text-xl font-semibold text-slate-900">{pharmacy.nom}</h2>
                </div>
                <span className="badge-blue">{pharmacy.garde ? 'Garde 24h' : 'Ouverte'}</span>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> {pharmacy.adresse}
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" /> {pharmacy.horaires}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {pharmacy.telephone}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/patient/pharmacie/${pharmacy.id}/itineraire`)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                <Navigation size={16} /> Voir l’itinéraire
              </button>

              <div className="mt-6">
                <div className="overflow-hidden rounded-3xl bg-slate-100">
                  <img
                    src={pharmacy.images?.[selectedImageIndex] ?? '/window.svg'}
                    alt={`${pharmacy.nom} photo ${selectedImageIndex + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>

                {pharmacy.images && pharmacy.images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {pharmacy.images.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`h-16 w-16 rounded-2xl overflow-hidden border ${index === selectedImageIndex ? 'border-blue-600' : 'border-slate-200'}`}
                      >
                        <img src={src} alt={`Miniature ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Détails du médicament</h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prix</p>
                    <p className="mt-1 text-xl font-semibold text-blue-700">{medicament.prix.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Disponibilité</p>
                    <p className={`mt-1 text-sm font-semibold ${medicament.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {medicament.stock > 0 ? `${medicament.stock} en stock` : 'Rupture de stock'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <p className="text-sm text-slate-500">Notice du médicament</p>
                  <p className="mt-2 text-slate-700">
                    {medicament.description}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Ajouter au panier</h3>
                  <div className="grid gap-4">
                    <label className="text-sm text-slate-600">
                      Quantité souhaitée
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={medicament.stock > 0 ? medicament.stock : 1}
                      value={quantity}
                      onChange={event => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, medicament.stock || 1)))}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-200">
                      <p className="text-slate-500">Prix total</p>
                      <p className="mt-1 text-xl font-semibold text-blue-700">{totalPrice.toLocaleString()} FCFA</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl border border-blue-600 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-400"
                      disabled={medicament.stock === 0}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={16} className="mr-2" /> Ajouter au panier
                    </button>
                    {medicament.stock === 0 && (
                      <p className="text-sm text-red-600">Impossible d’ajouter au panier : rupture de stock.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Commande</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>Localisation : {pharmacy.adresse}</p>
                <p>Distance : {pharmacy.distance} km</p>
                <p>Pharmacie : {pharmacy.nom}</p>
                <p>Médicament : {medicament.nom}</p>
              </div>
              <Link href="/patient" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Retour à la recherche
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
