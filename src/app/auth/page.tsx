'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Pill, Eye, EyeOff, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const { login, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role) {
      const target = role === 'admin' ? '/admin' : role === 'pharmacie' ? '/pharmacie' : '/patient';
      router.replace(target);
    }
  }, [role, router]);
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [regRole, setRegRole] = useState<'patient' | 'pharmacie'>('patient');
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLicence, setRegLicence] = useState('');
  const [regAdresse, setRegAdresse] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [regLastName, setRegLastName] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regPharmacyName, setRegPharmacyName] = useState('');
  const [regPharmacyPhone, setRegPharmacyPhone] = useState('');
  const [regLatitude, setRegLatitude] = useState('');
  const [regLongitude, setRegLongitude] = useState('');
  const [regHoraires, setRegHoraires] = useState('');
  const [daySchedules, setDaySchedules] = useState<Record<string, { open: string; close: string }>>({
    Lundi: { open: '08:00', close: '20:00' },
    Mardi: { open: '08:00', close: '20:00' },
    Mercredi: { open: '08:00', close: '20:00' },
    Jeudi: { open: '08:00', close: '20:00' },
    Vendredi: { open: '08:00', close: '20:00' },
    Samedi: { open: '08:00', close: '20:00' },
    Dimanche: { open: '08:00', close: '20:00' },
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [customizedDays, setCustomizedDays] = useState<Record<string, boolean>>({});
  const [regEstDeGarde, setRegEstDeGarde] = useState(false);
  const [agrementFile, setAgrementFile] = useState<File | null>(null);
  const [fichierRcFile, setFichierRcFile] = useState<File | null>(null);
  const [pharmacyImages, setPharmacyImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const syncCommonFields = (field: 'lastName' | 'firstName' | 'phone', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (field === 'lastName' && !regPharmacyName.trim()) {
      setRegPharmacyName(trimmed);
    }

    if (field === 'firstName' && !regPharmacyName.trim()) {
      setRegPharmacyName(trimmed);
    }

    if (field === 'phone' && !regPharmacyPhone.trim()) {
      setRegPharmacyPhone(trimmed);
    }
  };

  const toggleDay = (day: string) => {
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
    setCustomizedDays(prev => ({ ...prev, [day]: true }));
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
    const currentDay = selectedDays[currentDayIndex];
    const targetDay = selectedDays[nextIndex];

    if (step === 1 && currentDay && targetDay && !customizedDays[targetDay]) {
      setDaySchedules(prev => ({
        ...prev,
        [targetDay]: {
          ...(prev[currentDay] ?? { open: '08:00', close: '20:00' }),
        },
      }));
    }

    setCurrentDayIndex(nextIndex);
  };

  useEffect(() => {
    const scheduleByDay = dayOrder.reduce<Record<string, { open: string; close: string }>>((acc, day) => {
      if (selectedDays.includes(day)) {
        acc[day] = daySchedules[day] ?? { open: '08:00', close: '20:00' };
      }
      return acc;
    }, {});

    const formattedHours = Object.keys(scheduleByDay).length > 0 ? JSON.stringify(scheduleByDay) : '';
    setRegHoraires(formattedHours);
  }, [selectedDays, daySchedules]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });

      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const msg = (data && data.message) || res.statusText || 'Identifiants invalides';
        throw new Error(msg);
      }

      const role = data.user?.role === 'pharmacie' ? 'pharmacie' : data.user?.role === 'admin' ? 'admin' : 'patient';
      login(role, data.user?.name || email, data.user?.pharmacieId ?? undefined, data.token);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Email ou mot de passe incorrect.');
    }
  };

  useEffect(() => {
    const previews = pharmacyImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => previews.forEach(URL.revokeObjectURL);
  }, [pharmacyImages]);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const toastNotification = notification ? (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-green-200 bg-green-50 p-4 shadow-lg shadow-slate-900/5 text-sm text-green-900">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle size={18} />
        </span>
        <div>
          <p className="font-semibold">Inscription réussie</p>
          <p className="mt-1 text-sm text-slate-700">{notification}</p>
        </div>
      </div>
    </div>
  ) : null;

  const handleAgrementChange = (file: File | null) => {
    setAgrementFile(file);
  };

  const handleFichierRcChange = (file: File | null) => {
    setFichierRcFile(file);
  };

  const handlePharmacyImageChange = (index: number, file: File | null) => {
    if (!file) return;
    setPharmacyImages(prev => {
      const next = Array.from({ length: 3 }, (_, i) => prev[i] ?? null);
      next[index] = file;
      return next.filter((item): item is File => item !== null);
    });
  };

  const clearPharmacyForm = () => {
    setRegRole('pharmacie');
    setRegEmail('');
    setRegPhone('');
    setRegLicence('');
    setRegAdresse('');
    setRegPassword('');
    setRegLastName('');
    setRegFirstName('');
    setRegPharmacyName('');
    setRegPharmacyPhone('');
    setRegLatitude('');
    setRegLongitude('');
    setRegHoraires('');
    setSelectedDays(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']);
    setCurrentDayIndex(0);
    setCustomizedDays({});
    setRegEstDeGarde(false);
    setAgrementFile(null);
    setFichierRcFile(null);
    setPharmacyImages([]);
    setFormErrors({});
    setImagePreviews([]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setLoading(true);
    try {
      let body: BodyInit;
      let headers: HeadersInit | undefined;

      if (regRole === 'pharmacie') {
        const formData = new FormData();
        formData.append('role', regRole);
        formData.append('nom', regLastName);
        formData.append('prenom', regFirstName);
        formData.append('email', regEmail);
        formData.append('phone', regPharmacyPhone || regPhone);
        formData.append('pharmacyName', regPharmacyName || `${regFirstName} ${regLastName}`.trim());
        formData.append('pharmacyPhone', regPharmacyPhone || regPhone);
        formData.append('licence', regLicence);
        formData.append('adresse', regAdresse);
        formData.append('latitude', regLatitude);
        formData.append('longitude', regLongitude);
        formData.append('horaires', regHoraires);
        formData.append('estDeGarde', String(regEstDeGarde));
        formData.append('password', regPassword);
        formData.append('legalDocsCount', String((agrementFile ? 1 : 0) + (fichierRcFile ? 1 : 0)));
        formData.append('pharmacyImagesCount', String(pharmacyImages.length));
        if (agrementFile) formData.append('agrementMinsante', agrementFile);
        if (fichierRcFile) formData.append('fichierRc', fichierRcFile);
        pharmacyImages.forEach(file => formData.append('pharmacyImages', file));
        body = formData;
      } else {
        const jsonBody = {
          role: regRole,
          nom: regLastName,
          prenom: regFirstName,
          email: regEmail,
          phone: regPharmacyPhone || regPhone,
          pharmacyName: regPharmacyName || `${regFirstName} ${regLastName}`.trim(),
          pharmacyPhone: regPharmacyPhone || regPhone,
          licence: regLicence,
          adresse: regAdresse,
          latitude: regLatitude,
          longitude: regLongitude,
          horaires: regHoraires,
          estDeGarde: regEstDeGarde,
          legalDocsCount: (agrementFile ? 1 : 0) + (fichierRcFile ? 1 : 0),
          pharmacyImagesCount: pharmacyImages.length,
          documentsUploaded: Boolean(agrementFile || fichierRcFile),
          legalDocNames: [agrementFile, fichierRcFile].filter(Boolean).map(file => file!.name),
          password: regPassword,
        };
        body = JSON.stringify(jsonBody);
        headers = { 'Content-Type': 'application/json' };
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers,
        body,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Add explicit hint when backend returns 500 (common with OneDrive/Drive files)
        const baseMessage = data?.message ?? res.statusText ?? 'Erreur serveur';
        const message = res.status === 500
          ? `${baseMessage} Vérifiez que les fichiers sont accessibles localement (évitez les dossiers OneDrive/Drive synchronisés) et réessayez.`
          : baseMessage;
        setFormErrors(data?.errors ?? { general: message });
        setLoading(false);
        return;
      }

      if (data.success) {
        if (regRole === 'patient') {
          // Rely solely on backend response: login only when backend confirms and provides token/profile
          if (data.token && data.user) {
            login('patient', (data.user?.name ?? `${regFirstName} ${regLastName}`.trim()) || 'Nouveau Patient', data.user?.pharmacieId ?? undefined, data.token);
          } else {
            // Backend did not provide expected authentication payload — surface error
            setFormErrors({ general: 'Inscription réussie mais aucune session fournie par le serveur. Veuillez vous connecter.' });
          }
        } else {
          setNotification('Inscription réussie ! Votre pharmacie sera validée par l’administrateur sous 24 à 48h.');
          clearPharmacyForm();
        }
      } else {
        setFormErrors(data.errors ?? { general: data.message ?? 'Validation échouée' });
      }
    } catch (err) {
      setFormErrors({ general: 'Impossible de contacter le serveur.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-medium mb-2">Inscription soumise !</h2>
          <p className="text-slate-500 text-sm mb-6">
            Votre demande a été transmise à notre équipe. Vous recevrez une confirmation après vérification de vos documents par l'administrateur (délai : 24–48h).
          </p>
          <button onClick={() => setSubmitted(false)} className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {toastNotification}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className={`w-full ${tab === 'login' ? 'max-w-md' : 'max-w-3xl'}`}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Pill className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">ProxyMédoc</h1>
          <p className="text-slate-500 text-sm mt-1">Trouvez vos médicaments près de chez vous</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${tab === 'login' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${tab === 'register' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Inscription
            </button>
          </div>

          <div className="p-6 lg:p-8">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Mot de passe</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="input-field pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={14} className="flex-shrink-0" /> {loginError}
                  </p>
                )}
                <button type="submit" className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium mt-2">
                  Se connecter
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Je suis un(e)</label>
                  <select value={regRole} onChange={e => setRegRole(e.target.value as typeof regRole)} className="input-field">
                    <option value="patient">Patient</option>
                    <option value="pharmacie">Pharmacie</option>
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">Nom</label>
                    <input type="text" value={regLastName} onBlur={e => syncCommonFields('lastName', e.target.value)} onChange={e => setRegLastName(e.target.value)} placeholder="Dupont" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">Prénom</label>
                    <input type="text" value={regFirstName} onBlur={e => syncCommonFields('firstName', e.target.value)} onChange={e => setRegFirstName(e.target.value)} placeholder="Jean" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">Email</label>
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="vous@exemple.com" className="input-field" />
                    {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">Téléphone</label>
                    <input type="tel" value={regPhone} onBlur={e => syncCommonFields('phone', e.target.value)} onChange={e => setRegPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="input-field" />
                    {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">Mot de passe</label>
                    <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="input-field" />
                    {formErrors.password && <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>}
                  </div>
                </div>
                {regRole === 'pharmacie' && (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">
                        Les informations ci-dessus seront utilisées pour créer le compte du pharmacien, puis la pharmacie sera associée à ce profil.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h3 className="mb-3 text-sm font-semibold text-slate-700">Informations de la pharmacie</h3>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5 font-medium">Nom de la pharmacie</label>
                          <input type="text" value={regPharmacyName} onChange={e => setRegPharmacyName(e.target.value)} placeholder="Pharmacie du Centre" className="input-field" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5 font-medium">Téléphone de la pharmacie</label>
                          <input type="tel" value={regPharmacyPhone} onChange={e => setRegPharmacyPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="input-field" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5 font-medium">Numéro de licence pharmaceutique</label>
                          <input type="text" value={regLicence} onChange={e => setRegLicence(e.target.value)} placeholder="LP-2024-XXXXX" className="input-field" />
                          {formErrors.licence && <p className="text-xs text-red-600 mt-1">{formErrors.licence}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5 font-medium">Adresse de la pharmacie</label>
                          <input type="text" value={regAdresse} onChange={e => setRegAdresse(e.target.value)} placeholder="Quartier, Ville" className="input-field" />
                          {formErrors.adresse && <p className="text-xs text-red-600 mt-1">{formErrors.adresse}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-500 opacity-70"
                        title="Disponible prochainement — clé API Google Maps requise"
                      >
                        Choisir l’emplacement géographique
                      </button>
                      <p className="mt-2 text-xs text-slate-500">Bientôt disponible — intégration Google Maps à venir.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">Latitude</label>
                        <input type="number" step="any" value={regLatitude} onChange={e => setRegLatitude(e.target.value)} placeholder="3.8480" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">Longitude</label>
                        <input type="number" step="any" value={regLongitude} onChange={e => setRegLongitude(e.target.value)} placeholder="11.5021" className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Horaires d’ouverture</label>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap gap-2">
                          {dayOrder.map(day => {
                            const active = selectedDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}
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
                              <p className="text-xs text-slate-500">Naviguez d’un jour à l’autre pour définir les horaires.</p>
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
                                    value={daySchedules[selectedDays[currentDayIndex]]?.open ?? '08:00'}
                                    onChange={e => updateDaySchedule(selectedDays[currentDayIndex], 'open', e.target.value)}
                                    className="input-field"
                                  />
                                </label>
                                <label className="text-sm text-slate-600">
                                  <span className="mb-1 block text-xs font-medium text-slate-500">Fermeture</span>
                                  <input
                                    type="time"
                                    value={daySchedules[selectedDays[currentDayIndex]]?.close ?? '20:00'}
                                    onChange={e => updateDaySchedule(selectedDays[currentDayIndex], 'close', e.target.value)}
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
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={regEstDeGarde} onChange={e => setRegEstDeGarde(e.target.checked)} className="rounded border-slate-300" />
                      Pharmacie de garde
                    </label>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Documents légaux (Agrément MINSANTE, Registre de Commerce)</label>
                      <div className="space-y-3">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <label className="group cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/70 p-5 text-center transition-all duration-200 hover:border-blue-500 hover:bg-blue-100">
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="sr-only"
                              onChange={e => handleAgrementChange(e.target.files?.[0] ?? null)}
                            />
                            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm mx-auto">
                              <Upload size={18} />
                            </div>
                            <p className="text-sm font-medium text-slate-700">Agrément du Ministère de la Santé</p>
                            <p className="mt-1 text-xs text-slate-500">{agrementFile ? agrementFile.name : 'Glissez ou cliquez pour ajouter'}</p>
                          </label>

                          <label className="group cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/70 p-5 text-center transition-all duration-200 hover:border-blue-500 hover:bg-blue-100">
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="sr-only"
                              onChange={e => handleFichierRcChange(e.target.files?.[0] ?? null)}
                            />
                            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm mx-auto">
                              <Upload size={18} />
                            </div>
                            <p className="text-sm font-medium text-slate-700">Inscription au Registre de Commerce (Preuve)</p>
                            <p className="mt-1 text-xs text-slate-500">{fichierRcFile ? fichierRcFile.name : 'Glissez ou cliquez pour ajouter'}</p>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Photos de la pharmacie (max 3)</label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <label key={index} className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center transition-all duration-200 hover:border-blue-400 hover:bg-blue-50">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={e => handlePharmacyImageChange(index, e.target.files?.[0] ?? null)}
                            />
                            {imagePreviews[index] ? (
                              <img src={imagePreviews[index]} alt={`Photo ${index + 1}`} className="mx-auto h-20 w-full rounded-xl object-cover" />
                            ) : (
                              <div className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
                                <span className="text-xl">+</span>
                                <span className="text-[11px]">Photo {index + 1}</span>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Ajoutez jusqu’à 3 photos de votre officine.</p>
                    </div>
                  </>
                )}
                {formErrors.general && (
                  <p className="text-xs text-red-600 text-center">{formErrors.general}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium opacity-100 disabled:opacity-60">
                  {loading ? 'En cours...' : regRole === 'pharmacie' ? 'Soumettre ma demande' : 'Créer mon compte'}
                </button>
                {regRole === 'pharmacie' && (
                  <p className="text-xs text-slate-400 text-center">Votre compte sera activé après validation par l'administrateur</p>
                )}
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
