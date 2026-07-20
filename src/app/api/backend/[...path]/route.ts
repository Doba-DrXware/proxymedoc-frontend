import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, 'POST');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, 'PATCH');
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, params, 'DELETE');
}

async function proxy(req: NextRequest, params: Promise<{ path?: string[] }>, method: string) {
  const { path = [] } = await params;
  const targetPath = path.join('/');
  const targetUrl = new URL(`${BACKEND_URL}/api/${targetPath}${req.nextUrl.search}`);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set('x-forwarded-host', req.headers.get('host') ?? 'localhost:3000');
  headers.set('x-forwarded-proto', 'http');

  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const text = await req.text();
    body = text ? text : undefined;
  }

  const backendRes = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  const responseBody = await backendRes.text();
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (!['content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}
