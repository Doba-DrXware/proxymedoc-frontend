import { NextResponse } from 'next/server';
import { demandesPharmacie, Pharmacie } from '@/lib/data';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const errors: Record<string, string> = {};

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Payload invalide' }, { status: 400 });
    }

    const role = body.role;
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();

    if (!name) errors.name = 'Le nom est requis.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email invalide.';

    if (role === 'pharmacie') {
      if (!body.licence || String(body.licence).trim() === '') errors.licence = 'Le numéro de licence est requis.';
      if (!body.documentsUploaded) errors.documents = 'Les documents sont requis.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (role === 'patient') {
      return NextResponse.json({ success: true, user: { role: 'patient', name } }, { status: 200 });
    }

    // role === 'pharmacie' -> ajouter à demandes en mémoire
    const maxId = demandesPharmacie.reduce((m, p) => Math.max(m, p.id), 0);
    const newPh: Pharmacie = {
      id: maxId + 1 || Date.now(),
      nom: name,
      adresse: body.adresse || '',
      distance: 0,
      garde: false,
      telephone: body.phone || '',
      horaires: '',
      statut: 'attente',
      score_ia: Math.floor(Math.random() * 100),
      latitude: 0,
      longitude: 0,
      meds: [],
      contact: name,
      licence: body.licence || undefined,
      docs: body.documentsUploaded ? (Array.isArray(body.legalDocNames) && body.legalDocNames.length > 0 ? body.legalDocNames : ['Agrément', 'Registre de Commerce']) : [],
    };

    demandesPharmacie.push(newPh);

    return NextResponse.json({ success: true, status: 'attente', message: 'Demande reçue' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
