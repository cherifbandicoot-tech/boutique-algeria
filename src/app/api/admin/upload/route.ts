import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

const cleanEnv = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '');

export async function POST() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cloudName = cleanEnv(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary is not configured in .env' }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'algeria-boutique';
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  return NextResponse.json({ timestamp, signature, apiKey, cloudName, folder });
}