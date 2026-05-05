import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Settings, Bell, Pencil, X, Trash2, FileDown, FileText, Plus, UserPlus } from 'lucide-react';
import { type InscriptionCategory, UserRole } from '../context/AuthContext';
import {
  openStoredBrowserFile,
  openOrDownloadFile,
  deleteBrowserFile,
} from '../lib/browserFiles';
import {
  CIRCULARES_KEY,
  CONFERENCIAS_KEY,
  PROGRAM_PUBLISHED_KEY,
  TALLERES_PROGRAMADOS_KEY,
  CONGRESS_EVENT_DATES,
  hasTimeOverlap,
  isCongressDate,
  isValidTimeRange,
  getCertificatesAvailableFromDate,
  setCertificatesAvailableFromDate,
  formatCertificatesAvailableFromEsAR,
} from '../constants/congressEvent';
import { CertificateView } from './Certificaciones';
import type { StoredCircular, CircularStatus } from '../constants/congressEvent';
import type { TallerProgramado } from './AdminCrearTaller';
import type { ConferenciaPrograma } from './AdminCrearConferencia';
import { getInscriptionInvoiceLines } from '../constants/inscriptionInvoice';
import { sendTransactionalEmail } from '../lib/emailSender';
import { getPublicAppOrigin } from '../lib/publicAppUrl';
import {
  buildComprobanteSearchParams,
  type ComprobanteUrlPayload,
} from '../lib/inscriptionComprobantePayload';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Session {
  id: string;
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  works: string[];
}

interface PosterSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  works: { workId: string; stand: string }[];
}

interface RoundTable {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  moderator: string;
  panelists: string;
  description: string;
}

/** Roles asignables desde admin (mismos que en selección de rol). */
const ADMIN_ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: 'asistente', label: 'Asistente' },
  { role: 'autor', label: 'Autor' },
  { role: 'evaluador', label: 'Evaluador' },
  { role: 'comite', label: 'Administrador Comité académico' },
  { role: 'admin', label: 'Administrador' },
];

