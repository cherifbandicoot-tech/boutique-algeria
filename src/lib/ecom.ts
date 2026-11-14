const ECOM_BASE_URL = 'https://ecom-dz.com/api_v2';

export function getEcomCredentials() {
  const apiKey = (process.env.ECOM_API_KEY || process.env.ECOM_API_ID || '').trim();
  const apiToken = (process.env.ECOM_API_TOKEN || '').trim();
  return { apiKey, apiToken, configured: Boolean(apiKey && apiToken) };
}

export interface EcomRateLimits {
  version?: string | null;
  remaining1m?: string | null;
  remaining1h?: string | null;
  remaining24h?: string | null;
}

export async function ecomFetch<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    timeoutMs?: number;
    rawText?: boolean;
  } = {}
): Promise<{ ok: boolean; status: number; data: T; limits: EcomRateLimits }> {
  const { apiKey, apiToken, configured } = getEcomCredentials();
  if (!configured) {
    throw new Error('Clés E-com Delivery (ECOM_API_ID / ECOM_API_TOKEN) non configurées');
  }

  const res = await fetch(`${ECOM_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'X-API-Key': apiKey,
      'X-API-Token': apiToken,
      'User-Agent': 'MaisonNerava-Storefront/2.0',
      Accept: options.rawText ? 'text/html,application/json' : 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(options.timeoutMs || 10000),
    cache: 'no-store',
  });

  const limits: EcomRateLimits = {
    version: res.headers.get('X-Api-Version'),
    remaining1m: res.headers.get('X-RateLimit-Remaining-1min'),
    remaining1h: res.headers.get('X-RateLimit-Remaining-1h'),
    remaining24h: res.headers.get('X-RateLimit-Remaining-24h'),
  };

  if (options.rawText) {
    const text = await res.text();
    return { ok: res.ok, status: res.status, data: text as unknown as T, limits };
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as T, limits };
}

export function mapEcomSituationToOrderStatus(idSituation?: number | null, situationText?: string | null) {
  if (idSituation === 7 || idSituation === 14 || idSituation === 15) return 'DELIVERED' as const;
  if (idSituation === 5 || idSituation === 6 || idSituation === 18) return 'CANCELLED' as const;
  if (idSituation === 23 || idSituation === 24) return 'RETURNED' as const;
  if (idSituation === 25 || idSituation === 26 || idSituation === 27 || idSituation === 28) return 'SHIPPED' as const;
  if (idSituation === 19) return 'CONFIRMED' as const;

  const s = (situationText || '').toLowerCase();
  if (s.includes('livr') || s.includes('encaiss') || s.includes('recouvert')) return 'DELIVERED' as const;
  if (s.includes('retour')) return 'RETURNED' as const;
  if (s.includes('annul')) return 'CANCELLED' as const;
  if (s.includes('sortir') || s.includes('bureau') || s.includes('dispatch')) return 'SHIPPED' as const;
  return null;
}

const cache = {
  tarifs: null as {
    service: number;
    emballage: number;
    byWilaya: Record<number, { domicile: number; stopdesk: number; annuler: number }>;
    expiresAt: number;
  } | null,
  lastTarifsError: null as string | null,
  wilayas: null as {
    items: Array<{ id: number; libelle: string; domicile: boolean; stopdesk: boolean }>;
    expiresAt: number;
  } | null,
  communes: new Map<number, { items: Array<{ id: number; id_wilaya: number; commune: string; code_postal: number; livrable: boolean }>; expiresAt: number }>(),
  stopdesks: new Map<number, { items: Array<{ id: number; id_wilaya: number; nom_bureau: string; code_stopdesk: string; adresse: string; adresse_maps?: string; tel_contact?: string; commune: string }>; expiresAt: number }>(),
};

export function getLastEcomTarifsError() {
  return cache.lastTarifsError;
}

export async function getCachedEcomTarifs(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.tarifs && now < cache.tarifs.expiresAt) return cache.tarifs;
  const { configured } = getEcomCredentials();
  if (!configured) {
    cache.lastTarifsError = 'missing_credentials';
    return null;
  }

  try {
    const res = await ecomFetch<{
      service?: number;
      emballage?: number;
      wilayas?: Array<{ wilaya: number; domicile: number; stopdesk: number; annuler: number }>;
      error?: { code?: string; message?: string };
    }>('/tarifs', { timeoutMs: 8000 });

    if (res.ok && Array.isArray(res.data?.wilayas)) {
      const byWilaya: Record<number, { domicile: number; stopdesk: number; annuler: number }> = {};
      for (const w of res.data.wilayas) {
        if (w.wilaya >= 1 && w.wilaya <= 58) {
          byWilaya[w.wilaya] = {
            domicile: Number(w.domicile || 0),
            stopdesk: Number(w.stopdesk || 0),
            annuler: Number(w.annuler || 0),
          };
        }
      }
      cache.tarifs = {
        service: Number(res.data.service || 0),
        emballage: Number(res.data.emballage || 0),
        byWilaya,
        expiresAt: now + 1000 * 60 * 30,
      };
      cache.lastTarifsError = null;
      return cache.tarifs;
    }
    cache.lastTarifsError = `HTTP ${res.status}: ${res.data?.error?.code || res.data?.error?.message || 'unexpected_shape'}`;
  } catch (err) {
    cache.lastTarifsError = err instanceof Error ? err.message : 'fetch_error';
  }
  return null;
}

export async function getCachedEcomWilayas() {
  const now = Date.now();
  if (cache.wilayas && now < cache.wilayas.expiresAt) return cache.wilayas.items;
  const { configured } = getEcomCredentials();
  if (!configured) return null;
  try {
    const res = await ecomFetch<Array<{ id: number; libelle: string; domicile: boolean; stopdesk: boolean }>>('/wilayas', { timeoutMs: 8000 });
    if (res.ok && Array.isArray(res.data)) {
      cache.wilayas = { items: res.data, expiresAt: now + 1000 * 60 * 60 };
      return res.data;
    }
  } catch {}
  return null;
}

export async function getCachedEcomCommunes(wilayaId: number) {
  const now = Date.now();
  const hit = cache.communes.get(wilayaId);
  if (hit && now < hit.expiresAt) return hit.items;
  const { configured } = getEcomCredentials();
  if (!configured) return [];
  try {
    const res = await ecomFetch<Array<{ id: number; id_wilaya: number; commune: string; code_postal: number; livrable: boolean }>>(
      `/communes?id_wilaya=${wilayaId}`,
      { timeoutMs: 8000 }
    );
    if (res.ok && Array.isArray(res.data)) {
      const livrables = res.data.filter((c) => c.livrable !== false);
      cache.communes.set(wilayaId, { items: livrables, expiresAt: now + 1000 * 60 * 60 * 6 });
      return livrables;
    }
  } catch {}
  return [];
}

export async function getCachedEcomStopdesks(wilayaId: number) {
  const now = Date.now();
  const hit = cache.stopdesks.get(wilayaId);
  if (hit && now < hit.expiresAt) return hit.items;
  const { configured } = getEcomCredentials();
  if (!configured) return [];
  try {
    const res = await ecomFetch<
      Array<{
        id: number;
        id_wilaya: number;
        nom_bureau: string;
        code_stopdesk: string;
        adresse: string;
        adresse_maps?: string;
        tel_contact?: string;
        commune: string;
      }>
    >(`/stopdesks?id_wilaya=${wilayaId}`, { timeoutMs: 8000 });
    if (res.ok && Array.isArray(res.data)) {
      cache.stopdesks.set(wilayaId, { items: res.data, expiresAt: now + 1000 * 60 * 60 * 6 });
      return res.data;
    }
  } catch {}
  return [];
}