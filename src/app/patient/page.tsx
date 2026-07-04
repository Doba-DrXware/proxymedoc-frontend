'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store-context';
import { Pharmacie } from '@/lib/data';
import MedicamentCard from '@/components/MedicamentCard';
import { Pill, LogOut, Search, Phone, MapPin, Clock, ChevronRight, CheckCircle, Upload, ShoppingBag, Trash2, User, FileText } from 'lucide-react';

type SortOption = 'optimise' | 'distance' | 'prix';

interface SearchState {
  medInput: string;
  medicamentRecherche: string;
  localisation: string;
  rayon: string;
  ordoUploaded: boolean;
  resultats: Pharmacie[];
  searched: boolean;
  sortBy: SortOption;
  selectedMedicament: string | null;
  tab: 'recherche' | 'panier' | 'historique' | 'profil';
}

const SEARCH_STATE_KEY = 'proxymedoc-search-state';

export default function PatientPage() {
  const { userName, logout } = useAuth();
  const { pharmacies: localPharmacies, cart, removeFromCart } = useStore();
  const router = useRouter();

  const [storedSearchState] = useState<SearchState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(window.sessionStorage.getItem(SEARCH_STATE_KEY) || 'null');
    } catch {
      return null;
    }
  });

  const [tab, setTab] = useState<'recherche' | 'panier' | 'historique' | 'profil'>(storedSearchState?.tab ?? 'recherche');
  const [medInput, setMedInput] = useState(storedSearchState?.medInput ?? '');
  const [medicamentRecherche, setMedicamentRecherche] = useState(storedSearchState?.medicamentRecherche ?? '');
  const [localisation, setLocalisation] = useState(storedSearchState?.localisation ?? 'Bastos, Yaoundé');
  const [rayon, setRayon] = useState(storedSearchState?.rayon ?? '3');
  const [ordoUploaded, setOrdoUploaded] = useState(storedSearchState?.ordoUploaded ?? false);
  const [resultats, setResultats] = useState<Pharmacie[]>(storedSearchState?.resultats ?? []);
  const [searched, setSearched] = useState(storedSearchState?.searched ?? false);
  const [sortBy, setSortBy] = useState<SortOption>(storedSearchState?.sortBy ?? 'optimise');
  const [selectedMedicament, setSelectedMedicament] = useState<string | null>(storedSearchState?.selectedMedicament ?? null);
  const [selectedPharma, setSelectedPharma] = useState<Pharmacie | null>(null);
  const [ordoExpanded, setOrdoExpanded] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>(localPharmacies);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/pharmacies/with-stocks');
        if (!res.ok) throw new Error('API indisponible');
        const data = await res.json();
        const mapped = (data || []).map((ph: any) => ({
          id: ph.id,
          nom: ph.nom,
          adresse: ph.adresse || 'Adresse non renseignée',
          distance: 0,
          garde: Boolean(ph.garde),
          telephone: ph.telephone || '+237 6XX XXX XXX',
          horaires: ph.horaires || 'Horaires non renseignés',
          statut: ph.statut === 'active' ? 'active' : ph.statut === 'suspendue' ? 'inactive' : 'attente',
          score_ia: ph.score_ia || 0,
          latitude: ph.latitude || 0,
          longitude: ph.longitude || 0,
          meds: (ph.meds || []).map((med: any) => ({
            nom: med.nom,
            prix: Number(med.prix ?? 0),
            stock: Number(med.stock ?? 0),
            description: med.description || 'Description indisponible',
            dispo: Boolean(med.dispo),
            image: med.image || '/medicaments/default.svg',
            categorie: med.categorie || 'autre',
          })),
          contact: ph.contact || ph.nom,
          licence: ph.licence,
        })) as Pharmacie[];
        setPharmacies(mapped.length > 0 ? mapped : localPharmacies);
      } catch {
        setPharmacies(localPharmacies);
      } finally {
        setLoadingPharmacies(false);
      }
    };

    loadPharmacies();
  }, [localPharmacies]);

  const medicamentSuggestions = medicamentRecherche.trim()
    ? Array.from(new Set(
      pharmacies.flatMap(ph =>
        ph.meds
          .filter(m => m.nom.toLowerCase().includes(medicamentRecherche.trim().toLowerCase()))
          .map(m => m.nom)
      )
    )).sort()
    : [];

  const normalizeText = (value: string) => value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  const lancerRecherche = async () => {
    if (!medInput.trim() && !ordoUploaded) return;
    setSelectedMedicament(null);
    const query = medInput.trim() || 'medicament';
    await chercherPharmaciesPourMedicament(query);
  };

  const sortPharmacies = (list: Pharmacie[], by: SortOption) => {
    return [...list].sort((a, b) => {
      if (by === 'distance') {
        return a.distance - b.distance;
      }

      if (by === 'prix') {
        return a.meds.reduce((s, m) => s + m.prix, 0) - b.meds.reduce((s, m) => s + m.prix, 0);
      }

      const scoreA = getOptimizedScore(a);
      const scoreB = getOptimizedScore(b);
      return scoreA - scoreB;
    });
  };

  const getOptimizedScore = (ph: Pharmacie) => {
    const matchingMeds = ph.meds;
    const totalPrix = matchingMeds.reduce((sum, m) => sum + m.prix, 0);
    const couvertureStock = matchingMeds.length > 0
      ? matchingMeds.filter(m => m.stock > 0).length / matchingMeds.length
      : 0;

    const distancePenalty = ph.distance * 12;
    const pricePenalty = totalPrix / 120;
    const stockPenalty = (1 - couvertureStock) * 35;
    const qualityPenalty = (100 - ph.score_ia) * 0.15;
    const gardeBonus = ph.garde ? -6 : 0;

    return distancePenalty + pricePenalty + stockPenalty + qualityPenalty + gardeBonus;
  };

  const handleSort = (by: SortOption) => {
    setSortBy(by);
    setResultats(prev => sortPharmacies(prev, by));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedState: SearchState = {
      medInput,
      medicamentRecherche,
      localisation,
      rayon,
      ordoUploaded,
      resultats,
      searched,
      sortBy,
      selectedMedicament,
      tab,
    };

    window.sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(savedState));
  }, [medInput, medicamentRecherche, localisation, rayon, ordoUploaded, resultats, searched, sortBy, selectedMedicament, tab]);

  const chercherPharmaciesPourMedicament = async (termeRecherche: string) => {
    const terme = termeRecherche.trim();
    if (!terme) {
      setResultats([]);
      setSearched(true);
      return;
    }

    try {
      const params = new URLSearchParams({ q: terme, radius: rayon });
      const response = await fetch(`http://localhost:8080/api/pharmacies/search?${params.toString()}`);
      if (!response.ok) throw new Error('Recherche indisponible');
      const data = await response.json();
      const mapped = (data || []).map((ph: any) => ({
        id: ph.id,
        nom: ph.nom,
        adresse: ph.adresse || 'Adresse non renseignée',
        distance: 0,
        garde: Boolean(ph.garde),
        telephone: ph.telephone || '+237 6XX XXX XXX',
        horaires: ph.horaires || 'Horaires non renseignés',
        statut: ph.statut === 'active' ? 'active' : ph.statut === 'suspendue' ? 'inactive' : 'attente',
        score_ia: ph.score_ia || 0,
        latitude: ph.latitude || 0,
        longitude: ph.longitude || 0,
        meds: (ph.meds || []).filter((med: any) => normalizeText(med.nom).includes(normalizeText(terme))).map((med: any) => ({
          nom: med.nom,
          prix: Number(med.prix ?? 0),
          stock: Number(med.stock ?? 0),
          description: med.description || 'Description indisponible',
          dispo: Boolean(med.dispo),
          image: med.image || '/medicaments/default.svg',
          categorie: med.categorie || 'autre',
        })),
        contact: ph.contact || ph.nom,
        licence: ph.licence,
      })) as Pharmacie[];

      const filtered = mapped.filter(ph => ph.meds.length > 0);
      const sorted = sortPharmacies(filtered, sortBy);
      setResultats(sorted);
      setSearched(true);
    } catch {
      const fallback = pharmacies
        .filter(ph => parseFloat(rayon) >= ph.distance)
        .map(ph => ({
          ...ph,
          meds: ph.meds.filter(m => normalizeText(m.nom).includes(normalizeText(terme))).map(m => ({ ...m, dispo: m.stock > 0 })),
        }))
        .filter(ph => ph.meds.length > 0);
      setResultats(sortPharmacies(fallback, sortBy));
      setSearched(true);
    }
  };

  const sélectionnerMedicament = (nom: string) => {
    setSelectedMedicament(nom);
    setMedicamentRecherche(nom);
    void chercherPharmaciesPourMedicament(nom);
  };

  const rechercherParMedicament = () => {
    if (!medicamentRecherche.trim()) return;
    setSelectedMedicament(medicamentRecherche.trim());
    void chercherPharmaciesPourMedicament(medicamentRecherche);
  };

  if (selectedPharma) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedPharma(null)} className="text-blue-600 hover:underline text-sm">← Retour</button>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium">{selectedPharma.nom}</span>
        </nav>
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
              <Pill className="text-white opacity-30" size={64} />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold">{selectedPharma.nom}</h2>
                  <p className="text-slate-500 text-sm flex items-center gap-1"><MapPin size={13} /> {selectedPharma.adresse}</p>
                </div>
                {selectedPharma.garde && <span className="badge-green">De garde 24h/24</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Distance</p>
                  <p className="font-semibold text-blue-700">{selectedPharma.distance} km</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Téléphone</p>
                  <p className="font-semibold text-sm">{selectedPharma.telephone}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> {selectedPharma.horaires}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-medium mb-4">Médicaments disponibles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPharma.meds.map((m, i) => (
                <MedicamentCard key={i} medicament={m} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2">
              <Phone size={15} /> Appeler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <Pill className="text-white" size={16} />
          </div>
          <span className="font-semibold text-slate-800">ProxyMédoc</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Bonjour, {userName}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {(['recherche', 'panier', 'historique', 'profil'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t === 'recherche'
                ? 'Rechercher'
                : t === 'panier'
                  ? `Panier${cart.length > 0 ? ` (${cart.length})` : ''}`
                  : t === 'historique'
                    ? 'Historique'
                    : 'Profil'}
            </button>
          ))}
        </div>

        {tab === 'recherche' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">Rechercher un medicament</h2>
                <span className="text-xs text-slate-500">{loadingPharmacies ? 'Chargement…' : `${pharmacies.length} pharmacies`}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={medicamentRecherche}
                  onChange={e => {
                    setMedicamentRecherche(e.target.value);
                    setSelectedMedicament(null);
                    setSearched(false);
                  }}
                  placeholder="Ex: Amoxicilline, Paracétamol..."
                  className="input-field flex-1"
                />
                <button onClick={rechercherParMedicament} className="btn-primary py-2.5 px-5 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <Search size={16} /> Rechercher
                </button>
              </div>

              {medicamentSuggestions.length > 0 && !selectedMedicament && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {medicamentSuggestions.map((nom, index) => (
                    <button
                      key={index}
                      onClick={() => sélectionnerMedicament(nom)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      {nom}
                    </button>
                  ))}
                </div>
              )}

              {selectedMedicament && (
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 flex items-center justify-between gap-3">
                  <div>
                    Médicament sélectionné : <strong>{selectedMedicament}</strong>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMedicament(null);
                      setSearched(false);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
              <button
                type="button"
                onClick={() => setOrdoExpanded(prev => !prev)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div>
                  <h2 className="font-semibold mb-1 text-slate-800">Déposer mon ordonnance</h2>
                  <p className="text-sm text-slate-500">Téléversez une ordonnance ou saisissez les médicaments à rechercher.</p>
                </div>
                <ChevronRight size={20} className={`text-slate-400 transition-transform ${ordoExpanded ? 'rotate-90' : ''}`} />
              </button>

              {ordoExpanded && (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Ma localisation</label>
                      <select value={localisation} onChange={e => setLocalisation(e.target.value)} className="input-field">
                        <option>Bastos, Yaoundé</option>
                        <option>Melen, Yaoundé</option>
                        <option>Emana, Yaoundé</option>
                        <option>Mvog-Mbi, Yaoundé</option>
                        <option>Nlongkak, Yaoundé</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Rayon de recherche</label>
                      <select value={rayon} onChange={e => setRayon(e.target.value)} className="input-field">
                        <option value="1">1 km</option>
                        <option value="2">2 km</option>
                        <option value="3">3 km</option>
                        <option value="5">5 km</option>
                        <option value="10">10 km</option>
                      </select>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setOrdoUploaded(true);
                      setMedInput('Amoxicilline 500mg x30, Paracétamol 1g x20, Ibuprofène 400mg x10');
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${ordoUploaded ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}
                  >
                    {ordoUploaded ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">ordonnance_jean.pdf chargée</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto mb-1 text-slate-400" size={22} />
                        <p className="text-sm text-slate-500">Cliquer pour téléverser votre ordonnance</p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF ou image acceptés</p>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="field-label">Ou saisir les médicaments manuellement</label>
                    <textarea
                      rows={3}
                      value={medInput}
                      onChange={e => setMedInput(e.target.value)}
                      placeholder="Ex: Amoxicilline 500mg x30, Paracétamol 1g x20, Ibuprofène 400mg x10..."
                      className="input-field resize-none"
                    />
                  </div>

                  <button onClick={lancerRecherche} className="btn-primary py-2.5 px-5 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Search size={16} /> Rechercher le(s) medicament(s)
                  </button>
                </div>
              )}
            </div>

            {searched && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">
                    {resultats.length} pharmacie{resultats.length > 1 ? 's' : ''} trouvée{resultats.length > 1 ? 's' : ''}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Trier par</span>
                    <select value={sortBy} onChange={e => handleSort(e.target.value as SortOption)} className="text-xs border border-slate-200 rounded-lg px-2 py-1">
                      <option value="optimise">Optimisé</option>
                      <option value="distance">Distance</option>
                      <option value="prix">Prix total</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {resultats.map((ph, i) => {
                    const total = ph.meds.reduce((s, m) => s + m.prix, 0);
                    return (
                      <div key={ph.id} className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-md ${i === 0 ? 'border-blue-300 shadow-sm' : 'border-slate-200'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              {i === 0 && (
                                <span className="badge-blue text-xs px-2 py-0.5 rounded-full">
                                  {sortBy === 'optimise' ? 'Meilleur choix' : '+ Proche'}
                                </span>
                              )}
                              <h4 className="font-semibold text-slate-800">{ph.nom}</h4>
                              {ph.garde && <span className="badge-green text-xs px-2 py-0.5 rounded-full">De garde</span>}
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={11} />{ph.adresse}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-lg font-bold text-blue-700">{total.toLocaleString()} <span className="text-xs font-medium">FCFA</span></p>
                            <p className="text-xs text-slate-400">{ph.distance} km</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {ph.meds.map((m, mi) => (
                            <div key={mi} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${m.stock > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${m.stock > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                              {m.nom} — <strong>{m.prix.toLocaleString()} FCFA</strong>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1">
                            <Phone size={12} /> Appeler
                          </button>
                            <button
                            onClick={() => {
                              const query = selectedMedicament || medicamentRecherche.trim().toLowerCase();
                              const medicament = ph.meds.find(m =>
                                query
                                  ? m.nom.toLowerCase() === query || m.nom.toLowerCase().includes(query)
                                  : false
                              )?.nom || ph.meds[0]?.nom;
                              if (!medicament) return;
                              router.push(`/patient/pharmacie/${ph.id}/medicament/${encodeURIComponent(medicament)}`);
                            }}
                            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 ml-auto"
                          >
                            Détails <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'panier' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">Mon panier</h2>
                    <p className="text-sm text-slate-500">Vérifiez les médicaments que vous avez ajoutés.</p>
                  </div>
                </div>
                <span className="badge-blue text-sm">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
              </div>

              {cart.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  Votre panier est vide. Ajoutez un médicament depuis la fiche produit.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={`${item.pharmacieId}-${item.medicament.nom}-${index}`} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">Pharmacie</p>
                          <p className="font-semibold text-slate-800">{item.pharmacieName}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          <Trash2 size={14} /> Retirer
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <div>
                          <p className="text-sm text-slate-500">Médicament</p>
                          <p className="font-semibold text-slate-800">{item.medicament.nom}</p>
                          <p className="text-sm text-slate-500">{item.medicament.description.substring(0, 120)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Quantité</p>
                          <p className="font-semibold text-slate-800">{item.quantity}</p>
                          <p className="text-sm text-slate-500 mt-2">Total</p>
                          <p className="text-lg font-semibold text-blue-700">{(item.quantity * item.medicament.prix).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Total du panier</span>
                      <span className="font-semibold text-slate-900">{cart.reduce((sum, item) => sum + item.quantity * item.medicament.prix, 0).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'profil' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Profil patient</h2>
                  <p className="text-sm text-slate-500">Informations principales de votre compte</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Nom</span>
                  <span className="font-medium text-slate-700">{userName || 'Patient'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Rôle</span>
                  <span className="font-medium text-slate-700">Patient</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Localisation préférée</span>
                  <span className="font-medium text-slate-700">{localisation}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400">Rayon de recherche</span>
                  <span className="font-medium text-slate-700">{rayon} km</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Ordonnance téléversée</span>
                  <span className={`font-medium ${ordoUploaded ? 'text-green-600' : 'text-slate-700'}`}>
                    {ordoUploaded ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/patient/creer-pharmacie')}
                className="btn-primary text-sm py-2 px-3 rounded-lg"
              >
                Créer ma pharmacie
              </button>
            </div>
          </div>
        )}

        {tab === 'historique' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-800 mb-4">Mes ordonnances précédentes</h2>
            {[
              { meds: 'Amoxicilline, Paracétamol, Ibuprofène', date: '12 Jan 2025', pharmacie: 'Pharmacie du Palais' },
              { meds: 'Métformine 850mg, Amlodipine 5mg', date: '3 Jan 2025', pharmacie: 'Pharmacie Centrale' },
            ].map((h, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{h.meds}</p>
                  <p className="text-xs text-slate-400">{h.date} — {h.pharmacie}</p>
                </div>
                <span className="badge-green text-xs px-2 py-0.5 rounded-full">Récupérée</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
