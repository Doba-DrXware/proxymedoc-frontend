'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Pharmacie } from '@/lib/data';
import { Shield, LogOut, CheckCircle, XCircle, FileText, Bot, Users, Building2, Search, TrendingUp } from 'lucide-react';

const mapBackendPharmacy = (p: any): Pharmacie => {
  const docs = [
    p.agrementMinsante ? `Agrément Ministère de la Santé|${p.agrementMinsante}` : null,
    p.fichierRc ? `Fichier d'inscription au Registre de Commerce (RC)|${p.fichierRc}` : null,
  ].filter(Boolean) as string[];

  const rawStatus = typeof p.statut === 'string' ? p.statut.toUpperCase() : '';
  const normalizedStatus = rawStatus === 'VALIDEE' || rawStatus === 'ACTIVE' ? 'active' : rawStatus === 'SUSPENDUE' || rawStatus === 'INACTIVE' ? 'inactive' : rawStatus === 'REJETEE' ? 'rejetee' : 'attente';

  return {
    id: Number(p.id),
    nom: p.nom ?? '',
    adresse: p.adresse ?? '',
    distance: 0,
    garde: Boolean(p.garde),
    telephone: p.telephone ?? '',
    horaires: p.horaires ?? '',
    statut: normalizedStatus,
    score_ia: p.score_ia ?? 0,
    latitude: typeof p.latitude === 'number' ? p.latitude : 0,
    longitude: typeof p.longitude === 'number' ? p.longitude : 0,
    meds: [],
    motifSuspension: p.motifSuspension,
    contact: p.contact ?? '',
    licence: p.licence ?? '',
    docs,
    images: [p.photo1Url, p.photo2Url, p.photo3Url].filter(Boolean) as string[],
  };
};

const getDocLabel = (doc: string) => doc.includes('|') ? doc.split('|')[0] : doc;
const getDocPath = (doc: string) => doc.includes('|') ? doc.split('|')[1] : doc;