const CATEGORY_OPTIONS: { value: InscriptionCategory; label: string }[] = [
  { value: 'socio_saae', label: 'Socio/a SAAE' },
  { value: 'no_socio', label: 'No socio/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'productor', label: 'Productor/a' },
  { value: 'investigador', label: 'Investigador/a' },
  { value: 'extensionista', label: 'Extensionista' },
  { value: 'docente', label: 'Docente' },
  { value: 'extranjero', label: 'Extranjero/a' },
];

const emptyRoleFlags = (): Record<UserRole, boolean> => ({
  asistente: false,
  autor: false,
  evaluador: false,
  comite: false,
  admin: false,
});

// ─── Componente ───────────────────────────────────────────────────────────────
export function PanelAdmin() {
  const { user, sendNotificationToAll, sendNotificationToUser, logout, updateUser } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [inscriptions,        setInscriptions]        = useState<any[]>([]);
  const [users,               setUsers]               = useState<any[]>([]);
  const [sessions,            setSessions]            = useState<Session[]>([]);
  const [roundTables,         setRoundTables]         = useState<RoundTable[]>([]);
  const [works,               setWorks]               = useState<any[]>([]);
  const [posterSessions,      setPosterSessions]      = useState<PosterSession[]>([]);
  const [talleresProgramados, setTalleresProgramados] = useState<TallerProgramado[]>([]);
  const [tallerOkBanner,      setTallerOkBanner]      = useState(false);
  const [conferencias,        setConferencias]        = useState<ConferenciaPrograma[]>([]);
  const [confOkBanner,        setConfOkBanner]        = useState(false);
  const [programPublished,    setProgramPublished]    = useState(true);

  const [notifForm, setNotifForm] = useState({ title: '', message: '', role: '' as UserRole | '' });
  const [notifFeedback, setNotifFeedback] = useState('');

  // ── Modales ────────────────────────────────────────────────────────────────
  const [editingSession,      setEditingSession]      = useState<Session | null>(null);
  const [editSessionForm,     setEditSessionForm]     = useState({ code: '', name: '', date: '', startTime: '', endTime: '', room: '' });

  const [editingPoster,       setEditingPoster]       = useState<PosterSession | null>(null);
  const [editPosterForm,      setEditPosterForm]      = useState({ name: '', date: '', startTime: '', endTime: '', location: '' });

  const [editingRoundTable,   setEditingRoundTable]   = useState<RoundTable | null>(null);
  const [editRoundTableForm,  setEditRoundTableForm]  = useState({ title: '', date: '', startTime: '', endTime: '', room: '', moderator: '', panelists: '', description: '' });

  const [editingWorkshop,     setEditingWorkshop]     = useState<TallerProgramado | null>(null);
  const [editWorkshopForm,    setEditWorkshopForm]    = useState({ titulo: '', fecha: '', startTime: '', endTime: '', room: '', responsables: '', descripcion: '' });

  const [editingConference,   setEditingConference]   = useState<ConferenciaPrograma | null>(null);
  const [editConferenceForm,  setEditConferenceForm]  = useState({ titulo: '', fecha: '', startTime: '', endTime: '', room: '', conferencistas: '', moderador: '', institucion: '', descripcion: '' });

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'session' | 'poster' | 'roundtable' | 'workshop' | 'conference' | 'circular' | 'user';
    id: string;
    name: string;
  } | null>(null);
  const [userDeleteFeedback, setUserDeleteFeedback] = useState('');
  const [userAccountFeedback, setUserAccountFeedback] = useState('');

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormError, setUserFormError] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    category: '' as InscriptionCategory | '',
    roles: emptyRoleFlags(),
  });

  const [circulares, setCirculares] = useState<StoredCircular[]>([]);
  const [circularesFeedback, setCircularesFeedback] = useState('');
  /** Valor del input fecha certificados (YYYY-MM-DD); la verdad persistida está en localStorage. */
  const [certificatesAvailableFromInput, setCertificatesAvailableFromInput] = useState('');
  const [, setCertificateAdminUiTick] = useState(0);
  const [authorRequestsFeedback, setAuthorRequestsFeedback] = useState('');
  const [inscriptionInvoiceFeedback, setInscriptionInvoiceFeedback] = useState('');

  // ─── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.currentRole !== 'admin') { navigate('/'); return; }

    const allUsers = JSON.parse(localStorage.getItem('congress_users')       || '[]');
    const allWorks = JSON.parse(localStorage.getItem('congress_works')       || '[]');
    const sesiones = JSON.parse(localStorage.getItem('congress_sessions')    || '[]');
    const mesas    = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');
    const posters  = JSON.parse(localStorage.getItem('congress_posters')     || '[]');
    const pending = allUsers
      .filter((u: any) => u.inscriptionStatus === 'pending')
      .sort((a: any, b: any) => {
        const ac = a.inscriptionPaymentMethod === 'cash' ? 0 : 1;
        const bc = b.inscriptionPaymentMethod === 'cash' ? 0 : 1;
        return ac - bc;
      });

    setInscriptions(pending);
    setUsers(allUsers);
    setSessions(sesiones);
    setPosterSessions(posters);
    setWorks(allWorks);
    setRoundTables(mesas);
    setTalleresProgramados(JSON.parse(localStorage.getItem(TALLERES_PROGRAMADOS_KEY) || '[]'));
    setConferencias(JSON.parse(localStorage.getItem(CONFERENCIAS_KEY) || '[]'));
    const published = localStorage.getItem(PROGRAM_PUBLISHED_KEY);
    setProgramPublished(published ? JSON.parse(published) : true);
    setCirculares(JSON.parse(localStorage.getItem(CIRCULARES_KEY) || '[]'));
    setCertificatesAvailableFromInput(getCertificatesAvailableFromDate() ?? '');
  }, [user, navigate]);

  useEffect(() => {
    const st = location.state as { tallerCreado?: boolean; conferenciaCreada?: boolean; circularesFeedback?: string } | null;
    if (st?.tallerCreado) {
      setTallerOkBanner(true);
      setTalleresProgramados(JSON.parse(localStorage.getItem(TALLERES_PROGRAMADOS_KEY) || '[]'));
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (st?.conferenciaCreada) {
      setConfOkBanner(true);
      setConferencias(JSON.parse(localStorage.getItem(CONFERENCIAS_KEY) || '[]'));
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (st?.circularesFeedback) {
      setCircularesFeedback(st.circularesFeedback);
      setCirculares(JSON.parse(localStorage.getItem(CIRCULARES_KEY) || '[]'));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  if (!user) return null;

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getAuthor = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.name} ${u.lastName}` : 'Autor desconocido';
  };

  // ─── Asistente → Autor (solo si tiene trabajos aprobados) ───────────────────
  const authorRequests = (() => {
    const worksApproved = (works || []).filter((w: any) => w?.status === 'approved');
    const byUser = new Map<string, any[]>();
    worksApproved.forEach((w: any) => {
      if (!w?.userId) return;
      if (!byUser.has(w.userId)) byUser.set(w.userId, []);
      byUser.get(w.userId)!.push(w);
    });

    return (users || [])
      .filter((u: any) => {
        const roles: string[] = Array.isArray(u.roles) ? u.roles : [];
        const hasApproved = byUser.has(u.id);
        const isAsistente = roles.includes('asistente');
        const isAutor = roles.includes('autor');
        return hasApproved && isAsistente && !isAutor;
      })
      .map((u: any) => ({ user: u, works: byUser.get(u.id) || [] }));
  })();

  const grantAuthorRole = (userId: string) => {
    setAuthorRequestsFeedback('');
    const allUsers = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const nextUsers = allUsers.map((u: any) => {
      if (u.id !== userId) return u;
      const roles: string[] = Array.isArray(u.roles) ? u.roles : [];
      if (roles.includes('autor')) return u;
      return { ...u, roles: [...new Set([...roles, 'autor'])] };
    });
    localStorage.setItem('congress_users', JSON.stringify(nextUsers));
    setUsers(nextUsers);

    // si el usuario al que habilitamos es el current_user del navegador, actualizamos también
    const current = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (current?.id === userId) {
      const updatedSelf = nextUsers.find((u: any) => u.id === userId);
      if (updatedSelf) localStorage.setItem('current_user', JSON.stringify({ ...current, ...updatedSelf }));
    }

    const u = nextUsers.find((x: any) => x.id === userId);
    if (u) {
      sendNotificationToUser(
        userId,
        'Rol autor habilitado',
        'Tu rol de autor fue habilitado. Ahora podés acceder al panel Autor y ver tus presentaciones cuando sean programadas.',
        'Administración'
      );
      setAuthorRequestsFeedback(`Se habilitó el rol autor para ${u.name} ${u.lastName}.`);
    }
  };

  const restoreWorkToApproved = (workId: string) => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const updated  = allWorks.map((w: any) => w.id === workId ? { ...w, status: 'approved' } : w);
    localStorage.setItem('congress_works', JSON.stringify(updated));
    setWorks(updated);
  };

  const notifyAgendaUsers = (activityId: string, title: string, message: string) => {
    const allAgendas: Record<string, any[]> = JSON.parse(localStorage.getItem('congress_agendas') || '{}');
    Object.entries(allAgendas).forEach(([userId, items]) => {
      if (Array.isArray(items) && items.some((it: any) => it.activityId === activityId)) {
        sendNotificationToUser(userId, title, message, 'Administración');
      }
    });
  };

  const notifyAuthorsFromWorks = (workIds: string[], title: string, message: string) => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const targets  = new Set<string>();
    workIds.forEach((id) => {
      const w = allWorks.find((wk: any) => wk.id === id);
      if (w?.userId) targets.add(w.userId);
    });
    targets.forEach((uid) => sendNotificationToUser(uid, title, message, 'Administración'));
  };

  const deleteTallerProgramado = (id: string) => {
    const updated = talleresProgramados.filter((t) => t.id !== id);
    localStorage.setItem(TALLERES_PROGRAMADOS_KEY, JSON.stringify(updated));
    setTalleresProgramados(updated);
  };

  const deleteConferencia = (id: string) => {
    const updated = conferencias.filter((c) => c.id !== id);
    localStorage.setItem(CONFERENCIAS_KEY, JSON.stringify(updated));
    setConferencias(updated);
  };

  const toggleProgramPublished = () => {
    const next = !programPublished;
    setProgramPublished(next);
    localStorage.setItem(PROGRAM_PUBLISHED_KEY, JSON.stringify(next));
  };

  // =========================
  // CIRCULARES
  // =========================
  const persistCirculares = (next: StoredCircular[]) => {
    localStorage.setItem(CIRCULARES_KEY, JSON.stringify(next));
    setCirculares(next);
  };

  const toggleCircularStatus = (id: string) => {
    const now = new Date().toISOString();
    const next = circulares.map((c) =>
      c.id === id
        ? {
            ...c,
            status: (c.status === 'published' ? 'draft' : 'published') as CircularStatus,
            updatedAt: now,
          }
        : c
    );
    persistCirculares(next);
  };

  const deleteCircular = (id: string) => {
    const c = circulares.find((x) => x.id === id);
    if (c?.pdfFileId) void deleteBrowserFile(c.pdfFileId);
    const next = circulares.filter((x) => x.id !== id);
    persistCirculares(next);
    setConfirmDelete(null);
    setCircularesFeedback('La circular fue eliminada.');
  };

  const openCircularStoredFile = (c: StoredCircular) => {
    void openOrDownloadFile({
      fileId: c.pdfFileId,
      fileName: c.pdfName,
      filePdfBase64: c.pdfData,
      fallbackMimeType: c.pdfMimeType || 'application/pdf',
    });
  };

  // =========================
  // INSCRIPCIONES
  // =========================
  const handleApprove = async (userId: string) => {
    setInscriptionInvoiceFeedback('');
    const subjectUser = users.find((u: any) => u.id === userId);
    if (!subjectUser) return;

    if (subjectUser.inscriptionPaymentMethod === 'cash') {
      const ok = window.confirm(
        'Pago en efectivo / presencial: ¿confirmás que consta el cobro verificado en recepción, caja o acreditación? Se aprobará la inscripción, se emitirá el comprobante y se notificará al asistente.'
      );
      if (!ok) return;
    }

    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const token = crypto.randomUUID();
    const invoiceId = `INS-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();
    const { categoryLabel: catLab, amountLabel: amtLab } = getInscriptionInvoiceLines(subjectUser.category);
    const baseUrl = getPublicAppOrigin();

    const adminValidatorLabel =
      `${user?.name || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Administración';

    const updatedUsers = users.map((u: any) => {
      if (u.id !== userId) return u;
      const nextRoles = [...new Set([...(u.roles || []), 'asistente'])];
      return {
        ...u,
        inscriptionStatus: 'confirmed',
        roles: nextRoles,
        currentRole: 'asistente',
        inscriptionInvoiceId: invoiceId,
        inscriptionInvoiceIssuedAt: issuedAt,
        inscriptionAccreditationToken: token,
        inscriptionInvoiceAmountLabel: amtLab,
        inscriptionInvoiceCategoryLabel: catLab,
        ...(subjectUser.inscriptionPaymentMethod === 'cash'
          ? {
              inscriptionCashValidatedAt: issuedAt,
              inscriptionCashValidatedByLabel: adminValidatorLabel,
            }
          : {}),
      };
    });

    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setInscriptions(inscriptions.filter((i) => i.id !== userId));

    const currentStored = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (currentStored?.id === userId) {
      const fresh = updatedUsers.find((x: any) => x.id === userId);
      if (fresh) {
        const { password: _, ...withoutPwd } = fresh;
        localStorage.setItem('current_user', JSON.stringify(withoutPwd));
      }
    }

    const appr = updatedUsers.find((x: any) => x.id === userId)!;
    const displayName = `${appr.name || ''} ${appr.lastName || ''}`.trim();

    const comprobantePayload: ComprobanteUrlPayload = {
      v: 1,
      token,
      invoiceId,
      issuedAt,
      name: appr.name || '',
      lastName: appr.lastName || '',
      email: appr.email || '',
      institution: appr.institution || '',
      province: appr.province || '',
      categoryLabel: catLab,
      amountLabel: amtLab,
      category: appr.category,
    };
    const facturaUrl = `${baseUrl}/inscripcion/comprobante?${buildComprobanteSearchParams(comprobantePayload)}`;
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(facturaUrl)}`;

    sendNotificationToUser(
      userId,
      'Inscripción confirmada — comprobante y acreditación',
      `¡Hola ${displayName}! Tu inscripción fue aprobada. Ya podés ingresar como asistente. Comprobante (guardalo o imprimilo):\n${facturaUrl}`,
      'Administración'
    );

    if (appr.email) {
      const instPlain = appr.institution?.trim() ? `Institución: ${appr.institution.trim()}` : '';
      const provPlain = appr.province?.trim() ? `Provincia: ${appr.province.trim()}` : '';
      const institution = appr.institution?.trim()
        ? `<p><strong>Institución:</strong> ${escapeHtml(appr.institution.trim())}</p>`
        : '';
      const province = appr.province?.trim()
        ? `<p><strong>Provincia:</strong> ${escapeHtml(appr.province.trim())}</p>`
        : '';

      const fechaEmision = new Date(issuedAt).toLocaleString('es-AR');
      const plainMessage = [
        `¡Hola ${displayName}!`,
        '',
        `Tu inscripción al congreso fue APROBADA. Ya podés entrar como asistente (iniciá sesión y elegí ese perfil si tenés más de uno).`,
        '',
        subjectUser.inscriptionPaymentMethod === 'cash'
          ? 'Modalidad de pago: efectivo / presencial (registrada como abonada por administración).'
          : 'Modalidad de pago: transferencia u otro medio con comprobante.',
        ...(subjectUser.inscriptionRequiresInvoice
          ? [
              '',
              'Solicitaste factura fiscal: coordiná el trámite con la administración del congreso (presentá este comprobante o tus datos de facturación según indiquen).',
            ]
          : []),
        '',
        `── Comprobante ${invoiceId} ──`,
        `Categoría / tarifa: ${catLab}`,
        `Monto referencia:   ${amtLab}`,
        `Fecha emisión:      ${fechaEmision}`,
        ...(instPlain ? ['', instPlain] : []),
        ...(provPlain ? [provPlain] : []),
        '',
        `Enlace para ver tu comprobante online (ideal para imprimir o guardar como PDF; incluye código QR):`,
        facturaUrl,
        '',
        `El enlace lleva los datos del comprobante: podés abrirlo desde cualquier dispositivo con acceso a la web del congreso (no hace falta estar en la misma computadora que el administrador).`,
        '',
        `Si el sitio aún no está publicado en internet, pedí a la organización la URL correcta y configurá VITE_PUBLIC_APP_URL en el servidor.`,
      ].join('\n');

      const htmlBody = `
        <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;">
          <h2 style="color:#2d5016;">Inscripci&oacute;n confirmada</h2>
          <p>Hola ${escapeHtml(displayName)},</p>
          <p>Tu inscripci&oacute;n al congreso fue <strong>aprobada</strong>. Ya ten&eacute;s el rol <strong>asistente</strong>: inici&aacute; sesi&oacute;n y eleg&iacute; ese perfil si ten&eacute;s m&aacute;s de uno.</p>
          <p style="font-size:14px;color:#444;">${
            subjectUser.inscriptionPaymentMethod === 'cash'
              ? '<strong>Pago:</strong> efectivo / presencial (validado por administraci&oacute;n).'
              : '<strong>Pago:</strong> transferencia u otro medio con comprobante.'
          }</p>
          ${
            subjectUser.inscriptionRequiresInvoice
              ? '<p style="font-size:14px;color:#5b21b6;background:#f5f3ff;padding:10px 12px;border-radius:8px;border:1px solid #ddd6fe;"><strong>Factura:</strong> solicitaste factura fiscal &mdash; coordin&aacute; el tr&aacute;mite con la administraci&oacute;n del congreso.</p>'
              : ''
          }
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
          <h3 style="margin-bottom:8px;">Comprobante (${escapeHtml(invoiceId)})</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
            <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Categoría / tarifa</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;"><strong>${escapeHtml(catLab)}</strong></td></tr>
            <tr><td style="padding:6px 0;border-bottom:1px solid #eee;">Monto referencia</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;"><strong>${escapeHtml(amtLab)}</strong></td></tr>
            <tr><td style="padding:6px 0;">Fecha emisión</td><td style="padding:6px 0;text-align:right;">${escapeHtml(fechaEmision)}</td></tr>
          </table>
          ${institution}${province}
          <p style="margin-top:20px;"><a href="${facturaUrl}" style="display:inline-block;background:#2d5016;color:white;padding:10px 18px;text-decoration:none;border-radius:8px;">Ver / descargar comprobante (web)</a></p>
          <p style="font-size:12px;color:#666;">En esa p&aacute;gina pod&eacute;s usar <strong>Imprimir &rarr; Guardar como PDF</strong> y ver el c&oacute;digo QR de acreditaci&oacute;n.</p>
          <div style="margin-top:24px;text-align:center;">
            <div style="font-size:13px;color:#444;margin-bottom:8px;">C&oacute;digo QR &mdash; acreditaci&oacute;n</div>
            <img src="${qrImgSrc}" alt="QR" width="200" height="200" style="border:1px solid #ddd;border-radius:8px;padding:8px;background:#fff;" />
          </div>
        </div>`;

      const emailResult = await sendTransactionalEmail({
        toEmail: appr.email,
        toName: displayName,
        subject: `[Congreso Agroecología] Inscripción aprobada — ${invoiceId}`,
        message: plainMessage,
        messageHtml: htmlBody,
      });

      const localhostHint = baseUrl.includes('localhost')
        ? ' El enlace del mail usa localhost: solo sirve en esta PC; para producción definí VITE_PUBLIC_APP_URL.'
        : '';
      setInscriptionInvoiceFeedback(
        (emailResult.sent
          ? 'Listo: comprobante guardado y correo enviado.'
          : 'Comprobante guardado; no se pudo enviar el correo (el usuario puede abrir Mi perfil).') + localhostHint
      );
    } else {
      const localhostHint = baseUrl.includes('localhost')
        ? ' El enlace usa localhost: solo en esta PC; para otros equipos configurá VITE_PUBLIC_APP_URL.'
        : '';
      setInscriptionInvoiceFeedback(
        `Comprobante guardado (${invoiceId}); el usuario no tiene email para envío automático.${localhostHint}`
      );
    }
  };

  const handleReject = async (userId: string) => {
    setInscriptionInvoiceFeedback('');
    const subject = users.find((u: any) => u.id === userId);
    if (!subject) return;

    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const updatedUsers = users.map((u: any) =>
      u.id === userId ? { ...u, inscriptionStatus: 'rejected' } : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setInscriptions(inscriptions.filter((i) => i.id !== userId));

    const currentStored = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (currentStored?.id === userId) {
      const fresh = updatedUsers.find((x: any) => x.id === userId);
      if (fresh) {
        const { password: _, ...withoutPwd } = fresh;
        localStorage.setItem('current_user', JSON.stringify(withoutPwd));
      }
    }

    const displayName = `${subject.name || ''} ${subject.lastName || ''}`.trim();
    sendNotificationToUser(
      userId,
      'Inscripción no aprobada',
      `Hola ${displayName}. Tu solicitud de inscripción al congreso no fue aprobada. Podés comunicarte con la organización si necesitás más información o volver a intentar la inscripción cuando corresponda.`,
      'Administración'
    );

    const baseUrl = getPublicAppOrigin();
    const homeUrl = baseUrl ? `${baseUrl}/` : '/';

    if (subject.email) {
      const plainMessage = [
        `Hola ${displayName},`,
        '',
        `Lamentamos informarte que tu solicitud de inscripción al congreso no fue aprobada en esta instancia.`,
        '',
        `Si creés que hubo un error o necesitás más información, escribí al equipo organizador.`,
        '',
        `Sitio del congreso: ${homeUrl}`,
      ].join('\n');

      const htmlBody = `
        <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;">
          <h2 style="color:#7f1d1d;">Inscripción no aprobada</h2>
          <p>Hola ${escapeHtml(displayName)},</p>
          <p>Lamentamos informarte que tu solicitud de inscripci&oacute;n al congreso <strong>no fue aprobada</strong> en esta instancia.</p>
          <p>Si cre&eacute;s que hubo un error o necesit&aacute;s m&aacute;s informaci&oacute;n, contact&aacute; al equipo organizador.</p>
          <p style="margin-top:20px;"><a href="${escapeHtml(homeUrl)}" style="display:inline-block;background:#2d5016;color:white;padding:10px 18px;text-decoration:none;border-radius:8px;">Ir al sitio del congreso</a></p>
        </div>`;

      const emailResult = await sendTransactionalEmail({
        toEmail: subject.email,
        toName: displayName || subject.email,
        subject: '[Congreso Agroecología] Inscripción no aprobada',
        message: plainMessage,
        messageHtml: htmlBody,
      });

      const localhostHint = baseUrl.includes('localhost')
        ? ' El enlace al sitio en el mail puede usar localhost: definí VITE_PUBLIC_APP_URL en producción.'
        : '';
      setInscriptionInvoiceFeedback(
        (emailResult.sent
          ? 'Rechazo registrado; correo enviado al usuario.'
          : `Rechazo registrado; no se pudo enviar el correo (${emailResult.reason || 'error'}).`) + localhostHint
      );
    } else {
      setInscriptionInvoiceFeedback('Rechazo registrado; el usuario no tiene email cargado para envío automático.');
    }
  };

  const EMAIL_LOG_KEY = 'congress_email_log';
  const TALLERES_PROPUESTAS_KEY = 'congress_talleres_propuestos';
  const AGENDAS_KEY = 'congress_agendas';
  const notificationsStorageKey = (uid: string) => `congress_notifications_${uid}`;

  const canDeleteUserAccount = (u: any) => {
    if (!user || u.id === user.id) return false;
    if (Array.isArray(u.roles) && u.roles.includes('admin')) {
      const adminCount = users.filter((x: any) => Array.isArray(x.roles) && x.roles.includes('admin')).length;
      if (adminCount <= 1) return false;
    }
    return true;
  };

  const toggleUserAccountActive = (userId: string) => {
    setUserAccountFeedback('');
    const target = users.find((u: any) => u.id === userId);
    if (!target) return;
    const isActive = target.accountActive !== false;
    const nextActive = !isActive;

    if (!nextActive) {
      if (userId === user?.id) {
        alert('No podés deshabilitar tu propia cuenta desde el panel. Pedí a otro administrador que la deshabilite si hace falta.');
        return;
      }
      if (Array.isArray(target.roles) && target.roles.includes('admin')) {
        const activeAdmins = users.filter(
          (x: any) => x.roles?.includes('admin') && x.accountActive !== false
        );
        if (activeAdmins.length <= 1) {
          alert('No podés deshabilitar al único administrador activo del sistema.');
          return;
        }
      }
    }

    const updatedUsers = users.map((u: any) =>
      u.id === userId ? { ...u, accountActive: nextActive } : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    sendNotificationToUser(
      userId,
      nextActive ? 'Cuenta habilitada' : 'Cuenta deshabilitada',
      nextActive
        ? 'Tu cuenta fue habilitada nuevamente. Ya podés iniciar sesión y usar todas las funciones disponibles según tu rol en el congreso.'
        : 'Tu cuenta fue deshabilitada por administración. No podés iniciar sesión ni usar las funciones del sistema hasta que un administrador habilite tu cuenta de nuevo.',
      'Administración'
    );

    setUserAccountFeedback(
      nextActive
        ? `Cuenta de ${target.name} ${target.lastName}: habilitada. Ya puede iniciar sesión y usar el sistema según su rol.`
        : `Cuenta de ${target.name} ${target.lastName}: deshabilitada. No podrá iniciar sesión ni usar el sistema hasta que la reactives.`
    );
  };

  const deleteUser = (userId: string) => {
    const subject = users.find((x: any) => x.id === userId);
    if (!subject) {
      setConfirmDelete(null);
      return;
    }
    if (!canDeleteUserAccount(subject)) {
      setConfirmDelete(null);
      alert(
        subject.id === user?.id
          ? 'No podés eliminar tu propia cuenta desde acá.'
          : 'No se puede eliminar el único administrador del sistema.'
      );
      return;
    }

    if (subject.receiptFileId) void deleteBrowserFile(subject.receiptFileId);
    if (subject.categoryCertificateFileId) void deleteBrowserFile(subject.categoryCertificateFileId);

    const allWorks: any[] = JSON.parse(localStorage.getItem('congress_works') || '[]');
    for (const w of allWorks) {
      if (w?.userId === userId && w?.fileId) void deleteBrowserFile(w.fileId);
    }

    const ownedWorkIds = new Set(
      allWorks.filter((w: any) => w?.userId === userId).map((w: any) => w.id)
    );

    const worksNext = allWorks
      .filter((w: any) => w?.userId !== userId)
      .map((w: any) => ({
        ...w,
        assignments: Array.isArray(w.assignments)
          ? w.assignments.filter((a: any) => a?.evaluatorId !== userId)
          : w.assignments,
        reviews: Array.isArray(w.reviews)
          ? w.reviews.filter((r: any) => r?.evaluatorId !== userId)
          : w.reviews,
      }));

    localStorage.setItem('congress_works', JSON.stringify(worksNext));
    setWorks(worksNext);

    const sessionsNext = sessions.map((s) => ({
      ...s,
      works: (s.works || []).filter((wid) => !ownedWorkIds.has(wid)),
    }));
    localStorage.setItem('congress_sessions', JSON.stringify(sessionsNext));
    setSessions(sessionsNext);

    const postersNext = posterSessions.map((p) => ({
      ...p,
      works: (p.works || []).filter((row) => !ownedWorkIds.has(row.workId)),
    }));
    localStorage.setItem('congress_posters', JSON.stringify(postersNext));
    setPosterSessions(postersNext);

    const talleresProp = JSON.parse(localStorage.getItem(TALLERES_PROPUESTAS_KEY) || '[]');
    const talleresNext = talleresProp.filter((t: any) => t?.userId !== userId);
    localStorage.setItem(TALLERES_PROPUESTAS_KEY, JSON.stringify(talleresNext));

    const agendas = JSON.parse(localStorage.getItem(AGENDAS_KEY) || '{}');
    if (agendas && typeof agendas === 'object' && userId in agendas) {
      const { [userId]: _, ...rest } = agendas;
      localStorage.setItem(AGENDAS_KEY, JSON.stringify(rest));
    }

    const emailLog = JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
    const emailNext = Array.isArray(emailLog)
      ? emailLog.filter((m: any) => m?.to !== subject.email)
      : [];
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(emailNext));

    localStorage.removeItem(notificationsStorageKey(userId));

    const usersNext = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('congress_users', JSON.stringify(usersNext));
    setUsers(usersNext);
    setInscriptions(usersNext.filter((u: any) => u.inscriptionStatus === 'pending'));

    setConfirmDelete(null);
    setUserDeleteFeedback(`Se eliminó la cuenta de ${subject.name} ${subject.lastName}.`);

    if (user?.id === userId) {
      logout();
      navigate('/login');
    }
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setUserFormError('');
    setEditingUserId(null);
    setUserForm({
      name: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      category: '',
      roles: emptyRoleFlags(),
    });
  };

  const openCreateUserModal = () => {
    setUserModalMode('create');
    setEditingUserId(null);
    setUserFormError('');
    setUserForm({
      name: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      category: '',
      roles: emptyRoleFlags(),
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (u: any) => {
    setUserModalMode('edit');
    setEditingUserId(u.id);
    setUserFormError('');
    const rf = emptyRoleFlags();
    for (const r of u.roles || []) {
      if (r in rf) rf[r as UserRole] = true;
    }
    setUserForm({
      name: u.name || '',
      lastName: u.lastName || '',
      email: u.email || '',
      password: '',
      confirmPassword: '',
      category: (u.category as InscriptionCategory) || '',
      roles: rf,
    });
    setUserModalOpen(true);
  };

  const saveAdminUser = () => {
    setUserFormError('');
    const email = userForm.email.trim().toLowerCase();
    const name = userForm.name.trim();
    const lastName = userForm.lastName.trim();

    if (!name || !lastName) {
      setUserFormError('Completá nombre y apellido.');
      return;
    }
    if (!email) {
      setUserFormError('Completá el correo electrónico.');
      return;
    }
    if (!userForm.category) {
      setUserFormError('Seleccioná una categoría de inscripción.');
      return;
    }

    const selectedRoles = ADMIN_ROLE_OPTIONS.map((o) => o.role).filter((r) => userForm.roles[r]);
    if (selectedRoles.length === 0) {
      setUserFormError('Seleccioná al menos un rol.');
      return;
    }

    if (users.some((u: any) => u.email?.toLowerCase?.() === email && u.id !== editingUserId)) {
      setUserFormError('Ese correo ya está registrado.');
      return;
    }

    if (userModalMode === 'create') {
      if (userForm.password.length < 8) {
        setUserFormError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (userForm.password !== userForm.confirmPassword) {
        setUserFormError('Las contraseñas no coinciden.');
        return;
      }
    } else {
      if (userForm.password && userForm.password.length < 8) {
        setUserFormError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (userForm.password && userForm.password !== userForm.confirmPassword) {
        setUserFormError('Las contraseñas no coinciden.');
        return;
      }
    }

    if (userModalMode === 'edit' && editingUserId) {
      const subject = users.find((x: any) => x.id === editingUserId);
      const hadAdmin = subject?.roles?.includes('admin');
      const keepsAdmin = selectedRoles.includes('admin');
      if (hadAdmin && !keepsAdmin) {
        const otherAdmins = users.filter(
          (x: any) => x.id !== editingUserId && x.roles?.includes('admin')
        );
        if (otherAdmins.length === 0) {
          setUserFormError('Tiene que quedar al menos un usuario con rol Administrador.');
          return;
        }
      }
    }

    const roleOrder: UserRole[] = ['asistente', 'autor', 'evaluador', 'comite', 'admin'];
    const currentRole = roleOrder.find((r) => selectedRoles.includes(r))!;

    if (userModalMode === 'create') {
      const newUser: Record<string, unknown> = {
        id: Date.now().toString(),
        email,
        password: userForm.password,
        name,
        lastName,
        category: userForm.category,
        roles: selectedRoles,
        currentRole,
        accountActive: true,
      };
      if (selectedRoles.includes('evaluador')) {
        newUser.axes = [];
      }
      if (selectedRoles.includes('asistente')) {
        newUser.inscriptionStatus = 'confirmed';
      }
      const next = [...users, newUser];
      localStorage.setItem('congress_users', JSON.stringify(next));
      setUsers(next);
      setInscriptions(next.filter((u: any) => u.inscriptionStatus === 'pending'));
      setUserAccountFeedback(`Se creó la cuenta de ${name} ${lastName}.`);
      closeUserModal();
      return;
    }

    const idx = users.findIndex((u: any) => u.id === editingUserId);
    if (idx === -1) {
      setUserFormError('Usuario no encontrado.');
      return;
    }
    const prev = users[idx];
    const updated: any = {
      ...prev,
      email,
      name,
      lastName,
      category: userForm.category,
      roles: selectedRoles,
      currentRole,
    };
    if (userForm.password) {
      updated.password = userForm.password;
    }
    if (selectedRoles.includes('evaluador')) {
      updated.axes = Array.isArray(prev.axes) ? prev.axes : [];
    } else {
      delete updated.axes;
    }
    if (selectedRoles.includes('asistente') && prev.inscriptionStatus == null) {
      updated.inscriptionStatus = 'confirmed';
    }

    const next = [...users];
    next[idx] = updated;
    localStorage.setItem('congress_users', JSON.stringify(next));
    setUsers(next);
    setInscriptions(next.filter((u: any) => u.inscriptionStatus === 'pending'));

    if (user?.id === editingUserId) {
      updateUser({
        name: updated.name,
        lastName: updated.lastName,
        email: updated.email,
        category: updated.category,
        roles: updated.roles,
        currentRole: updated.currentRole,
        ...(updated.inscriptionStatus != null ? { inscriptionStatus: updated.inscriptionStatus } : {}),
      });
    }

    setUserAccountFeedback(`Se actualizó la cuenta de ${name} ${lastName}.`);
    closeUserModal();
  };

  // =========================
  // EVALUADORES
  // =========================
  const makeEvaluator = (userId: string) => {
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId && !u.roles?.includes('evaluador')) {
        return { ...u, roles: [...(u.roles || []), 'evaluador'] };
      }
      return u;
    });
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (currentUser.id === userId) {
      localStorage.setItem('current_user', JSON.stringify({ ...currentUser, roles: [...(currentUser.roles || []), 'evaluador'] }));
      window.location.reload();
    }
    setUsers(updatedUsers);
  };

  // =========================
  // MESA TEMÁTICA
  // =========================
  const openEditSession = (s: Session) => {
    setEditingSession(s);
    setEditSessionForm({ code: s.code, name: s.name, date: s.date, startTime: s.startTime, endTime: s.endTime, room: s.room });
  };

  const saveSession = () => {
    if (!editingSession) return;
    if (hasTimeOverlap(sessions, editSessionForm.date, editSessionForm.startTime, editSessionForm.endTime, editingSession.id)) {
      alert('Ya existe una mesa temática en ese horario. Elegí otro horario.'); return;
    }
    const updated = sessions.map((s) => s.id === editingSession.id ? { ...s, ...editSessionForm } : s);
    localStorage.setItem('congress_sessions', JSON.stringify(updated));
    setSessions(updated);
    setEditingSession(null);
    const after = updated.find((s) => s.id === editingSession.id) || editingSession;
    const msg = `Se actualizó la actividad "${after.code} - ${after.name}".\nNuevo horario: ${after.date} ${after.startTime}–${after.endTime}. Lugar: ${after.room}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
    notifyAuthorsFromWorks(after.works || [], 'Tu actividad fue actualizada', msg);
  };

  const removeWorkFromSession = (sessionId: string, workId: string) => {
    const updatedSessions = sessions.map((s) =>
      s.id === sessionId ? { ...s, works: s.works.filter((id) => id !== workId) } : s
    );
    localStorage.setItem('congress_sessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    restoreWorkToApproved(workId);
    if (editingSession?.id === sessionId)
      setEditingSession({ ...editingSession, works: editingSession.works.filter((id) => id !== workId) });
  };

  const deleteSession = (sessionId: string) => {
    const s = sessions.find((s) => s.id === sessionId);
    s?.works.forEach((workId) => restoreWorkToApproved(workId));
    const updated = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem('congress_sessions', JSON.stringify(updated));
    setSessions(updated);
    setConfirmDelete(null);
    if (editingSession?.id === sessionId) setEditingSession(null);
  };

  // =========================
  // SESIÓN DE PÓSTERS
  // =========================
  const openEditPoster = (p: PosterSession) => {
    setEditingPoster(p);
    setEditPosterForm({ name: p.name, date: p.date, startTime: p.startTime, endTime: p.endTime, location: p.location });
  };

  const savePoster = () => {
    if (!editingPoster) return;
    if (hasTimeOverlap(posterSessions, editPosterForm.date, editPosterForm.startTime, editPosterForm.endTime, editingPoster.id)) {
      alert('Ya existe una sesión de pósters en ese horario. Elegí otro horario.'); return;
    }
    const updated = posterSessions.map((p) => p.id === editingPoster.id ? { ...p, ...editPosterForm } : p);
    localStorage.setItem('congress_posters', JSON.stringify(updated));
    setPosterSessions(updated);
    setEditingPoster(null);
    const after = updated.find((p) => p.id === editingPoster.id) || editingPoster;
    const msg = `Se actualizó la actividad "${after.name}".\nNuevo horario: ${after.date} ${after.startTime}–${after.endTime}. Lugar: ${after.location}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
    notifyAuthorsFromWorks((after.works || []).map((w: any) => w.workId), 'Tu actividad fue actualizada', msg);
  };

  const removeWorkFromPoster = (posterId: string, workId: string) => {
    const updatedPosters = posterSessions.map((p) =>
      p.id === posterId ? { ...p, works: p.works.filter((w) => w.workId !== workId) } : p
    );
    localStorage.setItem('congress_posters', JSON.stringify(updatedPosters));
    setPosterSessions(updatedPosters);
    restoreWorkToApproved(workId);
    if (editingPoster?.id === posterId)
      setEditingPoster({ ...editingPoster, works: editingPoster.works.filter((w) => w.workId !== workId) });
  };

  const deletePoster = (posterId: string) => {
    const p = posterSessions.find((p) => p.id === posterId);
    p?.works.forEach((w) => restoreWorkToApproved(w.workId));
    const updated = posterSessions.filter((p) => p.id !== posterId);
    localStorage.setItem('congress_posters', JSON.stringify(updated));
    setPosterSessions(updated);
    setConfirmDelete(null);
    if (editingPoster?.id === posterId) setEditingPoster(null);
  };

  // =========================
  // MESA REDONDA
  // =========================
  const openEditRoundTable = (m: RoundTable) => {
    setEditingRoundTable(m);
    setEditRoundTableForm({ title: m.title, date: m.date, startTime: m.startTime, endTime: m.endTime, room: m.room, moderator: m.moderator, panelists: m.panelists, description: m.description });
  };

  const saveRoundTable = () => {
    if (!editingRoundTable) return;
    if (hasTimeOverlap(roundTables, editRoundTableForm.date, editRoundTableForm.startTime, editRoundTableForm.endTime, editingRoundTable.id)) {
      alert('Ya existe una mesa redonda en ese horario. Elegí otro horario.'); return;
    }
    const updated = roundTables.map((m) => m.id === editingRoundTable.id ? { ...m, ...editRoundTableForm } : m);
    localStorage.setItem('congress_roundtables', JSON.stringify(updated));
    setRoundTables(updated);
    setEditingRoundTable(null);
    const after = updated.find((m) => m.id === editingRoundTable.id) || editingRoundTable;
    const msg = `Se actualizó la actividad "${after.title}".\nNuevo horario: ${after.date} ${after.startTime}–${after.endTime}. Lugar: ${after.room}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
  };

  const deleteRoundTable = (id: string) => {
    const updated = roundTables.filter((m) => m.id !== id);
    localStorage.setItem('congress_roundtables', JSON.stringify(updated));
    setRoundTables(updated);
    setConfirmDelete(null);
    if (editingRoundTable?.id === id) setEditingRoundTable(null);
  };

  // =========================
  // TALLER PROGRAMA OFICIAL
  // =========================
  const openEditWorkshop = (t: TallerProgramado) => {
    setEditingWorkshop(t);
    setEditWorkshopForm({ titulo: t.titulo, fecha: t.fecha, startTime: t.startTime, endTime: t.endTime, room: t.room, responsables: t.responsables, descripcion: t.descripcion || '' });
  };

  const saveWorkshop = () => {
    if (!editingWorkshop) return;
    if (!editWorkshopForm.titulo.trim() || !editWorkshopForm.room.trim() || !editWorkshopForm.responsables.trim()) { alert('Completá los campos obligatorios.'); return; }
    if (!isCongressDate(editWorkshopForm.fecha)) { alert('La fecha seleccionada no es válida para este congreso'); return; }
    if (!isValidTimeRange(editWorkshopForm.startTime, editWorkshopForm.endTime)) { alert('La hora de fin debe ser posterior a la hora de inicio'); return; }
    if (hasTimeOverlap(talleresProgramados, editWorkshopForm.fecha, editWorkshopForm.startTime, editWorkshopForm.endTime, editingWorkshop.id)) { alert('Ya existe un taller en ese horario. Elegí otro horario.'); return; }
    const updated = talleresProgramados.map((t) => t.id === editingWorkshop.id ? { ...t, ...editWorkshopForm } : t);
    localStorage.setItem(TALLERES_PROGRAMADOS_KEY, JSON.stringify(updated));
    setTalleresProgramados(updated);
    setEditingWorkshop(null);
    const after = updated.find((t) => t.id === editingWorkshop.id) || editingWorkshop;
    const msg = `Se actualizó la actividad "${after.titulo}".\nNuevo horario: ${after.fecha} ${after.startTime}–${after.endTime}. Lugar: ${after.room}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
  };

  // =========================
  // CONFERENCIA PROGRAMA OFICIAL
  // =========================
  const openEditConference = (c: ConferenciaPrograma) => {
    setEditingConference(c);
    setEditConferenceForm({ titulo: c.titulo, fecha: c.fecha, startTime: c.startTime, endTime: c.endTime, room: c.room, conferencistas: c.conferencistas, moderador: c.moderador || '', institucion: c.institucion || '', descripcion: c.descripcion || '' });
  };

  const saveConference = () => {
    if (!editingConference) return;
    if (!editConferenceForm.titulo.trim() || !editConferenceForm.room.trim() || !editConferenceForm.conferencistas.trim()) { alert('Completá los campos obligatorios.'); return; }
    if (!isCongressDate(editConferenceForm.fecha)) { alert('La fecha seleccionada no es válida para este congreso'); return; }
    if (!isValidTimeRange(editConferenceForm.startTime, editConferenceForm.endTime)) { alert('La hora de fin debe ser posterior a la hora de inicio'); return; }
    if (hasTimeOverlap(conferencias, editConferenceForm.fecha, editConferenceForm.startTime, editConferenceForm.endTime, editingConference.id)) { alert('Ya existe una conferencia en ese horario. Elegí otro horario.'); return; }
    const updated = conferencias.map((c) => c.id === editingConference.id ? { ...c, ...editConferenceForm } : c);
    localStorage.setItem(CONFERENCIAS_KEY, JSON.stringify(updated));
    setConferencias(updated);
    setEditingConference(null);
    const after = updated.find((c) => c.id === editingConference.id) || editingConference;
    const msg = `Se actualizó la actividad "${after.titulo}".\nNuevo horario: ${after.fecha} ${after.startTime}–${after.endTime}. Lugar: ${after.room}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
  };

  // ── Confirmar eliminación ──────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'session')    deleteSession(confirmDelete.id);
    if (confirmDelete.type === 'poster')     deletePoster(confirmDelete.id);
    if (confirmDelete.type === 'roundtable') deleteRoundTable(confirmDelete.id);
    if (confirmDelete.type === 'workshop')   deleteTallerProgramado(confirmDelete.id);
    if (confirmDelete.type === 'conference') deleteConferencia(confirmDelete.id);
    if (confirmDelete.type === 'circular') deleteCircular(confirmDelete.id);
    if (confirmDelete.type === 'user') deleteUser(confirmDelete.id);
  };

  // =========================
  // NOTIFICACIONES
  // =========================
  const handleSendNotification = () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) { setNotifFeedback('error'); return; }
    const count = sendNotificationToAll(notifForm.title.trim(), notifForm.message.trim(), notifForm.role || undefined);
    setNotifForm({ title: '', message: '', role: '' });
    setNotifFeedback(`ok:${count}`);
  };

  // ─── Clases reutilizables ──────────────────────────────────────────────────
  const inputCls = 'w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';
  const labelCls = 'block text-sm text-gray-600 mb-1';
  const cronogramaItems = [
    ...sessions.map((s) => ({
      kind: 'session' as const,
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      title: `${s.code} - ${s.name}`,
      room: s.room,
      payload: s,
    })),
    ...roundTables.map((m) => ({
      kind: 'roundtable' as const,
      id: m.id,
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime,
      title: m.title,
      room: m.room,
      payload: m,
    })),
    ...posterSessions.map((p) => ({
      kind: 'poster' as const,
      id: p.id,
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      title: p.name,
      room: p.location,
      payload: p,
    })),
    ...talleresProgramados.map((t) => ({
      kind: 'workshop' as const,
      id: t.id,
      date: t.fecha,
      startTime: t.startTime,
      endTime: t.endTime,
      title: t.titulo,
      room: t.room,
      payload: t,
    })),
    ...conferencias.map((c) => ({
      kind: 'conference' as const,
      id: c.id,
      date: c.fecha,
      startTime: c.startTime,
      endTime: c.endTime,
      title: c.titulo,
      room: c.room,
      payload: c,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const cronogramaPorFecha = cronogramaItems.reduce<Record<string, typeof cronogramaItems>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <Settings className="w-12 h-12" />
            <div>
              <h1 className="text-4xl">Panel de Administración</h1>
              <p className="text-indigo-100 mt-2">Gestión completa del congreso</p>
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={() => navigate('/admin/mesas-tematicas')}  className="bg-blue-600 text-white px-4 py-2 rounded">Crear Mesa Temática</button>
          <button onClick={() => navigate('/admin/mesas-redondas')}   className="bg-purple-600 text-white px-4 py-2 rounded">Crear Mesa Redonda</button>
          <button onClick={() => navigate('/admin/posters')}          className="bg-yellow-600 text-white px-4 py-2 rounded">Crear Sesión de Pósters</button>
          <button onClick={() => navigate('/admin/crear-taller')}     className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 transition">Crear Taller</button>
          <button onClick={() => navigate('/admin/crear-conferencia')}className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition">Crear Conferencia</button>
          <button onClick={() => navigate("/certificado")} className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition">
            Generar Certificado
          </button>
     
        </div>

        {/* PUBLICACIÓN */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Programa publicado</h2>
              <p className="text-sm text-gray-600">Controla si el cronograma es visible para el público en "Programa".</p>
            </div>
            <button
              type="button"
              onClick={toggleProgramPublished}
              className={`px-4 py-2 rounded text-sm font-medium transition ${programPublished ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {programPublished ? 'Publicado' : 'No publicado'}
            </button>
          </div>
          {!programPublished && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-4">
              Mientras el programa esté "No publicado", el público verá el mensaje de "aún no fue publicado".
            </p>
          )}
        </div>

        <div id="admin-certificados-config" className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-l-emerald-700">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Certificados de asistencia</h2>
          <p className="text-sm text-gray-600 mb-4">
            Definí la fecha (inclusive) desde la cual los participantes podrán ver el certificado en su panel e imprimir o
            guardar PDF. Antes de esa fecha verán un aviso con el día de habilitación en la barra superior y en la sección
            de certificado.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="certificates-from-date" className="block text-xs font-medium text-gray-600 mb-1">
                Habilitar descarga desde
              </label>
              <input
                id="certificates-from-date"
                type="date"
                value={certificatesAvailableFromInput}
                onChange={(e) => setCertificatesAvailableFromInput(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCertificatesAvailableFromDate(certificatesAvailableFromInput.trim() || null);
                setCertificateAdminUiTick((n) => n + 1);
              }}
              className="bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-800 transition"
            >
              Guardar fecha
            </button>
            <button
              type="button"
              onClick={() => {
                setCertificatesAvailableFromInput('');
                setCertificatesAvailableFromDate(null);
                setCertificateAdminUiTick((n) => n + 1);
              }}
              className="text-sm text-gray-600 underline hover:text-gray-900"
            >
              Sin fecha (descarga deshabilitada)
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Fecha guardada en el sistema:{' '}
            {getCertificatesAvailableFromDate()
              ? formatCertificatesAvailableFromEsAR(getCertificatesAvailableFromDate()!)
              : 'ninguna — nadie puede descargar hasta que definas una fecha.'}
          </p>
        </div>

        {/*NO DESCOMENTAR ÉSTA LINEA */}
        {/* <CertificateView sectionTitle="Certificado de asistencia (organización)" /> */}

        {tallerOkBanner && (
          <div className="mb-6 bg-teal-50 border border-teal-200 text-teal-900 px-4 py-3 rounded-lg text-sm">
            El taller quedó cargado y visible en el cronograma del congreso.
            <button type="button" className="ml-3 underline font-medium" onClick={() => setTallerOkBanner(false)}>Cerrar</button>
          </div>
        )}
        {confOkBanner && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-3 rounded-lg text-sm">
            La conferencia quedó cargada y visible en el cronograma del congreso.
            <button type="button" className="ml-3 underline font-medium" onClick={() => setConfOkBanner(false)}>Cerrar</button>
          </div>
        )}

        {/* ══ INSCRIPCIONES ══ */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-2">Validación de Inscripciones</h2>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Transferencia:</strong> revisá el comprobante adjunto y aprobá o rechazá.
            <span className="mx-1">·</span>
            <strong>Efectivo / presencial:</strong> no hay archivo: el asistente declaró pagar en caja o durante el
            congreso. <strong>Aprobá solo si ya verificaste el cobro en efectivo</strong> (recepción, caja o acreditación).
            Si el usuario pidió factura, figura el aviso debajo del nombre.
          </p>
          {inscriptionInvoiceFeedback && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                inscriptionInvoiceFeedback.includes('correo enviado')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : inscriptionInvoiceFeedback.includes('no se pudo') ||
                      inscriptionInvoiceFeedback.includes('no tiene email')
                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              <span className="block">{inscriptionInvoiceFeedback}</span>
              <button
                type="button"
                className="mt-2 text-xs underline font-medium opacity-90 hover:opacity-100"
                onClick={() => setInscriptionInvoiceFeedback('')}
              >
                Cerrar
              </button>
            </div>
          )}
          {inscriptions.length === 0 && <p className="text-gray-500">No hay inscripciones pendientes.</p>}
          {inscriptions.map((i) => (
            <div key={i.id} className="flex justify-between border p-3 mb-2 rounded">
              <div>
                <p className="font-medium">{i.name} {i.lastName}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {i.inscriptionPaymentMethod === 'cash' ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-950 border border-amber-200">
                      Efectivo / presencial — validar cobro antes de aprobar
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800 border border-slate-200">
                      Transferencia (comprobante)
                    </span>
                  )}
                  {i.inscriptionRequiresInvoice && (
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-900 border border-violet-200">
                      Solicita factura
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Categoría: {i.category || 'Sin categoría'}
                </p>

                {/* ── VER COMPROBANTE DE PAGO ── */}
                {i.receiptFileId ? (
                  <button
                    type="button"
                    onClick={() => openStoredBrowserFile({ fileId: i.receiptFileId, fileName: i.receipt })}
                    className="flex items-center gap-1 text-xs text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded mt-1 transition"
                  >
                    <FileDown className="w-3 h-3" />
                    Ver comprobante
                  </button>
                ) : i.inscriptionPaymentMethod === 'cash' ? (
                  <span className="block text-xs text-amber-900 mt-1 rounded border border-amber-200 bg-amber-50/80 px-2 py-1">
                    Sin archivo (correcto para efectivo). Aprobá cuando conste el pago en caja / acreditación.
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin comprobante</span>
                )}

                {/* ── VER CERTIFICADO DE CATEGORÍA ── */}
                {i.categoryCertificateFileId ? (
                  <button
                    type="button"
                    onClick={() => openStoredBrowserFile({ fileId: i.categoryCertificateFileId, fileName: i.categoryCertificate })}
                    className="flex items-center gap-1 text-xs text-indigo-700 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded mt-1 transition"
                  >
                    <FileText className="w-3 h-3" />
                    Ver certificado
                  </button>
                ) : (
                  <span className="block text-xs text-gray-400 italic mt-1">Sin certificado de categoría</span>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button
                  type="button"
                  onClick={() => void handleApprove(i.id)}
                  title={
                    i.inscriptionPaymentMethod === 'cash'
                      ? 'Usá este botón cuando ya verificaste el cobro en efectivo (recepción, caja o acreditación).'
                      : 'Aprobar tras revisar el comprobante de transferencia.'
                  }
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
                >
                  {i.inscriptionPaymentMethod === 'cash' ? 'Aprobar (cobro efectivo OK)' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject(i.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ══ USUARIOS ══ */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <h2 className="text-2xl">Usuarios registrados</h2>
            <button
              type="button"
              onClick={openCreateUserModal}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              <UserPlus className="w-4 h-4" />
              Crear usuario
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Podés <strong>habilitar o deshabilitar</strong> cuentas: si están deshabilitadas no pueden iniciar sesión ni
            usar el sistema hasta que las reactives. Los registros nuevos quedan habilitados por defecto. También podés
            eliminar cuentas de prueba: se quitan trabajos del cronograma, archivos, talleres propuestos, agenda y
            notificaciones de ese usuario. No podés borrar tu propia sesión ni al único administrador.
          </p>
          {userAccountFeedback && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950 flex flex-wrap items-center justify-between gap-2">
              <span>{userAccountFeedback}</span>
              <button type="button" className="text-xs underline font-medium" onClick={() => setUserAccountFeedback('')}>
                Cerrar
              </button>
            </div>
          )}
          {userDeleteFeedback && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex flex-wrap items-center justify-between gap-2">
              <span>{userDeleteFeedback}</span>
              <button
                type="button"
                className="text-xs underline font-medium"
                onClick={() => setUserDeleteFeedback('')}
              >
                Cerrar
              </button>
            </div>
          )}
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[min(70vh,520px)] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Roles</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">Cuenta</th>
                  <th className="px-3 py-2 font-medium min-w-[200px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...users]
                  .sort((a: any, b: any) =>
                    `${a.lastName || ''} ${a.name || ''}`.localeCompare(`${b.lastName || ''} ${b.name || ''}`, 'es', {
                      sensitivity: 'base',
                    })
                  )
                  .map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/80">
                      <td className="px-3 py-2 text-gray-900">
                        {u.name} {u.lastName}
                      </td>
                      <td className="px-3 py-2 text-gray-600 break-all max-w-[200px]">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-gray-500">
                          {(u.roles || []).length ? (u.roles as string[]).join(', ') : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                            u.accountActive === false
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {u.accountActive === false ? 'Deshabilitada' : 'Activa'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditUserModal(u)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-800 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          {u.id !== user?.id ? (
                            <button
                              type="button"
                              onClick={() => toggleUserAccountActive(u.id)}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition ${
                                u.accountActive === false
                                  ? 'text-green-800 border-green-300 bg-green-50 hover:bg-green-100'
                                  : 'text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100'
                              }`}
                            >
                              {u.accountActive === false ? 'Habilitar' : 'Deshabilitar'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Tu cuenta</span>
                          )}
                          {canDeleteUserAccount(u) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUserDeleteFeedback('');
                                setConfirmDelete({
                                  type: 'user',
                                  id: u.id,
                                  name: `${u.name} ${u.lastName} (${u.email})`,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-xs text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ SOLICITUDES PARA SER AUTOR (aprobado por 2 evaluadores) ══ */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-2">Solicitudes para ser Autor</h2>
          <p className="text-sm text-gray-600 mb-6">
            Acá aparecen solo asistentes con al menos un trabajo <strong>aprobado</strong> por evaluadores (2 aprobaciones) y pendientes de habilitación del rol autor.
          </p>

          {authorRequestsFeedback && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {authorRequestsFeedback}
            </div>
          )}

          {authorRequests.length === 0 ? (
            <p className="text-gray-500">No hay solicitudes pendientes.</p>
          ) : (
            <div className="space-y-3">
              {authorRequests.map(({ user: u, works: uw }: any) => (
                <div key={u.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">{u.name} {u.lastName}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                    <div className="mt-2 text-sm text-gray-700">
                      Trabajos aprobados:
                      <ul className="list-disc ml-5 mt-1 text-sm text-gray-700">
                        {uw.map((w: any) => (
                          <li key={w.id}>
                            <span className="font-medium">{w.title}</span>
                            <span className="text-xs text-gray-500">
                              {' '}— {w.axis || '—'} — {(w.workType === 'cientifico' ? 'Científico' : w.workType === 'experiencia' ? 'Relato de experiencia' : '—')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => grantAuthorRole(u.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      Habilitar rol Autor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ CRONOGRAMA ══ */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Cronograma del Congreso</h2>
          {cronogramaItems.length === 0 ? (
            <p className="text-gray-500">No hay actividades cargadas en el cronograma.</p>
          ) : (
            Object.keys(cronogramaPorFecha)
              .sort((a, b) => a.localeCompare(b))
              .map((fecha) => (
                <div key={fecha} className="mb-8 last:mb-0">
                  <h3 className="text-xl mb-4 text-gray-800">📅 {fecha}</h3>
                  <div className="space-y-4">
                    {cronogramaPorFecha[fecha].map((item) => {
                      if (item.kind === 'session') {
                        const s = item.payload as Session;
                        return (
                          <div key={s.id} className="border p-4 rounded bg-blue-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-xs font-semibold text-blue-700 mb-1">Mesa temática</p>
                                <h3 className="font-semibold">{s.code} - {s.name}</h3>
                                <p className="text-sm text-gray-600">🕒 {s.startTime} - {s.endTime} | 📍 {s.room}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => openEditSession(s)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">
                                  <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button
                                  disabled={!programPublished}
                                  onClick={() => setConfirmDelete({ type: 'session', id: s.id, name: `${s.code} - ${s.name}` })}
                                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                >
                                  <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                              </div>
                            </div>
                            <ul className="ml-4 list-disc">
                              {s.works.map((id, index) => {
                                const work = works.find((w: any) => w.id === id);
                                return (
                                  <li key={id} className="mb-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <span className="font-medium">{index + 1}. {work?.title}</span>
                                        <div className="text-sm text-gray-600">Autor: {getAuthor(work?.userId)}</div>
                                        <div className="text-sm text-gray-600">Eje temático: {work?.axis || '—'}</div>
                                        <div className="text-sm text-gray-600">Tipo de trabajo: {work?.workType ? (work.workType === 'cientifico' ? 'Científico' : 'Relato de experiencia') : '—'}</div>
                                        <div className="text-sm text-gray-600">Modalidad: {(work?.modality ?? work?.type) || '—'}</div>
                                      </div>
                                      <button onClick={() => removeWorkFromSession(s.id, id)} className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-xs hover:bg-red-200 transition shrink-0 mt-0.5">
                                        <X className="w-3 h-3" /> Quitar
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      }

                      if (item.kind === 'roundtable') {
                        const m = item.payload as RoundTable;
                        return (
                          <div key={m.id} className="border p-4 rounded bg-purple-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-xs font-semibold text-purple-700 mb-1">Mesa redonda</p>
                                <h3 className="font-semibold">{m.title}</h3>
                                <p className="text-sm text-gray-600">🕒 {m.startTime} - {m.endTime} | 📍 {m.room}</p>
                                <p className="text-sm"><strong>Moderador:</strong> {m.moderator}</p>
                                <p className="text-sm"><strong>Panelistas:</strong> {m.panelists}</p>
                                <p className="text-sm">{m.description}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => openEditRoundTable(m)} className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition">
                                  <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button
                                  disabled={!programPublished}
                                  onClick={() => setConfirmDelete({ type: 'roundtable', id: m.id, name: m.title })}
                                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                >
                                  <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.kind === 'poster') {
                        const p = item.payload as PosterSession;
                        return (
                          <div key={p.id} className="border p-4 rounded bg-yellow-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-xs font-semibold text-yellow-700 mb-1">Sesión de pósters</p>
                                <h3 className="font-semibold">{p.name}</h3>
                                <p className="text-sm text-gray-600">🕒 {p.startTime} - {p.endTime} | 📍 {p.location}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => openEditPoster(p)} className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition">
                                  <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button
                                  disabled={!programPublished}
                                  onClick={() => setConfirmDelete({ type: 'poster', id: p.id, name: p.name })}
                                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                >
                                  <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                              </div>
                            </div>
                            <ul className="ml-4 list-disc">
                              {p.works.map((w) => {
                                const work = works.find((wk: any) => wk.id === w.workId);
                                return (
                                  <li key={w.workId} className="mb-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <span className="font-medium">{work?.title}</span>
                                        <div className="text-sm text-gray-600">Autor: {getAuthor(work?.userId)} | Panel: {w.stand}</div>
                                        <div className="text-sm text-gray-600">Eje temático: {work?.axis || '—'}</div>
                                        <div className="text-sm text-gray-600">Tipo de trabajo: {work?.workType ? (work.workType === 'cientifico' ? 'Científico' : 'Relato de experiencia') : '—'}</div>
                                        <div className="text-sm text-gray-600">Modalidad: {(work?.modality ?? work?.type) || '—'}</div>
                                      </div>
                                      <button onClick={() => removeWorkFromPoster(p.id, w.workId)} className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-xs hover:bg-red-200 transition shrink-0 mt-0.5">
                                        <X className="w-3 h-3" /> Quitar
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      }

                      if (item.kind === 'workshop') {
                        const t = item.payload as TallerProgramado;
                        return (
                          <div key={t.id} className="border p-4 rounded bg-teal-50">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="text-xs font-semibold text-teal-700 mb-1">Taller</p>
                                <h3 className="font-semibold">{t.titulo}</h3>
                                <p className="text-sm text-gray-600">🕒 {t.startTime} - {t.endTime} | 📍 {t.room}</p>
                                <p className="text-sm text-gray-700 mt-1"><strong>Responsable(s):</strong> {t.responsables}</p>
                                {t.descripcion && <p className="text-sm text-gray-600 mt-1 italic">{t.descripcion}</p>}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button type="button" onClick={() => openEditWorkshop(t)} className="flex items-center gap-1 bg-teal-700 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition">
                                  <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button
                                  type="button"
                                  disabled={!programPublished}
                                  onClick={() => setConfirmDelete({ type: 'workshop', id: t.id, name: t.titulo })}
                                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition ${programPublished ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                >
                                  <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const c = item.payload as ConferenciaPrograma;
                      return (
                        <div key={c.id} className="border p-4 rounded bg-indigo-50">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-xs font-semibold text-indigo-700 mb-1">Conferencia</p>
                              <h3 className="font-semibold">{c.titulo}</h3>
                              <p className="text-sm text-gray-600">🕒 {c.startTime} - {c.endTime} | 📍 {c.room}</p>
                              <p className="text-sm text-gray-700 mt-1"><strong>Conferencista(s):</strong> {c.conferencistas}</p>
                              {c.moderador   && <p className="text-sm text-gray-700"><strong>Moderación:</strong> {c.moderador}</p>}
                              {c.institucion && <p className="text-sm text-gray-700"><strong>Institución:</strong> {c.institucion}</p>}
                              {c.descripcion && <p className="text-sm text-gray-600 mt-1 italic">{c.descripcion}</p>}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button type="button" onClick={() => openEditConference(c)} className="flex items-center gap-1 bg-indigo-700 text-white px-3 py-1 rounded text-sm hover:bg-indigo-800 transition">
                                <Pencil className="w-4 h-4" /> Editar
                              </button>
                              <button
                                type="button"
                                disabled={!programPublished}
                                onClick={() => setConfirmDelete({ type: 'conference', id: c.id, name: c.titulo })}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition ${programPublished ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                              >
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* ══ CIRCULARES (debajo del cronograma) ══ */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-7 h-7 text-emerald-700" />
              <div>
                <h2 className="text-2xl">Circulares</h2>
                <p className="text-sm text-gray-600">
                  Publicá circulares para que se vean en la sección pública.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/circulares/nueva')}
              className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 transition"
            >
              <Plus className="w-5 h-5" />
              Nueva circular
            </button>
          </div>

          {circularesFeedback && (
            <p className={`text-sm mb-5 ${circularesFeedback.includes('eliminada') ? 'text-red-600' : 'text-green-700'}`}>
              {circularesFeedback}
            </p>
          )}

          {circulares.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
              Todavía no cargaste circulares.
            </div>
          ) : (
            <div className="space-y-4">
              {[...circulares]
                .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
                .map((c) => (
                  <div key={c.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-800">{c.number}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              c.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.status === 'published' ? 'Publicada' : 'Borrador'}
                          </span>
                        </div>
                        <h4 className="text-base font-medium text-gray-800">{c.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{c.date}</p>
                        <p className="text-sm text-gray-600 mt-2">{c.summary}</p>
                        {c.pdfName && (
                          <p className="text-xs text-gray-500 mt-2">PDF: {c.pdfName}</p>
                        )}
                        {(c.pdfFileId || c.pdfData) && (
                          <button
                            type="button"
                            onClick={() => openCircularStoredFile(c)}
                            className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 transition"
                          >
                            Ver PDF
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/circulares/editar/${c.id}`)}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                        >
                          <Pencil className="w-4 h-4" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toggleCircularStatus(c.id);
                            setCircularesFeedback(
                              c.status === 'published'
                                ? 'La circular fue guardada como borrador.'
                                : 'La circular fue publicada correctamente.'
                            );
                          }}
                          className={`px-3 py-1 rounded text-sm transition ${
                            c.status === 'published'
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {c.status === 'published' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'circular',
                              id: c.id,
                              name: `${c.number} - ${c.title}`,
                            })
                          }
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ══ NOTIFICACIONES ══ */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-7 h-7 text-indigo-600" />
            <h2 className="text-2xl">Enviar Notificación</h2>
          </div>
          <input value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="Título" className="w-full border p-2 mb-2" />
          <textarea value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} placeholder="Mensaje" className="w-full border p-2 mb-2" />
          <select value={notifForm.role} onChange={(e) => setNotifForm({ ...notifForm, role: e.target.value as any })} className="w-full border p-2 mb-2">
            <option value="">Todos</option>
            <option value="asistente">Asistentes</option>
            <option value="autor">Autores</option>
            <option value="evaluador">Evaluadores</option>
          </select>
          <button onClick={handleSendNotification} className="w-full bg-indigo-600 text-white py-2 rounded">Enviar</button>
          {notifFeedback === 'error'       && <p className="text-red-600 mt-2">Completar campos</p>}
          {notifFeedback.startsWith('ok') && <p className="text-green-600 mt-2">Enviado ✔</p>}
        </div>

      </div>

      {/* ══ MODAL CREAR / EDITAR USUARIO ══ */}
      {userModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeUserModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {userModalMode === 'create' ? 'Crear usuario' : 'Editar usuario'}
              </h2>
              <button type="button" onClick={closeUserModal} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {userFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{userFormError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
                  <input
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría de inscripción</label>
                <select
                  value={userForm.category}
                  onChange={(e) =>
                    setUserForm({ ...userForm, category: e.target.value as InscriptionCategory | '' })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Seleccioná…</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Contraseña {userModalMode === 'edit' && <span className="font-normal text-gray-400">(opcional)</span>}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    autoComplete="new-password"
                    placeholder={userModalMode === 'edit' ? 'Dejar vacío para no cambiar' : ''}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Roles en el sistema</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 space-y-2">
                  {ADMIN_ROLE_OPTIONS.map(({ role, label }) => (
                    <label key={role} className="flex items-start gap-2 cursor-pointer text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={userForm.roles[role]}
                        onChange={(e) =>
                          setUserForm({
                            ...userForm,
                            roles: { ...userForm.roles, [role]: e.target.checked },
                          })
                        }
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={closeUserModal} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveAdminUser}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {userModalMode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR ELIMINACIÓN ══ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 rounded-full p-2"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <h2 className="text-xl font-semibold text-gray-800">Confirmar eliminación</h2>
            </div>
            <p className="text-gray-600 mb-2">¿Estás seguro que querés eliminar <span className="font-semibold text-gray-800">"{confirmDelete.name}"</span>?</p>
            {confirmDelete.type === 'session'    && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-5">⚠️ Todos los trabajos asignados a esta mesa volverán al estado <strong>aprobado</strong>.</p>}
            {confirmDelete.type === 'poster'     && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-5">⚠️ Todos los pósters asignados a esta sesión volverán al estado <strong>aprobado</strong>.</p>}
            {confirmDelete.type === 'roundtable' && <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">Esta acción no afecta ningún trabajo. La mesa redonda se eliminará definitivamente.</p>}
            {confirmDelete.type === 'workshop'   && <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">Esta acción eliminará el taller del programa oficial.</p>}
            {confirmDelete.type === 'conference' && <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">Esta acción eliminará la conferencia del programa oficial.</p>}
            {confirmDelete.type === 'circular' && <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">La circular se eliminará del sistema y dejará de mostrarse en la página pública.</p>}
            {confirmDelete.type === 'user' && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-5">
                Se borrará la cuenta, sus trabajos (y se los sacará de mesas/pósters si estaban asignados), archivos de
                comprobante en el navegador, propuestas de taller, agenda y notificaciones locales. Las revisiones de
                ese evaluador en trabajos de otros autores también se quitan.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR MESA TEMÁTICA ══ */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditingSession(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Mesa Temática</h2>
              <button onClick={() => setEditingSession(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className={labelCls}>Código</label><input value={editSessionForm.code} onChange={(e) => setEditSessionForm({ ...editSessionForm, code: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Sala</label><input value={editSessionForm.room} onChange={(e) => setEditSessionForm({ ...editSessionForm, room: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Nombre</label><input value={editSessionForm.name} onChange={(e) => setEditSessionForm({ ...editSessionForm, name: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Fecha</label><input type="date" value={editSessionForm.date} onChange={(e) => setEditSessionForm({ ...editSessionForm, date: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Inicio</label><input type="time" value={editSessionForm.startTime} onChange={(e) => setEditSessionForm({ ...editSessionForm, startTime: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Fin</label><input type="time" value={editSessionForm.endTime} onChange={(e) => setEditSessionForm({ ...editSessionForm, endTime: e.target.value })} className={inputCls} /></div>
              </div>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Trabajos asignados</h3>
              {editingSession.works.length === 0 ? <p className="text-sm text-gray-400 italic">Sin trabajos asignados.</p> : (
                <ul className="divide-y border rounded overflow-hidden">
                  {editingSession.works.map((workId) => {
                    const work = works.find((w: any) => w.id === workId);
                    return (
                      <li key={workId} className="flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{work?.title ?? 'Trabajo no encontrado'}</p>
                          <p className="text-xs text-gray-500">{getAuthor(work?.userId)}</p>
                        </div>
                        <button onClick={() => removeWorkFromSession(editingSession.id, workId)} className="flex items-center gap-1 text-xs text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 px-2 py-1 rounded">
                          <X className="w-3 h-3" /> Quitar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingSession(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={saveSession} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR SESIÓN DE PÓSTERS ══ */}
      {editingPoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditingPoster(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Sesión de Pósters</h2>
              <button onClick={() => setEditingPoster(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2"><label className={labelCls}>Nombre</label><input value={editPosterForm.name} onChange={(e) => setEditPosterForm({ ...editPosterForm, name: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Ubicación</label><input value={editPosterForm.location} onChange={(e) => setEditPosterForm({ ...editPosterForm, location: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Fecha</label><input type="date" value={editPosterForm.date} onChange={(e) => setEditPosterForm({ ...editPosterForm, date: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Inicio</label><input type="time" value={editPosterForm.startTime} onChange={(e) => setEditPosterForm({ ...editPosterForm, startTime: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Fin</label><input type="time" value={editPosterForm.endTime} onChange={(e) => setEditPosterForm({ ...editPosterForm, endTime: e.target.value })} className={inputCls} /></div>
              </div>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Pósters asignados</h3>
              {editingPoster.works.length === 0 ? <p className="text-sm text-gray-400 italic">Sin pósters asignados.</p> : (
                <ul className="divide-y border rounded overflow-hidden">
                  {editingPoster.works.map((w) => {
                    const work = works.find((wk: any) => wk.id === w.workId);
                    return (
                      <li key={w.workId} className="flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{work?.title ?? 'Trabajo no encontrado'}</p>
                          <p className="text-xs text-gray-500">{getAuthor(work?.userId)} | Panel: {w.stand}</p>
                        </div>
                        <button onClick={() => removeWorkFromPoster(editingPoster.id, w.workId)} className="flex items-center gap-1 text-xs text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 px-2 py-1 rounded">
                          <X className="w-3 h-3" /> Quitar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingPoster(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={savePoster} className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR MESA REDONDA ══ */}
      {editingRoundTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditingRoundTable(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Mesa Redonda</h2>
              <button onClick={() => setEditingRoundTable(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2"><label className={labelCls}>Título</label><input value={editRoundTableForm.title} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, title: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Sala</label><input value={editRoundTableForm.room} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, room: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Fecha</label><input type="date" value={editRoundTableForm.date} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, date: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2 col-span-2">
                <div><label className={labelCls}>Inicio</label><input type="time" value={editRoundTableForm.startTime} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, startTime: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Fin</label><input type="time" value={editRoundTableForm.endTime} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, endTime: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="col-span-2"><label className={labelCls}>Moderador</label><input value={editRoundTableForm.moderator} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, moderator: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Panelistas</label><input value={editRoundTableForm.panelists} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, panelists: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Descripción</label><input value={editRoundTableForm.description} onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, description: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingRoundTable(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={saveRoundTable} className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR TALLER ══ */}
      {editingWorkshop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditingWorkshop(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Taller</h2>
              <button onClick={() => setEditingWorkshop(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2"><label className={labelCls}>Título</label><input value={editWorkshopForm.titulo} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, titulo: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Fecha</label><input type="date" value={editWorkshopForm.fecha} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, fecha: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Inicio</label><input type="time" value={editWorkshopForm.startTime} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, startTime: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Fin</label><input type="time" value={editWorkshopForm.endTime} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, endTime: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="col-span-2"><label className={labelCls}>Lugar</label><input value={editWorkshopForm.room} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, room: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Responsable(s)</label><input value={editWorkshopForm.responsables} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, responsables: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Descripción (opcional)</label><input value={editWorkshopForm.descripcion} onChange={(e) => setEditWorkshopForm({ ...editWorkshopForm, descripcion: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingWorkshop(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={saveWorkshop} className="px-4 py-2 text-sm bg-teal-700 text-white rounded hover:bg-teal-800">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR CONFERENCIA ══ */}
      {editingConference && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditingConference(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Conferencia</h2>
              <button onClick={() => setEditingConference(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2"><label className={labelCls}>Título</label><input value={editConferenceForm.titulo} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, titulo: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Fecha</label><input type="date" value={editConferenceForm.fecha} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, fecha: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Inicio</label><input type="time" value={editConferenceForm.startTime} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, startTime: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Fin</label><input type="time" value={editConferenceForm.endTime} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, endTime: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="col-span-2"><label className={labelCls}>Lugar</label><input value={editConferenceForm.room} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, room: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Conferencista(s)</label><input value={editConferenceForm.conferencistas} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, conferencistas: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Moderación (opcional)</label><input value={editConferenceForm.moderador} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, moderador: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Institución (opcional)</label><input value={editConferenceForm.institucion} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, institucion: e.target.value })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Descripción (opcional)</label><input value={editConferenceForm.descripcion} onChange={(e) => setEditConferenceForm({ ...editConferenceForm, descripcion: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingConference(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={saveConference} className="px-4 py-2 text-sm bg-indigo-700 text-white rounded hover:bg-indigo-800">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}