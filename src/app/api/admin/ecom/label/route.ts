import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { ecomFetch } from '@/lib/ecom';

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tracking = searchParams.get('tracking');
  const format = searchParams.get('format') === '10x10' ? '10x10' : '10x13';

  if (!tracking) return NextResponse.json({ error: 'Tracking requis' }, { status: 400 });

  const res = await ecomFetch<string>(
    `/colis/${encodeURIComponent(tracking)}/bordereau?format=${format}`,
    { rawText: true }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Bordereau introuvable' }, { status: res.status });
  }

  return new NextResponse(res.data, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const trackings: string[] = Array.isArray(body?.trackings) ? body.trackings : [];
  const format = body?.format === '10x10' ? '10x10' : '10x13';

  if (trackings.length === 0) return NextResponse.json({ error: 'Trackings requis' }, { status: 400 });

  const res = await ecomFetch<string>('/colis/bordereaux', {
    method: 'POST',
    body: { trackings: trackings.slice(0, 100), format },
    rawText: true,
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur impression par lot' }, { status: res.status });
  }

  return new NextResponse(res.data, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}