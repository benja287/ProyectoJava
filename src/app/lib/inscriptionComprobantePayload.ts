/**
 * Datos del comprobante embebidos en la URL para que el enlace funcione en cualquier dispositivo
 * (sin depender del localStorage del navegador del admin).
 */
export type ComprobanteUrlPayload = {
  v: 1;
  token: string;
  invoiceId: string;
  issuedAt: string;
  name: string;
  lastName: string;
  email: string;
  institution?: string;
  province?: string;
  categoryLabel: string;
  amountLabel: string;
  category?: string;
};

function utf8ToB64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64ToUtf8(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export function encodeComprobantePayload(p: ComprobanteUrlPayload): string {
  return utf8ToB64(JSON.stringify(p));
}

export function decodeComprobantePayload(encoded: string): ComprobanteUrlPayload | null {
  try {
    const raw = encoded.trim();
    if (!raw) return null;
    const json = b64ToUtf8(raw);
    const o = JSON.parse(json) as ComprobanteUrlPayload;
    if (o?.v !== 1 || !o.token || !o.invoiceId) return null;
    return o;
  } catch {
    return null;
  }
}

export function buildComprobanteSearchParams(p: ComprobanteUrlPayload): string {
  const d = encodeComprobantePayload(p);
  const params = new URLSearchParams();
  params.set('t', p.token);
  params.set('d', d);
  return params.toString();
}

/** Arma query `t=...&d=...` desde un usuario guardado (perfil / misma máquina). */
export function buildComprobanteSearchParamsFromUser(u: {
  inscriptionAccreditationToken?: string;
  inscriptionStatus?: string;
  inscriptionInvoiceId?: string;
  inscriptionInvoiceIssuedAt?: string;
  name?: string;
  lastName?: string;
  email?: string;
  institution?: string;
  province?: string;
  inscriptionInvoiceCategoryLabel?: string;
  inscriptionInvoiceAmountLabel?: string;
  category?: string;
}): string | null {
  if (
    !u?.inscriptionAccreditationToken ||
    u.inscriptionStatus !== 'confirmed' ||
    !u.inscriptionInvoiceId
  ) {
    return null;
  }
  const p: ComprobanteUrlPayload = {
    v: 1,
    token: u.inscriptionAccreditationToken,
    invoiceId: u.inscriptionInvoiceId,
    issuedAt: u.inscriptionInvoiceIssuedAt || new Date().toISOString(),
    name: u.name || '',
    lastName: u.lastName || '',
    email: u.email || '',
    institution: u.institution,
    province: u.province,
    categoryLabel: u.inscriptionInvoiceCategoryLabel || '—',
    amountLabel: u.inscriptionInvoiceAmountLabel || '—',
    category: u.category,
  };
  return buildComprobanteSearchParams(p);
}

export function payloadToDisplayRecord(p: ComprobanteUrlPayload): Record<string, unknown> {
  return {
    inscriptionAccreditationToken: p.token,
    inscriptionStatus: 'confirmed',
    inscriptionInvoiceId: p.invoiceId,
    inscriptionInvoiceIssuedAt: p.issuedAt,
    name: p.name,
    lastName: p.lastName,
    email: p.email,
    institution: p.institution,
    province: p.province,
    inscriptionInvoiceCategoryLabel: p.categoryLabel,
    inscriptionInvoiceAmountLabel: p.amountLabel,
    category: p.category,
  };
}
