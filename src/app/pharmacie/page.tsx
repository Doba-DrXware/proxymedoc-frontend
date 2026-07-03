'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store-context';
import { Medicament, getMedicamentCategory, getMedicamentImage } from '@/lib/data';
import { Building2, LogOut, Plus, Trash2, CheckCircle, Clock, Phone, MapPin, Package, Bell, FileText } from 'lucide-react';

export default function PharmaciePage() {
  const { userName, pharmacieId, logout } = useAuth();
  const { pharmacies, updateCatalogue, updateGarde, updatePharmacie } = useStore();

  const [tab, setTab] = useState<'profil' | 'catalogue' | 'ordonnances'>('profil');

  const pharma = pharmacies.find(p => p.id === pharmacieId) ?? pharmacies[0];
  const [catalogue, setCatalogue] = useState<Medicament[]>(pharma.meds.map(m => ({ ...m })));
  const [garde, setGarde] = useState(pharma.garde);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ nom: '', prix: '', stock: '' });

  const [editing, setEditing] = useState(false);
  const [lunVen, setLunVen] = useState('');
  const [sam, setSam] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<{ id: number; createdAt: string; fileUrl: string | null } | null>(null);

  const startEdit = () => {
    setLunVen(pharma.horaires.split('|')[0]?.trim() ?? '');
    setSam(pharma.horaires.split('|')[1]?.trim() ?? '');
    setPhone(pharma.telephone ?? '');
    setLatitude(String(pharma.latitude ?? ''));
    setLongitude(String(pharma.longitude ?? ''));
    setEditing(true);
  };

  const saveEdit = () => {
    const composedHoraires = `${lunVen} | ${sam}`.trim();
    const patch: Partial<typeof pharma> = {
      horaires: composedHoraires,
      telephone: phone,
      latitude: parseFloat(latitude) || pharma.latitude,
      longitude: parseFloat(longitude) || pharma.longitude,
    };
    updatePharmacie(pharma.id, patch);
    setEditing(false);
  };

  // Catalogue inline edit (prix / stock)
  const [editingMedIndex, setEditingMedIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const startEditMed = (index: number) => {
    const m = catalogue[index];
    setEditPrice(String(m.prix));
    setEditStock(String(m.stock));
    setEditingMedIndex(index);
  };

  const saveEditMed = (index: number) => {
    const prix = parseInt(editPrice) || 0;
    const stock = parseInt(editStock) || 0;
    const updated = catalogue.map((m, i) => i === index ? { ...m, prix, stock } : m);
    setCatalogue(updated);
    updateCatalogue(pharma.id, updated);
    setEditingMedIndex(null);
  };

  const cancelEditMed = () => setEditingMedIndex(null);

  const openOrdonnanceModal = (ordonnance: { id: number; createdAt: string; fileUrl: string | null }) => {
    setSelectedOrdonnance(ordonnance);
  };

  const closeOrdonnanceModal = () => {
    setSelectedOrdonnance(null);
  };

  const addMed = () => {
    if (!newMed.nom) return;
    const nom = newMed.nom.trim();
    const prix = parseInt(newMed.prix) || 0;
    const stock = parseInt(newMed.stock) || 0;
    const updated = [...catalogue, {
      nom,
      prix,
      stock,
      description: 'Notice du médicament non disponible.',
      image: getMedicamentImage(nom),
      categorie: getMedicamentCategory(nom),
    }];
    setCatalogue(updated);
    updateCatalogue(pharma.id, updated); // propagation au store global
    setNewMed({ nom: '', prix: '', stock: '' });
    setShowAdd(false);
  };

  const removeMed = (index: number) => {
    const updated = catalogue.filter((_, i) => i !== index); // index au lieu du nom pour éviter les doublons
    setCatalogue(updated);
    updateCatalogue(pharma.id, updated); // propagation au store global
  };

  const toggleGarde = () => {
    const next = !garde;
    setGarde(next);
    updateGarde(pharma.id, next); // propagation au store global
  };

  const ordonnances = [
    { id: 101, createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), fileUrl: '/ordonnances/marie-nguema-1.pdf' },
    { id: 102, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), fileUrl: '/ordonnances/paul-essam-1.pdf' },
    { id: 103, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), fileUrl: null },
  ];

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l’instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Building2 className="text-white" size={16} />
          </div>
          <span className="font-semibold text-slate-800">{userName}</span>
          <span className="badge-green text-xs px-2 py-0.5 rounded-full ml-1">Validée</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={18} className="text-slate-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {([['profil', 'Profil'], ['catalogue', 'Catalogue'], ['ordonnances', 'Ordonnances']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === key ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
              {key === 'ordonnances' && <span className="ml-2 badge-blue text-xs px-1.5 py-0.5 rounded-full">3</span>}
            </button>
          ))}
        </div>

        {tab === 'profil' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold mb-4">Informations & Statut</h2>
              <div className="h-28 bg-gradient-to-r from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="text-white opacity-30" size={48} />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1"><MapPin size={13} /> Adresse</span>
                  <span className="font-medium">{pharma.adresse}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1"><Phone size={13} /> Téléphone</span>
                  <span className="font-medium">{pharma.telephone}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Statut de garde</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${garde ? 'badge-green' : 'bg-red-100 text-red-600'}`}>
                      {garde ? 'De garde' : 'Pas de garde'}
                    </span>
                    <button onClick={toggleGarde} className="text-xs text-blue-600 hover:underline">Modifier</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold mb-4">Horaires d'ouverture</h2>
              <div className="space-y-2 text-sm mb-4">
                {!editing ? (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400">Lun – Ven</span>
                      <span className={`font-medium`}>{pharma.horaires.split('|')[0]?.trim() ?? ''}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400">Samedi</span>
                      <span className={`font-medium`}>{pharma.horaires.split('|')[1]?.trim() ?? ''}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-400">Dimanche</span>
                      <span className={`font-medium text-red-500`}>Fermé</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="field-label">Lun–Ven</label>
                      <input value={lunVen} onChange={e => setLunVen(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="field-label">Samedi</label>
                      <input value={sam} onChange={e => setSam(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="field-label">Téléphone</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="field-label">Latitude</label>
                        <input value={latitude} onChange={e => setLatitude(e.target.value)} className="input-field" />
                      </div>
                      <div>
                        <label className="field-label">Longitude</label>
                        <input value={longitude} onChange={e => setLongitude(e.target.value)} className="input-field" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="btn-primary text-sm py-1.5 px-3 rounded-lg">Enregistrer</button>
                      <button onClick={() => setEditing(false)} className="text-sm py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
              {!editing ? (
                <button onClick={startEdit} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 w-full">Modifier les horaires & coordonnées</button>
              ) : null}
              <div className="mt-4 bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-2">Localisation GPS</p>
                <div className="bg-white border border-slate-200 rounded-lg h-16 flex items-center justify-center text-xs text-slate-400">
                  <MapPin size={14} className="mr-1" /> {pharma.latitude}°N, {pharma.longitude}°E
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'catalogue' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Mon catalogue médicaments</h2>
              <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                <Plus size={15} /> Ajouter
              </button>
            </div>

            {showAdd && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="col-span-1">
                    <label className="field-label">Médicament</label>
                    <input value={newMed.nom} onChange={e => setNewMed(p => ({ ...p, nom: e.target.value }))} placeholder="Doliprane 500mg" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Prix (FCFA)</label>
                    <input type="number" value={newMed.prix} onChange={e => setNewMed(p => ({ ...p, prix: e.target.value }))} placeholder="1500" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Stock</label>
                    <input type="number" value={newMed.stock} onChange={e => setNewMed(p => ({ ...p, stock: e.target.value }))} placeholder="50" className="input-field" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addMed} className="btn-primary text-sm py-1.5 px-3 rounded-lg">Ajouter</button>
                  <button onClick={() => setShowAdd(false)} className="text-sm py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">Annuler</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Médicament</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Prix (FCFA)</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Stock</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalogue.map((m, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{m.nom}</td>
                      <td className="px-4 py-3 text-right">
                        {editingMedIndex === index ? (
                          <input className="input-field text-right" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                        ) : (
                          m.prix.toLocaleString()
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingMedIndex === index ? (
                          <input className="input-field text-right" value={editStock} onChange={e => setEditStock(e.target.value)} />
                        ) : (
                          m.stock
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.stock > 0 ? 'badge-green' : 'bg-red-100 text-red-600'}`}>
                          {m.stock > 0 ? 'En stock' : 'Rupture'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingMedIndex === index ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => saveEditMed(index)} className="text-green-600" title="Enregistrer"><CheckCircle size={16} /></button>
                            <button onClick={cancelEditMed} className="text-slate-500">Annuler</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEditMed(index)} className="text-blue-600 hover:text-blue-800 text-sm">Modifier</button>
                            <button onClick={() => removeMed(index)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ordonnances' && (
            <div>
            <h2 className="font-semibold mb-4">Ordonnances reçues</h2>
            <div className="space-y-3">
              {ordonnances.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium flex items-center gap-2"><FileText className="text-slate-500" size={16} /> Ordonnance #{o.id}</div>
                    <div className="text-xs text-slate-400">{timeAgo(o.createdAt)}</div>
                  </div>
                  <div className="mt-3">
                    {o.fileUrl ? (
                      <button onClick={() => openOrdonnanceModal(o)} className="inline-flex items-center gap-2 text-sm bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100">
                        <FileText size={14} /> Consulter ordonnance
                      </button>
                    ) : (
                      <button disabled className="inline-flex items-center gap-2 text-sm bg-slate-50 border border-slate-100 text-slate-300 px-3 py-1.5 rounded-lg">Aucun fichier</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedOrdonnance ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <div className="text-sm text-slate-500">Ordonnance #{selectedOrdonnance.id}</div>
                <div className="text-xs text-slate-400">{timeAgo(selectedOrdonnance.createdAt)}</div>
              </div>
              <button onClick={closeOrdonnanceModal} className="text-slate-500 hover:text-slate-800">Fermer</button>
            </div>
            <div className="h-[70vh] bg-slate-100">
              {selectedOrdonnance.fileUrl ? (
                <iframe src={selectedOrdonnance.fileUrl} className="h-full w-full border-0" title={`Ordonnance ${selectedOrdonnance.id}`} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">Aucun fichier disponible</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
