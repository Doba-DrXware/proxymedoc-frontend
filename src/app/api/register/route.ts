import { NextResponse } from 'next/server';

// Proxy the registration request to the real backend so registrations are persisted.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendRes = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);

    const status = backendRes.status || (data && data.status) || 500;

    return NextResponse.json(data ?? { success: false, message: 'Erreur backend' }, { status });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}
