import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Printer, Home, ExternalLink } from 'lucide-react';
import { CATEGORY_LABEL_ES } from '../constants/inscriptionInvoice';
import type { InscriptionCategory } from '../context/AuthContext';
import {
  decodeComprobantePayload,
  payloadToDisplayRecord,
  buildComprobanteSearchParamsFromUser,
} from '../lib/inscriptionComprobantePayload';

const USERS_KEY = 'congress_users';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function InscripcionComprobantePage() {
  const [params] = useSearchParams();
  const dRaw = (params.get('d') || '').trim();
  const tokenParam = (params.get('t') || '').trim();

  const decodedPayload = useMemo(() => {
    if (!dRaw) return null;
    return decodeComprobantePayload(dRaw);
  }, [dRaw]);

  const record = useMemo(() => {
    if (decodedPayload) {
      if (tokenParam && decodedPayload.token !== tokenParam) {
        return null;
      }
      return payloadToDisplayRecord(decodedPayload) as Record<string, unknown>;
    }
    if (!tokenParam) return null;
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const u = users.find(
      (x: any) =>
        x?.inscriptionAccreditationToken &&
        String(x.inscriptionAccreditationToken) === tokenParam &&
        x.inscriptionStatus === 'confirmed'
    );
    return (u || null) as Record<string, unknown> | null;
  }, [decodedPayload, tokenParam]);

  const comprobanteQueryForQr = useMemo(() => {
    if (!record) return '';
    return buildComprobanteSearchParamsFromUser(record as any) || '';
  }, [record]);

  const qrSrc = useMemo(() => {
    if (typeof window === 'undefined' || !record || !comprobanteQueryForQr) return '';
    const url = `${window.location.origin}/inscripcion/comprobante?${comprobanteQueryForQr}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
  }, [record, comprobanteQueryForQr]);

  const effectiveToken = decodedPayload?.token || tokenParam;

  if (!effectiveToken && !decodedPayload) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-[#faf8f5]">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center text-gray-700">
          Falta el enlace de tu comprobante. Revisá el correo enviado por la organización o iniciá sesión y abrilo
          desde Mi perfil.
          <Link to="/login" className="mt-6 inline-block text-[#2d5016] underline font-medium">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-[#faf8f5]">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center text-gray-700">
          Comprobante no válido, el enlace fue alterado o la inscripción aún no fue confirmada. Si el mail tenía un
          enlace corto sin datos, pedí a la organización que reenvíe el comprobante o entrá con tu cuenta y abrilo
          desde Mi perfil.
          <Link to="/" className="mt-6 inline-block text-[#2d5016] underline font-medium flex items-center justify-center gap-1">
            <Home className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const catKey = record.category as InscriptionCategory | undefined;
  const categoryLabel =
    (record.inscriptionInvoiceCategoryLabel as string) ||
    (catKey && CATEGORY_LABEL_ES[catKey] ? CATEGORY_LABEL_ES[catKey] : '—');
  const amountLabel = (record.inscriptionInvoiceAmountLabel as string) || '—';
  const invoiceId = (record.inscriptionInvoiceId as string) || '—';
  const payerName = `${record.name || ''} ${record.lastName || ''}`.trim() || '—';
  const email = (record.email as string) || '—';

  return (
    <div className="min-h-[calc(100vh-80px)] py-10 px-4 bg-[#faf8f5] print:bg-white print:py-4">
      <div className="max-w-2xl mx-auto">
        <div className="print:hidden mb-6 flex flex-wrap gap-3 justify-between items-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d5016] text-white rounded-lg text-sm hover:bg-[#3d6b23]"
          >
            <Printer className="w-4 h-4" /> Imprimir / guardar PDF
          </button>
          <Link to="/login" className="text-sm text-[#2d5016] underline inline-flex items-center gap-1">
            Iniciar sesión <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div
          id="invoice-root"
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 print:shadow-none print:border-none"
        >
          <header className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Comprobante de inscripción</h1>
            <p className="text-sm text-gray-600 mt-1">V Congreso Argentino de Agroecología</p>
          </header>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Nº comprobante</dt>
              <dd className="font-medium text-gray-900">{invoiceId}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Fecha de emisión</dt>
              <dd className="font-medium text-gray-900">{formatDate(record.inscriptionInvoiceIssuedAt as string)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Inscripto/a</dt>
              <dd className="font-medium text-gray-900">{payerName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900 break-all">{email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Institución</dt>
              <dd className="font-medium text-gray-900">{String(record.institution || '').trim() || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Provincia</dt>
              <dd className="font-medium text-gray-900">{String(record.province || '').trim() || '—'}</dd>
            </div>
          </dl>

          <section className="mt-8 border border-gray-100 rounded-lg p-4 bg-gray-50 print:bg-transparent">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalle</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-700">Concepto</td>
                  <td className="py-2 text-right font-medium text-gray-900">Inscripción al congreso</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-700">Tarifa aplicada según categoría</td>
                  <td className="py-2 text-right font-medium text-gray-900">{categoryLabel}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-900 font-semibold">Total declarado por el usuario</td>
                  <td className="py-3 text-right text-lg font-bold text-[#2d5016]">{amountLabel}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="mt-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between border-t border-gray-100 pt-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Acreditación y acceso rápido</h2>
              <p className="text-xs text-gray-600 max-w-xs">
                Escaneá el código QR desde tu celular para volver a abrir esta pantalla durante el ingreso al congreso.
                Con tu cuenta podés iniciar sesión como <strong>asistente</strong> una vez confirmada la inscripción.
              </p>
              <p className="text-[11px] text-gray-500 mt-3">
                También podés mostrar esta pantalla desde el PDF impreso (Imprimir → Guardar como PDF).
              </p>
            </div>
            <div className="mx-auto sm:mx-0 text-center">
              {qrSrc ? (
                <img src={qrSrc} alt="QR acreditación" width={220} height={220} className="rounded-lg border border-gray-200 mx-auto bg-white print:border print:p-2" />
              ) : (
                <div className="w-[220px] h-[220px] bg-gray-100 rounded-lg mx-auto grid place-items-center text-xs text-gray-500 px-4">
                  QR no disponible
                </div>
              )}
              <span className="text-[11px] text-gray-400 block mt-2">Este QR abre de nuevo esta página del comprobante.</span>
            </div>
          </div>

          <footer className="mt-10 pt-6 border-t border-gray-100 text-[11px] text-gray-500 print:text-[10px]">
            Este documento acredita el alta del perfil como asistente en el sistema, previa validación del equipo
            organizador sobre el comprobante de pago cargado por el usuario. El formato no reemplaza la factura fiscal
            emitida por el cobrador correspondiente cuando corresponda.
          </footer>
        </div>

        <p className="print:hidden mt-8 text-center text-sm text-gray-600">
          <Link to="/" className="text-[#2d5016] hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
