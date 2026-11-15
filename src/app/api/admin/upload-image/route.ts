import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

const cleanEnv = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '');

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Veuillez choisir une image valide' }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop lourde (max 4 Mo)' }, { status: 400 });
  }

  // 1. Try Cloudinary first if configured
  const cloudName = cleanEnv(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  if (cloudName && apiKey && apiSecret) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'algeria-boutique';
      const signature = crypto
        .createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', String(timestamp));
      fd.append('signature', signature);
      fd.append('folder', folder);

      const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await up.json().catch(() => ({}));
      if (up.ok && data.secure_url) {
        const optimized = String(data.secure_url).replace('/upload/', '/upload/f_auto,q_auto,w_1400/');
        return NextResponse.json({ url: optimized, storage: 'cloudinary' });
      }
    } catch {
      // Fall through cleanly to PostgreSQL storage
    }
  }

  // 2. Foolproof fallback: save directly into PostgreSQL StoredImage
  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await prisma.storedImage.create({
    data: {
      mimeType: file.type || 'image/jpeg',
      data: buffer,
    },
    select: { id: true },
  });

  return NextResponse.json({ url: `/api/images/${saved.id}`, storage: 'database' });
}