'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store-context';
import { Medicament, Pharmacie, getMedicamentCategory, getMedicamentImage } from '@/lib/data';
import { Building2, LogOut, Plus, CheckCircle, Clock, Phone, MapPin, Package, Bell, FileText } from 'lucide-react';
import { PharmacyImage } from '@/components/PharmacyImage';
import PharmacieCatalogue from '@/components/PharmacieCatalogue';

const mapBackendPharmacy = (payload: any, fallbackId: number | null): Pharmacie => {
  const meds = Array.isArray(payload?.meds)
    ? payload.meds.map((med: any) => ({
        id: med?.id != null ? Number(med.id) : undefined,
        nom: med?.nom ?? med?.denomination ?? 'Médicament',
        prix: Number(med?.prix ?? med?.prixUnitaire ?? 0),
        stock: Number(med?.stock ?? 0),
        description: med?.description ?? 'Notice du médicament non disponible.',
        dispo: Boolean(med?.dispo),
        image: med?.image ?? med?.imageUrl ?? '/medicaments/default.svg',
        categorie: med?.categorie ?? 'autre',
        denomination: med?.denomination ?? med?.nom ?? '',
        formeGalenique: med?.formeGalenique ?? '',
        dosage: med?.dosage ?? '',
        exigeOrdonnance: Boolean(med?.exigeOrdonnance),
        imageUrl: med?.imageUrl ?? '',
        noticeUrl: med?.noticeUrl ?? '',
      }))
    : [];

  const imageUrls = [
    payload?.photo1Url,
    payload?.photo2Url,
    payload?.photo3Url,
    ...(Array.isArray(payload?.images) ? payload.images : []),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return {
    id: Number(payload?.id ?? fallbackId ?? 0),
    nom: payload?.nom ?? 'Pharmacie',
    adresse: payload?.adresse ?? '',
    distance: 0,
    garde: Boolean(payload?.garde),
    telephone: payload?.telephone ?? '',
    horaires: payload?.horaires ?? '',
    statut: payload?.statut === 'active' || payload?.statut === 'inactive' || payload?.statut === 'attente' || payload?.statut === 'rejetee'
      ? payload.statut
      : 'attente',
    score_ia: Number(payload?.score_ia ?? 0),
    latitude: Number(payload?.latitude ?? 0),
    longitude: Number(payload?.longitude ?? 0),
    meds,
    contact: payload?.contact ?? '',
    licence: payload?.licence ?? '',
    images: imageUrls.length > 0 ? imageUrls : undefined,
  };
};

const getStatusBadge = (statut?: Pharmacie['statut']) => {
  switch (statut) {
    case 'active':
      return { label: 'Validée', className: 'badge-green' };
    case 'attente':
      return { label: 'En attente', className: 'bg-amber-100 text-amber-700' };
    case 'rejetee':
      return { label: 'Rejetée', className: 'bg-red-100 text-red-700' };
    case 'inactive':
    default:
      return { label: 'Inactive', className: 'bg-slate-100 text-slate-700' };
  }
};

type DaySchedule = { open: string; close: string };
const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

const normalizeDaySchedule = (value: unknown): DaySchedule => {
  if (!value || typeof value !== 'object') {
    return { open: '', close: '' };
  }

  const record = value as Record<string, unknown>;
  return {
    open: typeof record.open === 'string' ? record.open.trim() : '',
    close: typeof record.close === 'string' ? record.close.trim() : '',
  };
};

const parseHoraires = (raw?: string | null): Record<string, DaySchedule> => {
  const defaultSchedules = dayOrder.reduce<Record<string, DaySchedule>>((acc, day) => {
    acc[day] = { open: '', close: '' };
    return acc;
  }, {});

  if (!raw) return defaultSchedules;

  const trimmed = raw.trim();
  if (!trimmed) return defaultSchedules;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      for (const day of dayOrder) {
        const value = record[day];
        defaultSchedules[day] = normalizeDaySchedule(value);
      }
      return defaultSchedules;
    }
  } catch {
    // keep default empty schedules if the payload is not valid JSON
  }

  return defaultSchedules;
};

