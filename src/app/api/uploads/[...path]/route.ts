import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const rawPath = req.nextUrl.pathname.replace(/^\/api\/uploads\/?/, '');
    const normalizedPath = rawPath.replace(/^\/+/, '');
    const backendPath = normalizedPath.startsWith('uploads/') ? normalizedPath : `uploads/${normalizedPath}`;
    const backendUrl = `http://localhost:8080/${backendPath}`;

    const backendRes = await fetch(backendUrl, { redirect: 'follow' });
    if (!backendRes.ok) {
      return new NextResponse('Document introuvable', { status: backendRes.status });
    }

    const contentType = backendRes.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await backendRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch {
    return new NextResponse('Erreur lors du chargement du document', { status: 500 });
  }
}
