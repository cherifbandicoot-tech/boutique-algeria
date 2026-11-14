import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL_POOLED,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ].filter((u): u is string => Boolean(u && (u.startsWith('postgres://') || u.startsWith('postgresql://'))));

  const raw = candidates[0];
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    if (process.env.NODE_ENV === 'production') {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '20');
      }
      if (url.hostname.includes('pooler') && !url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;