const formatHours = (schedule?: DaySchedule | null) => {
  if (!schedule) return 'Fermé';
  const hasOpen = Boolean(schedule.open?.trim());
  const hasClose = Boolean(schedule.close?.trim());
  if (!hasOpen && !hasClose) return 'Fermé';
  if (hasOpen && hasClose) return `${schedule.open} - ${schedule.close}`;
  return hasOpen ? schedule.open : schedule.close;
};

const readErrorMessage = async (response: Response) => {
  const statusText = `${response.status} ${response.statusText}`;
  const text = await response.text();
  if (!text) return `Erreur serveur (${statusText})`;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const candidate = (parsed as Record<string, unknown>).message;
      if (typeof candidate === 'string' && candidate.trim()) {
        return `${candidate} (${statusText})`;
      }
      const fallback = (parsed as Record<string, unknown>).error;
      if (typeof fallback === 'string' && fallback.trim()) {
        return `${fallback} (${statusText})`;
      }
    }
  } catch {
    // fallback to raw text below
  }

  return `${text} (${statusText})`;
};

type NewMedDraft = {
  denomination: string;
  categorie: Medicament['categorie'];
  description: string;
  prixUnitaire: string;
  formeGalenique: string;
  dosage: string;
  exigeOrdonnance: boolean;
  stock: string;
};