export default function AdminPage() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'demandes' | 'pharmacies' | 'ia'>('demandes');
  const [demandes, setDemandes] = useState<Pharmacie[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<Pharmacie | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suspendTarget, setSuspendTarget] = useState<Pharmacie | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ patients: 0, searches30d: 0 });

  const loadPharmacies = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('proxymedoc_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const [pharmaciesResponse, statsResponse] = await Promise.all([
        fetch('/api/backend/pharmacies', { headers }).catch(() => null),
        fetch('/api/backend/admin/stats', { headers }).catch(() => null),
      ]);

      const pharmaciesData = pharmaciesResponse?.ok ? await pharmaciesResponse.json().catch(() => null) : null;
      const statsData = statsResponse?.ok ? await statsResponse.json().catch(() => null) : null;

      const mapped = (pharmaciesData ?? []).map(mapBackendPharmacy);
      setDemandes(mapped);
      setPharmacies(mapped);
      setStats({
        patients: Number(statsData?.patients ?? statsData?.patientCount ?? 0),
        searches30d: Number(statsData?.searches30d ?? statsData?.searches ?? 0),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPharmacies();
  }, []);

  const updatePharmacyStatus = async (id: number, nextStatus: 'active' | 'inactive' | 'rejetee') => {
    const backendStatus = nextStatus === 'active' ? 'VALIDEE' : nextStatus === 'rejetee' ? 'REJETEE' : 'SUSPENDUE';
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('proxymedoc_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`/api/backend/pharmacies/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ statut: backendStatus }),
      });

      if (!response.ok) {
        throw new Error('La mise à jour du statut a échoué.');
      }

      const data = await response.json();
      const updated = mapBackendPharmacy(data.pharmacy);
      const normalized = nextStatus === 'rejetee' ? { ...updated, statut: 'rejetee' as const } : updated;

      setDemandes(prev => {
        const next = prev.map(d => d.id === id ? normalized : d);
        const pending = next.filter(d => d.statut === 'attente');
        setCurrentIndex(i => Math.min(i, Math.max(0, pending.length - 1)));
        return next;
      });
      setPharmacies(prev => prev.map(ph => ph.id === id ? normalized : ph));
      setError(null);
      return normalized;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      return null;
    }
  };

  const valider = (id: number) => {
    void updatePharmacyStatus(id, 'active');
  };

  const rejeter = (id: number) => {
    void updatePharmacyStatus(id, 'rejetee');
  };

  const startSuspendPharmacie = (id: number) => {
    const ph = pharmacies.find(ph => ph.id === id);
    if (!ph) return;
    setSuspendTarget(ph);
    setSuspensionReason(ph.motifSuspension ?? '');
  };

  const confirmSuspendPharmacie = () => {
    if (!suspendTarget) return;
    void updatePharmacyStatus(suspendTarget.id, 'inactive');
    setSuspendTarget(null);
    setSuspensionReason('');
  };

  const cancelSuspendPharmacie = () => {
    setSuspendTarget(null);
    setSuspensionReason('');
  };

  const togglePharmacieStatus = (id: number) => {
    const ph = pharmacies.find(ph => ph.id === id);
    if (!ph) return;
    if (ph.statut === 'active') {
      startSuspendPharmacie(id);
      return;
    }
    void updatePharmacyStatus(id, 'active');
  };

  const enAttente = demandes.filter(d => d.statut === 'attente');
  const validatedPharmacies = pharmacies.filter(ph => ph.statut === 'active' || ph.statut === 'inactive');
  const previewUrl = selectedDoc ? (selectedDoc.startsWith('http') ? selectedDoc : `/api/uploads/${selectedDoc.replace(/^\//, '')}`) : null;
  const isPdfPreview = Boolean(previewUrl && previewUrl.toLowerCase().endsWith('.pdf'));
  const isImagePreview = Boolean(previewUrl && /\.(png|jpe?g|webp|gif|bmp)$/i.test(previewUrl));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-600">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p className="font-medium">Chargement des demandes depuis la base de données…</p>
        </div>
      </div>
    );
  }

  if (selectedDemande) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
          <button onClick={() => { setSelectedDemande(null); setSelectedDoc(null); }} className="text-purple-600 hover:underline text-sm">← Retour</button>
          <span className="text-slate-400">/</span>
          <span className="text-sm font-medium">{selectedDemande.nom}</span>
        </nav>
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold text-yellow-800">Analyse IA indisponible</p>
            <p className="text-sm text-slate-600">La vérification automatique des documents est momentanément indisponible. Consultez manuellement les pièces ci-dessous.</p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Documents soumis</p>
            <div className="space-y-2">
              {(selectedDemande.docs || []).length > 0 ? (
                (selectedDemande.docs || []).map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setSelectedDoc(getDocPath(doc))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" /> {getDocLabel(doc)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-500">Aucun document uploadé par cette demande.</div>
              )}
            </div>
          </div>

            {selectedDemande.statut === 'attente' && (
              <div className="flex gap-3">
                <button onClick={() => { valider(selectedDemande.id); setSelectedDemande(null); }} className="flex-1 py-2.5 btn-primary rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Valider cette pharmacie
                </button>
                <button onClick={() => { rejeter(selectedDemande.id); setSelectedDemande(null); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-700">
                  <XCircle size={16} /> Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={16} />
          </div>
          <span className="font-semibold text-slate-800">Administration ProxyMédoc</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
          <LogOut size={15} /> Déconnexion
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pharmacies actives', value: pharmacies.filter(ph => ph.statut === 'active').length, color: 'text-green-600', icon: Building2 },
            { label: 'En attente', value: enAttente.length, color: 'text-yellow-600', icon: Search },
            { label: 'Patients inscrits', value: stats.patients.toLocaleString('fr-FR'), color: 'text-blue-700', icon: Users },
            { label: 'Recherches (30j)', value: stats.searches30d.toLocaleString('fr-FR'), color: 'text-purple-700', icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={color} />
                <p className="text-xs text-slate-400">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {([
            ['demandes', `Demandes (${enAttente.length})`],
            ['pharmacies', 'Pharmacies validées'],
            ['ia', 'Module IA indisponible'],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === key ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'demandes' && (
          <div className="space-y-4">
            {enAttente.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                <p>Aucune demande en attente</p>
              </div>
            ) : (
              <div className="relative">
                {(() => {
                  const current = enAttente[currentIndex];
                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-slate-500">Demande {currentIndex + 1} sur {enAttente.length}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
                            disabled={currentIndex <= 0}
                            className={`px-3 py-2 rounded-xl text-sm ${currentIndex <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            Précédent
                          </button>
                          <button
                            onClick={() => setCurrentIndex(i => Math.min(i + 1, enAttente.length - 1))}
                            disabled={currentIndex >= enAttente.length - 1}
                            className={`px-3 py-2 rounded-xl text-sm ${currentIndex >= enAttente.length - 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                          >
                            Suivant
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-800 text-lg">{current.nom}</h3>
                            <p className="text-xs text-slate-400">{current.contact} · {current.telephone}</p>
                            <p className="text-xs text-slate-400">{current.adresse}</p>
                            <p className="text-xs text-slate-400">Licence : {current.licence}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {(current.docs || []).length > 0 ? (
                            (current.docs || []).map(doc => (
                              <div key={doc} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                <span className="flex items-center gap-2 text-slate-700">
                                  <FileText size={14} className="text-slate-400" /> {getDocLabel(doc)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedDoc(getDocPath(doc)); }}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Voir
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500">Aucun document uploadé par cette demande.</div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => { valider(current.id); }} className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1">
                            <CheckCircle size={12} /> Valider
                          </button>
                          <button onClick={() => { rejeter(current.id); }} className="text-xs py-1.5 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-1">
                            <XCircle size={12} /> Rejeter
                          </button>
                          <button onClick={() => setSelectedDemande(current)} className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 ml-auto">
                            <FileText size={12} /> Voir dossier complet
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {demandes.filter(d => d.statut !== 'attente').map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-4 opacity-60">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{d.nom}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.statut === 'active' ? 'badge-green' : 'bg-red-100 text-red-600'}`}>
                    {d.statut === 'active' ? 'Validée' : 'Rejetée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDoc && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => { setSelectedDoc(null); }}
          >
            <div className="w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-base font-semibold">Aperçu du document</p>
                  <p className="text-xs text-slate-500">{selectedDoc}</p>
                </div>
                <button type="button" onClick={() => { setSelectedDoc(null); }} className="text-sm text-slate-600 hover:text-slate-900">
                  Fermer
                </button>
              </div>
              <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                  {isPdfPreview ? (
                    <iframe
                      src={previewUrl}
                      title="Aperçu PDF"
                      className="h-[70vh] w-full rounded-2xl border-0"
                    />
                  ) : isImagePreview ? (
                    <img src={previewUrl} alt="Aperçu du document" className="max-h-[70vh] w-full rounded-2xl object-contain" />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                      <p className="font-medium text-slate-800 mb-2">Ce type de document ne peut pas être prévisualisé ici.</p>
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        Ouvrir le fichier dans un nouvel onglet
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'pharmacies' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Pharmacie</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Adresse</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">Statut</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">Garde</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validatedPharmacies.map(ph => (
                    <tr key={ph.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{ph.nom}</td>
                      <td className="px-4 py-3 text-slate-500">{ph.adresse}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="space-y-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${ph.statut === 'active' ? 'badge-green' : 'bg-red-100 text-red-600'}`}>
                            {ph.statut === 'active' ? 'Active' : 'Suspendue'}
                          </span>
                          {ph.statut === 'inactive' && ph.motifSuspension ? (
                            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">{ph.motifSuspension}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ph.garde ? 'badge-green' : 'bg-slate-100 text-slate-500'}`}>{ph.garde ? 'Oui' : 'Non'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => togglePharmacieStatus(ph.id)}
                          className={`text-xs rounded-lg px-2 py-1 ${ph.statut === 'active' ? 'border border-red-200 text-red-700 hover:bg-red-50' : 'border border-green-200 text-green-700 hover:bg-green-50'}`}
                        >
                          {ph.statut === 'active' ? 'Suspendre' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {suspendTarget && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <p className="text-base font-semibold">Motif de suspension</p>
                      <p className="text-xs text-slate-500">Indiquez pourquoi vous suspendez {suspendTarget.nom}.</p>
                    </div>
                    <button type="button" onClick={cancelSuspendPharmacie} className="text-sm text-slate-600 hover:text-slate-900">Fermer</button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Motif</label>
                      <textarea
                        value={suspensionReason}
                        onChange={e => setSuspensionReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Raison de la suspension"
                      />
                      <p className="mt-2 text-xs text-slate-500">Le motif est requis pour suspendre la pharmacie.</p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={cancelSuspendPharmacie} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={confirmSuspendPharmacie}
                        disabled={suspensionReason.trim().length === 0}
                        className={`px-4 py-2 rounded-xl text-sm text-white ${suspensionReason.trim().length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        Suspendre
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'ia' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Bot size={20} className="text-slate-500" />
            </div>
            <p className="text-lg font-semibold mb-2">Module IA indisponible</p>
            <p className="text-sm text-slate-500">L’intégration IA n’est pas disponible actuellement. Les demandes sont traitées manuellement à partir des documents uploadés.</p>
          </div>
        )}
      </div>
    </div>
  );
}
