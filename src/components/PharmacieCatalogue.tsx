'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Trash2, Pencil, Save, XCircle, AlertTriangle } from 'lucide-react';
import { Medicament } from '@/lib/data';

interface PharmacieCatalogueProps {
  meds: Medicament[];
  pharmacyId: number;
  onUpdate: (updated: Medicament[]) => void;
}

const formatCategory = (categorie: string | undefined) => {
  if (!categorie) return 'Autre';
  return categorie.replace('-', ' ');
};

const jsonHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function PharmacieCatalogue({ meds, onUpdate }: PharmacieCatalogueProps) {
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Medicament | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [medIds, setMedIds] = useState<(number | undefined)[]>([]);

  useEffect(() => {
    setMedIds(meds.map(med => med.id));
  }, [meds]);

  const resolveMedId = (med: Medicament, rowIndex: number) => {
    return med.id != null ? med.id : medIds[rowIndex];
  };

  const startEdit = (med: Medicament, rowIndex: number) => {
    const medId = resolveMedId(med, rowIndex);
    if (medId == null) {
      setFeedback('Ce médicament n’est pas encore disponible côté backend.');
      return;
    }

    setDraft({
      ...med,
      id: medId,
      denomination: med.denomination?.trim() || med.nom,
      categorie: med.categorie || 'autre',
      description: med.description ?? '',
      formeGalenique: med.formeGalenique ?? '',
      dosage: med.dosage ?? '',
      exigeOrdonnance: Boolean(med.exigeOrdonnance),
      imageUrl: med.imageUrl ?? '',
      noticeUrl: med.noticeUrl ?? '',
    });
    setEditingRowIndex(rowIndex);
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingRowIndex(null);
    setDraft(null);
    setFeedback(null);
  };

  const saveEdit = async () => {
    const rowId = editingRowIndex != null ? medIds[editingRowIndex] : undefined;
    const medId = draft?.id ?? rowId;
    if (medId == null) {
      setFeedback('Impossible de sauvegarder : identifiant de médicament manquant.');
      return;
    }

    if (!draft) {
      setFeedback('Aucune modification à enregistrer.');
      setSaving(false);
      return;
    }

    const prix = Number(draft.prix ?? 0);
    const stock = Number(draft.stock ?? 0);

    if (!Number.isFinite(prix) || prix < 0 || !Number.isFinite(stock) || stock < 0) {
      setFeedback('Le prix et le stock doivent être des nombres valides et positifs.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('proxymedoc_token') : null;
    if (!token) {
      setFeedback('Token manquant. Veuillez vous reconnecter.');
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`http://localhost:8081/api/medicaments/${medId}`, {
        method: 'PUT',
        headers: jsonHeaders(token),
        body: JSON.stringify({
          id: medId,
          denomination: draft.denomination?.trim() || draft.nom,
          categorie: draft.categorie || 'autre',
          description: draft.description ?? '',
          prixUnitaire: prix,
          formeGalenique: draft.formeGalenique ?? '',
          dosage: draft.dosage ?? '',
          exigeOrdonnance: Boolean(draft.exigeOrdonnance),
          imageUrl: draft.imageUrl ?? '',
          noticeUrl: draft.noticeUrl ?? '',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Échec de la mise à jour du médicament');
      }

      const stockRes = await fetch(`http://localhost:8081/api/medicaments/${medId}/stock`, {
        method: 'PUT',
        headers: jsonHeaders(token),
        body: JSON.stringify({ quantiteDisponible: stock }),
      });

      if (!stockRes.ok) {
        const text = await stockRes.text();
        throw new Error(text || 'Échec de la mise à jour du stock');
      }

      const updated = meds.map((item, itemIndex) => {
        const rowId = item.id != null ? item.id : medIds[itemIndex];
        return rowId === medId ? { ...item, ...draft, prix, stock, id: medId } : item;
      });
      onUpdate(updated);
      setEditingRowIndex(null);
      setDraft(null);
      setFeedback('Modification enregistrée.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMed = async (med: Medicament) => {
    if (med.id == null) {
      setFeedback('Impossible de supprimer : identifiant manquant.');
      return;
    }

    const confirmed = window.confirm(`Supprimer définitivement « ${med.denomination ?? med.nom} » de votre catalogue ?`);
    if (!confirmed) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('proxymedoc_token') : null;
    if (!token) {
      setFeedback('Token manquant. Veuillez vous reconnecter.');
      return;
    }

    setDeletingId(med.id);
    setFeedback(null);

    try {
      const res = await fetch(`http://localhost:8081/api/medicaments/${med.id}/stock`, {
        method: 'DELETE',
        headers: jsonHeaders(token),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Échec de la suppression.');
      }

      onUpdate(meds.filter(item => item.id !== med.id));
      if (editingRowIndex != null && medIds[editingRowIndex] === med.id) cancelEdit();
      setFeedback('Ligne supprimée avec succès.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erreur inconnue lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderText = (value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') return '—';
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Catalogue médicaments</h2>
            <p className="text-sm text-slate-500">Affichage des données importantes de chaque médicament et actions de gestion du stock.</p>
          </div>
          <div className="text-sm text-slate-500">{meds.length} médicaments</div>
        </div>

        {feedback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4">{feedback}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Médicament</th>
                <th className="px-4 py-3 font-medium">Détails</th>
                <th className="px-4 py-3 text-right font-medium">Prix</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Ordonnance</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meds.map((med, index) => {
                const isEditing = editingRowIndex === index;
                return (
                  <tr key={med.id ?? `${med.nom}-${med.prix}-${med.stock}-${index}`} className={isEditing ? 'bg-slate-50' : ''} data-med-id={med.id ?? ''}>
                    <td className="px-4 py-4 align-top w-[220px]">
                      {isEditing ? (
                        <input
                          value={draft?.denomination ?? ''}
                          onChange={e => setDraft(prev => prev ? { ...prev, denomination: e.target.value } : prev)}
                          className="input-field w-full"
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{med.denomination ?? med.nom}</div>
                      )}
                      <div className="mt-2 text-xs text-slate-500">{renderText(med.categorie && formatCategory(med.categorie))}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={draft?.formeGalenique ?? ''}
                            onChange={e => setDraft(prev => prev ? { ...prev, formeGalenique: e.target.value } : prev)}
                            placeholder="Forme galénique"
                            className="input-field w-full"
                          />
                          <input
                            value={draft?.dosage ?? ''}
                            onChange={e => setDraft(prev => prev ? { ...prev, dosage: e.target.value } : prev)}
                            placeholder="Dosage"
                            className="input-field w-full"
                          />
                          <textarea
                            value={draft?.description ?? ''}
                            onChange={e => setDraft(prev => prev ? { ...prev, description: e.target.value } : prev)}
                            placeholder="Description"
                            className="input-field w-full min-h-[90px] resize-none"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 text-slate-600">
                          <div>{med.formeGalenique || '—'} • {med.dosage || '—'}</div>
                          <div className="text-xs text-slate-500 line-clamp-3">{med.description || 'Aucune description enregistrée.'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right align-top w-[110px]">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft?.prix ?? 0}
                          onChange={e => setDraft(prev => prev ? { ...prev, prix: Number(e.target.value) } : prev)}
                          className="input-field w-full text-right"
                        />
                      ) : (
                        <div className="font-semibold text-slate-900">{med.prix.toLocaleString()} FCFA</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right align-top w-[100px]">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={draft?.stock ?? 0}
                          onChange={e => setDraft(prev => prev ? { ...prev, stock: Number(e.target.value) } : prev)}
                          className="input-field w-full text-right"
                        />
                      ) : (
                        <div className={`font-semibold ${med.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{med.stock}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top w-[120px]">
                      {isEditing ? (
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={draft?.exigeOrdonnance ?? false}
                            onChange={e => setDraft(prev => prev ? { ...prev, exigeOrdonnance: e.target.checked } : prev)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Ordonnance
                        </label>
                      ) : (
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${med.exigeOrdonnance ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                          {med.exigeOrdonnance ? 'Oui' : 'Non'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right align-top w-[180px]">
                      {isEditing ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Save size={16} /> Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle size={16} /> Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(med, index)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil size={16} /> Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMed(med)}
                            disabled={deletingId === med.id}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} /> Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
