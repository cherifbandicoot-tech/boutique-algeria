import { NextRequest, NextResponse } from 'next/server';
import { getCachedEcomCommunes } from '@/lib/ecom';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const wilaya = parseInt(new URL(req.url).searchParams.get('wilaya') || '16', 10);
  if (wilaya < 1 || wilaya > 58) {
    return NextResponse.json({ communes: [] }, { status: 400 });
  }
  const communes = await getCachedEcomCommunes(wilaya);
  return NextResponse.json({ communes });
}