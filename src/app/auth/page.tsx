'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { comptes } from '@/lib/data';
import { Pill, Building2, Shield, User, Eye, EyeOff, Upload, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [regName, setRegName] = useState('');
  const [legalDocs, setLegalDocs] = useState<File[]>([]);
  const [pharmacyImages, setPharmacyImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const remplirDemo = (r: 'patient' | 'pharmacie' | 'admin') => {
    const compte = comptes.find(c => c.role === r);
    if (!compte) return;
    setTab('login');
    setEmail(compte.email);
    setPass(compte.password);
    setLoginError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Identifiants invalides');
      }

      const role = data.user?.role === 'pharmacie' ? 'pharmacie' : data.user?.role === 'admin' ? 'admin' : 'patient';
      login(role, data.user?.name || email, data.user?.pharmacieId ?? undefined);
    } catch (error) {
      const compte = comptes.find(
        c => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === pass
      );
      if (compte) {
        login(compte.role, compte.nom, compte.pharmacieId);
      } else {
        setLoginError(error instanceof Error ? error.message : 'Email ou mot de passe incorrect.');
      }
    }
  };

  useEffect(() => {
    const previews = pharmacyImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => previews.forEach(URL.revokeObjectURL);
  }, [pharmacyImages]);

  const handleLegalDocsChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setLegalDocs(prev => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, 2);
    });
  };

  const handlePharmacyImageChange = (index: number, file: File | null) => {
    if (!file) return;
    setPharmacyImages(prev => {
      const next = Array.from({ length: 3 }, (_, i) => prev[i] ?? null);
      next[index] = file;
      return next.filter((item): item is File => item !== null);
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setLoading(true);
    try {
      const body = {
        role: regRole,
        name: regName,
        email: regEmail,
        phone: regPhone,
        licence: regLicence,
        adresse: regAdresse,
        legalDocsCount: legalDocs.length,
        pharmacyImagesCount: pharmacyImages.length,
        documentsUploaded: legalDocs.length > 0,
        legalDocNames: legalDocs.map(file => file.name),
        password: regPassword,
      };

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormErrors(data.errors ?? { general: data.message ?? 'Erreur serveur' });
        setLoading(false);
        return;
      }

      if (data.success) {
        if (regRole === 'patient') {
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            comptes.push({ email: regEmail, password: regPassword || '', nom: (data.user?.name ?? regName) || 'Nouveau Patient', role: 'patient' });
          } catch (e) {
            // ignore if pushing fails
          }

          login('patient', (data.user?.name ?? regName) || 'Nouveau Patient');
        } else {
          setSubmitted(true);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
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

          <div className="p-6">
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
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Nom complet / Raison sociale</label>
                  <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Jean Dupont" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Email</label>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="vous@exemple.com" className="input-field" />
                  {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Téléphone</label>
                  <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="input-field" />
                  {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
                </div>
                {regRole === 'pharmacie' && (
                  <>
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
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Documents légaux (Agrément, Registre de Commerce)</label>
                      <div className="space-y-2">
                        <label className="group cursor-pointer rounded-lg border border-dashed border-slate-200 p-2.5 text-center transition hover:border-blue-400 hover:bg-blue-50">
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            multiple
                            className="sr-only"
                            onChange={e => handleLegalDocsChange(e.target.files)}
                          />
                          <Upload className="mx-auto text-slate-400" size={16} />
                          <p className="text-xs text-slate-500">Cliquer pour ajouter</p>
                          <p className="text-xs text-slate-400">PDF, PNG, JPG (max 2)</p>
                        </label>
                        {legalDocs.length > 0 && (
                          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                            <p className="text-xs font-medium text-green-700 mb-2">{legalDocs.length} fichier{legalDocs.length > 1 ? 's' : ''} sélectionné{legalDocs.length > 1 ? 's' : ''}</p>
                            <ul className="space-y-1">
                              {legalDocs.map((file, idx) => (
                                <li key={idx} className="text-xs text-green-600 truncate flex items-center justify-between">
                                  <span className="truncate">• {file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setLegalDocs(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-green-600 hover:text-red-600 ml-2 flex-shrink-0"
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Photos de la pharmacie (max 3)</label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <label key={index} className="group cursor-pointer rounded-3xl border border-slate-200 p-3 text-center transition hover:border-blue-400">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={e => handlePharmacyImageChange(index, e.target.files?.[0] ?? null)}
                            />
                            {imagePreviews[index] ? (
                              <img src={imagePreviews[index]} alt={`Photo ${index + 1}`} className="mx-auto h-20 w-full rounded-2xl object-cover" />
                            ) : (
                              <div className="flex h-20 flex-col items-center justify-center gap-1 text-slate-400">
                                <span className="text-xl">+</span>
                                <span className="text-[11px]">Photo {index + 1}</span>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Ajoutez jusqu’à 3 photos de votre officine.</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium">Mot de passe</label>
                  <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="input-field" />
                  {formErrors.password && <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>}
                </div>
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

        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 text-center mb-3">Accès démo rapide</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => remplirDemo('patient')} className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <User size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-slate-600">Patient</span>
            </button>
            <button onClick={() => remplirDemo('pharmacie')} className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <Building2 size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-slate-600">Pharmacie</span>
            </button>
            <button onClick={() => remplirDemo('admin')} className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <Shield size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-slate-600">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
