import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';
import {
  areCertificatesDownloadEnabled,
  getCertificatesAvailableFromDate,
  formatCertificatesAvailableFromEsAR,
  CERTIFICATE_SETTINGS_CHANGED_EVENT,
} from '../constants/congressEvent';

/**
 * Metadatos del evento usados en el cuerpo del certificado.
 * Si cambia la edición o la sede, actualizar solo aquí para que el PDF/impresión quede consistente.
 */
export const CERTIFICATE_EVENT = {
  name: 'V Congreso Argentino de Agroecología',
  city: 'La Plata',
  year: 2027,
} as const;

/**
 * Devuelve la frase legal del certificado según el rol con el que el usuario navega (currentRole).
 *
 * Por qué usamos currentRole y no el array `roles`: el certificado debe reflejar el perfil activo
 * elegido en "Selección de perfil", igual que el resto de dashboards del proyecto.
 *
 * Si en el futuro se agrega un rol (p. ej. 'voluntario'): sumar un `case` en el switch y el tipo
 * `UserRole` en AuthContext; opcionalmente agregar una entrada en `ROLE_LABEL_FOR_CERTIFICATE`.
 */

export function getCertificateRoleClause(activeRole: UserRole | undefined): string {
  switch (activeRole) {
    case 'asistente':
      return 'en calidad de Asistente';
    case 'autor':
      return 'en calidad de Autor/a, habiendo presentado trabajos en el congreso';
    case 'evaluador':
      return 'en calidad de Evaluador/a del Comité Científico';
    case 'admin':
      return 'en calidad de miembro del Comité Organizador';
    default:
      return 'en calidad de participante del evento';
  }
}

/** Etiqueta legible del rol activo para mostrar en el bloque de datos (no es el texto jurídico largo). */
const ROLE_LABEL_FOR_CERTIFICATE: Record<UserRole, string> = {
  asistente: 'Asistente',
  autor: 'Autor/a',
  evaluador: 'Evaluador/a',
  admin: 'Administración / organización',
};

export function getActiveRoleLabel(activeRole: UserRole | undefined): string {
  if (!activeRole) return '—';
  return ROLE_LABEL_FOR_CERTIFICATE[activeRole] ?? activeRole;
}

export interface CertificateViewProps {
  /**
   * Título opcional de la sección en pantalla (cada panel puede ajustar el tono).
   * No se imprime: queda fuera del nodo `#attendance-certificate-root` en el DOM.
   */
  sectionTitle?: string;
}

/**
 * Vista formal del certificado + acción de impresión/guardado como PDF desde el navegador.
 *
 * Por qué no recibimos usuario por props: el mismo componente se monta desde varios paneles;
 * centralizar la lectura en AuthContext evita props drilling y garantiza el mismo `currentRole`
 * que ya usa el resto de la app.
 */
