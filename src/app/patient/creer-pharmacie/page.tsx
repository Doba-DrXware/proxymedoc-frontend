'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, Pill } from 'lucide-react';

export default function CreerPharmaciePage() {
  const router = useRouter();
  const [agrementFile, setAgrementFile] = useState<File | null>(null);
  const [fichierRcFile, setFichierRcFile] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setPreviews(urls);

    return () => urls.forEach(URL.revokeObjectURL);
  }, [images]);

  const handleAgrementChange = (files: FileList | null) => {
    setAgrementFile(files?.[0] ?? null);
  };

  const handleFichierRcChange = (files: FileList | null) => {
    setFichierRcFile(files?.[0] ?? null);
  };

  const handleImageChange = (index: number, file: File | null) => {
    if (!file) return;
    setImages(prev => {
      const next = Array.from({ length: 3 }, (_, i) => prev[i] ?? null);
      next[index] = file;
      return next.filter((item): item is File => item !== null);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-medium mb-2">Demande envoyée</h2>
          <p className="text-slate-500 text-sm mb-6">
            Votre demande de création de pharmacie a bien été soumise. Elle sera examinée par l’administrateur dans les prochains jours.
          </p>
          <button onClick={() => router.push('/patient')} className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium">
            Retour à l’espace patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-blue-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Pill size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Créer ma pharmacie</h1>
                <p className="text-sm text-blue-100">Remplissez les informations requises pour ouvrir votre demande</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Nom de la pharmacie</label>
              <input type="text" placeholder="Nom de votre pharmacie" className="input-field" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Adresse</label>
              <input type="text" placeholder="Quartier, Ville" className="input-field" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Téléphone</label>
              <input type="tel" placeholder="+237 6XX XXX XXX" className="input-field" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Numéro de licence pharmaceutique</label>
              <input type="text" placeholder="LP-2024-XXXXX" className="input-field" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Agrément (Ministère de la Santé)</label>
              <label className="group cursor-pointer rounded-3xl border border-dashed border-slate-200 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="sr-only"
                  onChange={e => handleAgrementChange(e.target.files)}
                />
                <Upload className="mx-auto mb-1 text-slate-400" size={20} />
                <p className="text-xs text-slate-500">{agrementFile ? agrementFile.name : 'Cliquer pour téléverser l’agrément'}</p>
              </label>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Preuve d'inscription (Registre de Commerce)</label>
              <label className="group cursor-pointer rounded-3xl border border-dashed border-slate-200 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="sr-only"
                  onChange={e => handleFichierRcChange(e.target.files)}
                />
                <Upload className="mx-auto mb-1 text-slate-400" size={20} />
                <p className="text-xs text-slate-500">{fichierRcFile ? fichierRcFile.name : 'Cliquer pour téléverser le justificatif RC'}</p>
              </label>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Images de la pharmacie (3 max)</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <label
                    key={index}
                    className="group cursor-pointer rounded-3xl border border-slate-200 p-4 text-center transition hover:border-blue-400"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={e => handleImageChange(index, e.target.files?.[0] ?? null)}
                    />
                    {previews[index] ? (
                      <img
                        src={previews[index]}
                        alt={`Photo ${index + 1}`}
                        className="mx-auto h-28 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-28 flex-col items-center justify-center gap-2 text-slate-400">
                        <span className="text-2xl">+</span>
                        <span className="text-xs">Image {index + 1}</span>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Ajoutez jusqu’à 3 photos de votre officine.</p>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Mot de passe</label>
              <input type="password" placeholder="••••••••" className="input-field" />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium">
              Soumettre ma demande
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
