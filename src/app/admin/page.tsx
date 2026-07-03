'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { demandesPharmacie, Pharmacie } from '@/lib/data';
import { useStore } from '@/lib/store-context';
import { Shield, LogOut, CheckCircle, XCircle, FileText, Bot, Users, Building2, Search, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const { logout } = useAuth();
  const { pharmacies, updatePharmacie } = useStore();
  const [tab, setTab] = useState<'demandes' | 'pharmacies' | 'ia'>('demandes');
  const [demandes, setDemandes] = useState<Pharmacie[]>(demandesPharmacie);
  const [selectedDemande, setSelectedDemande] = useState<Pharmacie | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Pharmacie | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const valider = (id: number) => setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut: 'active' as const } : d));
  const rejeter = (id: number) => setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut: 'rejetee' as const } : d));

  const startSuspendPharmacie = (id: number) => {
    const ph = pharmacies.find(ph => ph.id === id);
    if (!ph) return;
    setSuspendTarget(ph);
    setSuspensionReason(ph.motifSuspension ?? '');
  };

  const confirmSuspendPharmacie = () => {
    if (!suspendTarget) return;
    updatePharmacie(suspendTarget.id, {
      statut: 'inactive',
      motifSuspension: suspensionReason.trim() || 'Motif non précisé',
    });
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
    updatePharmacie(id, { statut: 'active', motifSuspension: null });
  };

  const enAttente = demandes.filter(d => d.statut === 'attente');
  const validatedPharmacies = pharmacies.filter(ph => ph.statut === 'active' || ph.statut === 'inactive');

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
                    onClick={() => setSelectedDoc(doc)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" /> {doc}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-500">Aucun document uploadé par cette demande.</div>
              )}
            </div>
          </div>

          {selectedDoc && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
              onClick={() => { setSelectedDoc(null); setSelectedDemande(null); }}
            >
              <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-base font-semibold">Document</p>
                    <p className="text-xs text-slate-500">{selectedDoc}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedDoc(null); setSelectedDemande(null); }} className="text-sm text-slate-600 hover:text-slate-900">
                    Fermer
                  </button>
                </div>
                <div className="p-6">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                    <p className="font-medium mb-3">Aperçu du document</p>
                    <p>Document uploadé : <span className="font-semibold text-slate-900">{selectedDoc}</span></p>
                    <p className="mt-4 text-xs text-slate-500">Contenu simulé ici. Remplacez cette vue par un aperçu PDF/image réel lorsque l’intégration de fichiers est disponible.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pharmacies actives', value: pharmacies.filter(ph => ph.statut === 'active').length, color: 'text-green-600', icon: Building2 },
            { label: 'En attente', value: enAttente.length, color: 'text-yellow-600', icon: Search },
            { label: 'Patients inscrits', value: '1 248', color: 'text-blue-700', icon: Users },
            { label: 'Recherches (30j)', value: '3 671', color: 'text-purple-700', icon: TrendingUp },
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
              enAttente.map(d => (
                <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{d.nom}</h3>
                      <p className="text-xs text-slate-400">{d.contact} · {d.telephone} · {d.adresse}</p>
                      <p className="text-xs text-slate-400">Licence : {d.licence}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {(d.docs || []).map(doc => (
                      <div key={doc} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <FileText size={14} className="text-slate-400" /> {doc}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setSelectedDemande(d); setSelectedDoc(doc); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Voir
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => valider(d.id)} className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1">
                      <CheckCircle size={12} /> Valider
                    </button>
                    <button onClick={() => rejeter(d.id)} className="text-xs py-1.5 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-1">
                      <XCircle size={12} /> Rejeter
                    </button>
                    <button onClick={() => setSelectedDemande(d)} className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 ml-auto">
                      <FileText size={12} /> Voir dossier complet
                    </button>
                  </div>
                </div>
              ))
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