export function CertificateView({ sectionTitle = 'Certificado de asistencia' }: CertificateViewProps) {
  const { user } = useAuth();
  /** Solo dispara re-render para releer localStorage cuando el admin cambia la fecha. */
  const [, setCertificateSettingsTick] = useState(0);
  /** Avisos de calendario de descarga: ocultos hasta que el usuario los pide (menos ruido visual). */
  const [showAvailabilityNotice, setShowAvailabilityNotice] = useState(false);

  useEffect(() => {
    const bump = () => setCertificateSettingsTick((n) => n + 1);
    window.addEventListener(CERTIFICATE_SETTINGS_CHANGED_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(CERTIFICATE_SETTINGS_CHANGED_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  if (!user) {
    return null;
  }

  const certificatesFrom = getCertificatesAvailableFromDate();
  const certificatesUnlocked = areCertificatesDownloadEnabled();

  const fullName = [user.name, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  const activeRole = user.currentRole;
  const roleClause = getCertificateRoleClause(activeRole);
  const roleLabel = getActiveRoleLabel(activeRole);

  const handleDownloadOrPrint = () => {
    /**
     * Algunos navegadores sugieren el nombre del archivo PDF según document.title al imprimir.
     * Lo ajustamos solo para la ventana de impresión y lo restauramos al terminar (evento afterprint).
     */
    if (!areCertificatesDownloadEnabled()) {
      return;
    }

    const previousTitle = document.title;
    const safeName = fullName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'certificado';
    document.title = `Certificado_${safeName}_${CERTIFICATE_EVENT.year}`;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
  };

  return (
    <section className="mt-10 rounded-xl border border-emerald-100 bg-white p-6 shadow-md print:mt-0 print:border-0 print:p-0 print:shadow-none">
      {/* Bloque solo pantalla: instrucciones y título de sección (ocultos en impresión vía clase global). */}
      <div className="certificate-ui-only mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{sectionTitle}</h2>
        <p className="mt-1 text-sm text-gray-600">
          El texto del certificado corresponde al <strong>rol activo</strong> que elegiste en el menú de usuario.
          Usá &quot;Descargar certificado&quot; para imprimir o guardar como PDF desde tu navegador.
        </p>
      </div>

      {/* Ventana de descarga: por defecto un solo botón; el cartel detallado solo si lo pedís o lo cerrás con la cruz. */}
      <div className="certificate-ui-only mb-4">
        {!showAvailabilityNotice ? (
          <button
            type="button"
            onClick={() => setShowAvailabilityNotice(true)}
            className="rounded-lg border border-emerald-700/30 bg-emerald-50/80 px-4 py-2.5 text-left text-sm font-medium text-[#2d5016] shadow-sm transition hover:bg-emerald-100/90 hover:border-emerald-700/45"
          >
            ¿Cuándo puedo descargar mi certificado?
          </button>
        ) : (
          <div className="relative rounded-xl border border-gray-200 bg-gray-50/60 p-3 pt-2 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Calendario de certificados</p>
              <button
                type="button"
                onClick={() => setShowAvailabilityNotice(false)}
                className="-mr-1 -mt-0.5 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-200/80 hover:text-gray-800"
                aria-label="Ocultar aviso"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-2">
              {!certificatesFrom && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                  <strong>Certificados:</strong> la organización aún no definió la fecha desde la cual se habilitará la
                  descarga. Cuando esté definida, verás aquí el día y también un aviso en la barra superior (si iniciaste
                  sesión).
                </div>
              )}
              {certificatesFrom && !certificatesUnlocked && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <strong>Certificados:</strong> la descarga estará habilitada a partir del{' '}
                  <strong>{formatCertificatesAvailableFromEsAR(certificatesFrom)}</strong> (inclusive). Hasta entonces
                  podés revisar esta sección; el botón de descarga se activará automáticamente ese día.
                </div>
              )}
              {certificatesFrom && certificatesUnlocked && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                  <strong>Certificados:</strong> la descarga está habilitada desde el{' '}
                  {formatCertificatesAvailableFromEsAR(certificatesFrom)}.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!activeRole && (
        <div className="certificate-ui-only rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No hay rol activo seleccionado. Entrá a <strong>Seleccionar perfil</strong> en el menú de usuario y elegí un
          rol para que el certificado muestre la redacción correcta.
        </div>
      )}

      {activeRole && certificatesUnlocked && (
        <>
          {/*
            Solo este contenedor y sus descendientes permanecen visibles al imprimir
            (reglas en src/styles/certificate-print.css). No montamos el id si la fecha
            aún no habilita descarga, para que Imprimir no genere páginas vacías o datos fuera de política.
          */}
          <div
            id="attendance-certificate-root"
            className="certificate-print-surface mx-auto max-w-3xl border-4 border-double border-[#2d5016] bg-[#fffef8] px-8 py-10 text-center text-gray-900 print:border-[#2d5016] print:bg-white"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#2d5016]">Certificado de asistencia</p>
            <h3 className="mt-4 font-serif text-3xl font-semibold text-gray-900 md:text-4xl">
              {CERTIFICATE_EVENT.name}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {CERTIFICATE_EVENT.city}, {CERTIFICATE_EVENT.year}
            </p>

            <div className="mx-auto my-10 max-w-xl border-t border-b border-[#c5d4b8] py-8 text-left text-base leading-relaxed text-gray-800 md:text-lg">
              <p className="text-center font-serif">
                Por la presente se certifica que{' '}
                <span className="font-semibold text-gray-900">{fullName}</span> participó del{' '}
                <span className="font-semibold">{CERTIFICATE_EVENT.name}</span>, desarrollado en{' '}
                <span className="font-semibold">{CERTIFICATE_EVENT.city}</span> en el año{' '}
                <span className="font-semibold">{CERTIFICATE_EVENT.year}</span>, {roleClause}.
              </p>
            </div>

            <dl className="mx-auto grid max-w-md gap-2 rounded-lg bg-white/60 px-4 py-3 text-left text-sm text-gray-700 print:bg-transparent">
              <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-2">
                <dt className="text-gray-500">Nombre completo</dt>
                <dd className="font-medium text-gray-900">{fullName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-2">
                <dt className="text-gray-500">Rol en este certificado</dt>
                <dd className="font-medium text-gray-900">{roleLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Evento</dt>
                <dd className="text-right font-medium text-gray-900">{CERTIFICATE_EVENT.name}</dd>
              </div>
            </dl>

            <p className="mt-10 text-xs text-gray-500">
              Documento generado desde el área privada del sitio del congreso. Válido según registros de la organización.
            </p>
          </div>

          <div className="certificate-ui-only mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadOrPrint}
              className="rounded-lg bg-[#2d5016] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#3d6b23]"
            >
              Descargar certificado
            </button>
            <span className="text-xs text-gray-500">Se abrirá el cuadro de impresión: elegí &quot;Guardar como PDF&quot; si tu navegador lo permite.</span>
          </div>
        </>
      )}

      {activeRole && !certificatesUnlocked && (
        <div className="certificate-ui-only rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
          Vista previa del certificado oculta hasta la fecha de habilitación. Cuando corresponda, verás aquí el
          diseño formal y el botón de descarga.
        </div>
      )}
    </section>
  );
}
