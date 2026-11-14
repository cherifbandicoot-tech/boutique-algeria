import { NextRequest, NextResponse } from 'next/server';
import { getCachedEcomStopdesks } from '@/lib/ecom';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const wilaya = parseInt(new URL(req.url).searchParams.get('wilaya') || '16', 10);
  if (wilaya < 1 || wilaya > 58) {
    return NextResponse.json({ stopdesks: [] }, { status: 400 });
  }
  const stopdesks = await getCachedEcomStopdesks(wilaya);
  return NextResponse.json({ stopdesks });
}