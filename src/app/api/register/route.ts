import { NextResponse } from 'next/server';

// Proxy the registration request to the real backend so registrations are persisted.
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const backendRes = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const text = await backendRes.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      const status = backendRes.status || (data && data.status) || 500;
      return NextResponse.json(data ?? { success: false, message: 'Erreur backend' }, { status });
    }

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