export default function PharmaciePage() {
  const { userName, pharmacieId, logout } = useAuth();
  const { pharmacies, updateCatalogue, updateGarde, updatePharmacie } = useStore();

  const [tab, setTab] = useState<'profil' | 'catalogue' | 'ordonnances'>('profil');
  const fallbackPharma = pharmacies.find(p => p.id === pharmacieId) ?? pharmacies[0];

  const [profile, setProfile] = useState<Pharmacie | null>(fallbackPharma ?? null);
  const [catalogue, setCatalogue] = useState<Medicament[]>([]);
  const [garde, setGarde] = useState(Boolean(fallbackPharma?.garde));
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState<NewMedDraft>({
    denomination: '',
    categorie: 'autre',
    description: '',
    prixUnitaire: '',
    formeGalenique: '',
    dosage: '',
    exigeOrdonnance: false,
    stock: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [noticeFile, setNoticeFile] = useState<File | null>(null);

  const [editing, setEditing] = useState(false);
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(() => parseHoraires(fallbackPharma?.horaires));
  const [rawHoraires, setRawHoraires] = useState(fallbackPharma?.horaires ?? '');
  const [selectedDays, setSelectedDays] = useState<(typeof dayOrder)[number][]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<{ id: number; createdAt: string; fileUrl: string | null } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);

      if (typeof window === 'undefined') {
        setLoadingProfile(false);
        return;
      }

      const token = localStorage.getItem('proxymedoc_token');
      if (!token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:8081/api/pharmacies/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let payload: any = null;
        try {
          const text = await res.text();
          payload = text ? JSON.parse(text) : null;
        } catch {
          payload = null;
        }

        if (!res.ok) {
          const backendMessage = await readErrorMessage(res);
          throw new Error(backendMessage || 'Impossible de charger les informations de la pharmacie.');
        }

        const mapped = mapBackendPharmacy(payload, pharmacieId);
        setProfile(mapped);
        setCatalogue(mapped.meds.map(m => ({ ...m })));
        setGarde(Boolean(mapped.garde));
        setRawHoraires(mapped.horaires ?? '');
        setDaySchedules(parseHoraires(mapped.horaires ?? ''));
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : 'Erreur inconnue');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [pharmacieId]);

  const pharma = profile ?? fallbackPharma;
  const statusBadge = getStatusBadge(pharma?.statut);
  const pharmacyImage = pharma?.images?.[0] ?? pharma?.images?.find((url): url is string => Boolean(url?.trim()));

  const toggleDay = (day: (typeof dayOrder)[number]) => {
    setSelectedDays(prev => {
      const isSelected = prev.includes(day);
      const next = isSelected ? prev.filter(item => item !== day) : [...prev, day];
      const sorted = [...next].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

      if (!isSelected) {
        setCurrentDayIndex(sorted.indexOf(day));
      } else {
        setCurrentDayIndex(prevIndex => Math.max(0, Math.min(prevIndex, sorted.length - 1)));
      }

      return sorted;
    });
  };

  const updateDaySchedule = (day: string, field: 'open' | 'close', value: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const goToDay = (step: -1 | 1) => {
    if (selectedDays.length === 0) return;

    const nextIndex = Math.max(0, Math.min(selectedDays.length - 1, currentDayIndex + step));
    setCurrentDayIndex(nextIndex);
  };

  const startEdit = () => {
    const initialSchedules = parseHoraires(pharma?.horaires ?? '');
    const activeDays = dayOrder.filter(day => Boolean(initialSchedules[day]?.open || initialSchedules[day]?.close));

    setDaySchedules(initialSchedules);
    setSelectedDays(activeDays.length > 0 ? activeDays : dayOrder.filter(day => day === 'Lundi'));
    setCurrentDayIndex(0);
    setPhone(pharma?.telephone ?? '');
    setLatitude(String(pharma?.latitude ?? ''));
    setLongitude(String(pharma?.longitude ?? ''));
    setEditing(true);
  };

  const saveEdit = async () => {
    const nextSchedules = dayOrder.reduce<Record<string, DaySchedule>>((acc, day) => {
      if (selectedDays.includes(day)) {
        const schedule = daySchedules[day];
        acc[day] = schedule ?? { open: '', close: '' };
      }
      return acc;
    }, {});

    const nextRaw = Object.keys(nextSchedules).length > 0 ? JSON.stringify(nextSchedules) : '';
    setRawHoraires(nextRaw);

    const patch: Partial<Pharmacie> = {
      horaires: nextRaw,
      telephone: phone,
      latitude: parseFloat(latitude) || pharma?.latitude || 0,
      longitude: parseFloat(longitude) || pharma?.longitude || 0,
    };

    if (pharma?.id) {
      try {
        setProfileError(null);
        const token = localStorage.getItem('proxymedoc_token');
        const res = await fetch('http://localhost:8081/api/pharmacies/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            horaires: nextRaw,
            telephone: phone,
            latitude: parseFloat(latitude) || pharma?.latitude || 0,
            longitude: parseFloat(longitude) || pharma?.longitude || 0,
          }),
        });

        if (!res.ok) {
          const errorPayload = await readErrorMessage(res);
          throw new Error(errorPayload || 'Échec de la mise à jour');
        }

        const savedPayload = await res.json();
        const updated = mapBackendPharmacy(savedPayload?.pharmacy ?? savedPayload, pharma.id);
        setProfile(updated);
        setCatalogue(updated.meds.map(m => ({ ...m })));
        setGarde(Boolean(updated.garde));
        setDaySchedules(parseHoraires(updated.horaires ?? ''));
        setRawHoraires(updated.horaires ?? '');
        updatePharmacie(pharma.id, patch);
        setEditing(false);
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    }
  };

  // Catalogue inline edit (prix / stock)
  const openOrdonnanceModal = (ordonnance: { id: number; createdAt: string; fileUrl: string | null }) => {
    setSelectedOrdonnance(ordonnance);
  };

  const closeOrdonnanceModal = () => {
    setSelectedOrdonnance(null);
  };

  const resetNewMedForm = () => {
    setNewMed({
      denomination: '',
      categorie: 'autre',
      description: '',
      prixUnitaire: '',
      formeGalenique: '',
      dosage: '',
      exigeOrdonnance: false,
      stock: '',
    });
    setPhotoFile(null);
    setNoticeFile(null);
  };

  const addMed = async () => {
    const denomination = newMed.denomination.trim();
    if (!denomination) return;

    const nom = denomination;
    const prixUnitaire = parseFloat(newMed.prixUnitaire) || 0;
    const stock = parseInt(newMed.stock) || 0;
    const description = newMed.description.trim() || 'Notice du médicament non disponible.';
    const categorie = newMed.categorie || getMedicamentCategory(nom);
    const photoPreviewUrl = photoFile ? URL.createObjectURL(photoFile) : '';
    const noticePreviewUrl = noticeFile ? URL.createObjectURL(noticeFile) : '';

    const fallbackMed: Medicament = {
      nom,
      prix: prixUnitaire,
      stock,
      description,
      image: photoPreviewUrl || getMedicamentImage(nom),
      categorie,
      denomination,
      formeGalenique: newMed.formeGalenique.trim(),
      dosage: newMed.dosage.trim(),
      exigeOrdonnance: newMed.exigeOrdonnance,
      imageUrl: photoPreviewUrl,
      noticeUrl: noticePreviewUrl,
    };

    setProfileError(null);

    let createdMed: Medicament = fallbackMed;
    try {
      const token = localStorage.getItem('proxymedoc_token');
      const formData = new FormData();
      formData.append('denomination', denomination);
      formData.append('categorie', categorie);
      formData.append('description', description);
      formData.append('prixUnitaire', String(prixUnitaire));
      formData.append('stock', String(stock));
      formData.append('formeGalenique', newMed.formeGalenique.trim());
      formData.append('dosage', newMed.dosage.trim());
      formData.append('exigeOrdonnance', String(newMed.exigeOrdonnance));
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      if (noticeFile) {
        formData.append('notice', noticeFile);
      }

      const res = await fetch('http://localhost:8081/api/medicaments/with-files', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!res.ok) {
        const errorMessage = await readErrorMessage(res);
        setProfileError(errorMessage || 'Le médicament a été ajouté localement mais l’enregistrement du backend a échoué.');
      } else {
        const saved = await res.json();
        createdMed = {
          ...fallbackMed,
          id: saved?.id ?? undefined,
          nom: saved?.nom ?? nom,
          prix: Number(saved?.prixUnitaire ?? prixUnitaire),
          description: saved?.description ?? description,
          image: saved?.imageUrl || fallbackMed.image,
          categorie: (saved?.categorie ?? categorie) as Medicament['categorie'],
          denomination: saved?.denomination ?? denomination,
          formeGalenique: saved?.formeGalenique ?? fallbackMed.formeGalenique,
          dosage: saved?.dosage ?? fallbackMed.dosage,
          exigeOrdonnance: Boolean(saved?.exigeOrdonnance ?? fallbackMed.exigeOrdonnance),
          imageUrl: saved?.imageUrl ?? fallbackMed.imageUrl,
          noticeUrl: saved?.noticeUrl ?? fallbackMed.noticeUrl,
        };
      }
    } catch (error) {
        setProfileError(error instanceof Error ? error.message : 'Impossible d’ajouter le médicament.');
        return;
      }

      const updated = [...catalogue, createdMed];
      setCatalogue(updated);
      if (pharma?.id) {
        updateCatalogue(pharma.id, updated);
      }
      resetNewMedForm();
      setShowAdd(false);
    };
  const removeMed = (index: number) => {
    const updated = catalogue.filter((_, i) => i !== index); // index au lieu du nom pour éviter les doublons
    setCatalogue(updated);
    updateCatalogue(pharma.id, updated); // propagation au store global
  };

  const toggleGarde = async () => {
    if (!pharma?.id) return;

    const next = !garde;
    setGarde(next);
    setProfile(prev => prev ? { ...prev, garde: next } : prev);
    updateGarde(pharma.id, next);

    try {
      const token = localStorage.getItem('proxymedoc_token');
      const res = await fetch('http://localhost:8081/api/pharmacies/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estDeGarde: next }),
      });

      if (!res.ok) {
        const errorPayload = await readErrorMessage(res);
        throw new Error(errorPayload || 'Échec de la mise à jour du statut de garde');
      }

      const savedPayload = await res.json();
      const updated = mapBackendPharmacy(savedPayload?.pharmacy ?? savedPayload, pharma.id);
      setProfile(updated);
      setGarde(Boolean(updated.garde));
      updateGarde(pharma.id, Boolean(updated.garde));
      setProfileError(null);
    } catch (error) {
      setGarde(!next);
      setProfile(prev => prev ? { ...prev, garde: !next } : prev);
      updateGarde(pharma.id, !next);
      setProfileError(error instanceof Error ? error.message : 'Erreur inconnue');
    }
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
          <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${statusBadge.className}`}>{statusBadge.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={18} className="text-slate-300 opacity-70" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-300 text-slate-700 rounded-full text-xs flex items-center justify-center opacity-80">3</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
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
          <div className="space-y-4">
            {loadingProfile && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Chargement des informations depuis le backend…
              </div>
            )}
            {profileError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {profileError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold mb-4">Informations & Statut</h2>
              <div className="mb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-2/3 rounded-xl overflow-hidden">
                    <PharmacyImage
                      src={pharmacyImage}
                      alt={`Photo de ${pharma?.nom || 'la pharmacie'}`}
                      className="w-full h-full object-cover object-center"
                      fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-r from-green-500 to-green-700 text-white"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Nom</p>
                  <p className="font-semibold text-slate-800">{pharma?.nom || 'Pharmacie'}</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1"><MapPin size={13} /> Adresse</span>
                    <span className="font-medium">{pharma?.adresse || 'Non renseignée'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center gap-1"><Phone size={13} /> Téléphone</span>
                    <span className="font-medium">{pharma?.telephone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-400">Licence</span>
                    <span className="font-medium">{pharma?.licence || 'Non renseignée'}</span>
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
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold mb-4">Horaires d'ouverture</h2>
              <div className="space-y-2 text-sm mb-4">
                {!editing ? (
                  <>
                    {dayOrder.map((day) => {
                      const schedule = daySchedules[day];
                      return (
                        <div key={day} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                          <span className="text-slate-400">{day}</span>
                          <span className={`font-medium ${!schedule?.open && !schedule?.close ? 'text-red-500' : ''}`}>
                            {formatHours(schedule)}
                          </span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap gap-2">
                        {dayOrder.map(day => {
                          const active = selectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? 'border-green-600 bg-green-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-green-300'}`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Parcours par jour</p>
                            <p className="text-xs text-slate-500">Sélectionnez les jours actifs puis renseignez les horaires.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => goToDay(-1)} disabled={selectedDays.length === 0 || currentDayIndex === 0} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50">
                              Précédent
                            </button>
                            <button type="button" onClick={() => goToDay(1)} disabled={selectedDays.length === 0 || currentDayIndex === selectedDays.length - 1} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50">
                              Suivant
                            </button>
                          </div>
                        </div>

                        {selectedDays.length > 0 && currentDayIndex < selectedDays.length ? (
                          <>
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-700">{selectedDays[currentDayIndex]}</span>
                              <span className="text-xs text-slate-500">{currentDayIndex + 1}/{selectedDays.length}</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="text-sm text-slate-600">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Ouverture</span>
                                <input
                                  type="time"
                                  value={daySchedules[selectedDays[currentDayIndex]]?.open ?? ''}
                                  onChange={(e) => updateDaySchedule(selectedDays[currentDayIndex], 'open', e.target.value)}
                                  className="input-field"
                                />
                              </label>
                              <label className="text-sm text-slate-600">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Fermeture</span>
                                <input
                                  type="time"
                                  value={daySchedules[selectedDays[currentDayIndex]]?.close ?? ''}
                                  onChange={(e) => updateDaySchedule(selectedDays[currentDayIndex], 'close', e.target.value)}
                                  className="input-field"
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-slate-500">Sélectionnez au moins un jour ouvrable.</p>
                        )}
                      </div>
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
                  <MapPin size={14} className="mr-1" /> {pharma?.latitude ?? 0}°N, {pharma?.longitude ?? 0}°E
                </div>
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

            {catalogueError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-4 text-sm text-red-600">
                {catalogueError}
              </div>
            )}

            {showAdd && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="field-label">Dénomination du médicament</label>
                    <input value={newMed.denomination} onChange={e => setNewMed(p => ({ ...p, denomination: e.target.value }))} placeholder="Amoxicilline" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Catégorie</label>
                    <select value={newMed.categorie} onChange={e => setNewMed(p => ({ ...p, categorie: e.target.value as Medicament['categorie'] }))} className="input-field">
                      <option value="antibiotique">Antibiotique</option>
                      <option value="analgesique">Analgésique</option>
                      <option value="anti-inflammatoire">Anti-inflammatoire</option>
                      <option value="antidiabetique">Antidiabétique</option>
                      <option value="antihypertenseur">Antihypertenseur</option>
                      <option value="antiulcereux">Antiulcéreux</option>
                      <option value="antihistaminique">Antihistaminique</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Prix unitaire (FCFA)</label>
                    <input type="number" value={newMed.prixUnitaire} onChange={e => setNewMed(p => ({ ...p, prixUnitaire: e.target.value }))} placeholder="1500" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Forme galénique</label>
                    <input value={newMed.formeGalenique} onChange={e => setNewMed(p => ({ ...p, formeGalenique: e.target.value }))} placeholder="Comprimé" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Dosage</label>
                    <input value={newMed.dosage} onChange={e => setNewMed(p => ({ ...p, dosage: e.target.value }))} placeholder="500 mg" className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Stock</label>
                    <input type="number" value={newMed.stock} onChange={e => setNewMed(p => ({ ...p, stock: e.target.value }))} placeholder="50" className="input-field" />
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <input type="checkbox" checked={newMed.exigeOrdonnance} onChange={e => setNewMed(p => ({ ...p, exigeOrdonnance: e.target.checked }))} />
                    Exige une ordonnance
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <label className="field-label">Description</label>
                    <textarea value={newMed.description} onChange={e => setNewMed(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez les indications et la notice du médicament" className="input-field min-h-24" />
                  </div>
                  <div>
                    <label className="field-label">Photo du médicament (image)</label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} className="input-field" />
                    {photoFile ? <p className="mt-1 text-xs text-slate-500">Fichier sélectionné : {photoFile.name}</p> : <p className="mt-1 text-xs text-slate-400">PNG, JPG ou WebP</p>}
                  </div>
                  <div>
                    <label className="field-label">Notice du médicament (PDF)</label>
                    <input type="file" accept=".pdf,application/pdf" onChange={e => setNoticeFile(e.target.files?.[0] ?? null)} className="input-field" />
                    {noticeFile ? <p className="mt-1 text-xs text-slate-500">Fichier sélectionné : {noticeFile.name}</p> : <p className="mt-1 text-xs text-slate-400">PDF uniquement</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void addMed()} className="btn-primary text-sm py-1.5 px-3 rounded-lg">Ajouter</button>
                  <button onClick={() => { setShowAdd(false); resetNewMedForm(); }} className="text-sm py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">Annuler</button>
                </div>
              </div>
            )}

            <PharmacieCatalogue meds={catalogue} pharmacyId={pharma?.id ?? 0} onUpdate={setCatalogue} />
          </div>
        )}

        {tab === 'ordonnances' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <h2 className="font-semibold mb-2">Ordonnances</h2>
            <p className="text-sm text-slate-500">Le traitement des ordonnances sera bientôt disponible.</p>
          </div>
        )}
      </div>

      {/* Ordonnance modal removed - feature coming soon */}
    </div>
  );
}
