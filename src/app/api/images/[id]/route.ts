import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const img = await prisma.storedImage.findUnique({ where: { id } });
  if (!img) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(img.data), {
    status: 200,
    headers: {
      'Content-Type': img.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}