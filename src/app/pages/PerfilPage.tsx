import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldCheck, MapPin, Building2, BadgeCheck } from 'lucide-react';
import type { InscriptionCategory } from '../context/AuthContext';
import { buildComprobanteSearchParamsFromUser } from '../lib/inscriptionComprobantePayload';

const roleLabel: Record<string, string> = {
  asistente: 'Asistente',
  autor: 'Autor',
  evaluador: 'Evaluador',
  admin: 'Administrador',
};

const inscriptionLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
};

const categoryLabel: Record<InscriptionCategory, string> = {
  socio_saae: 'Socio/a SAAE',
  no_socio: 'No socio/a',
  estudiante: 'Estudiante',
  productor: 'Productor/a',
  investigador: 'Investigador/a',
  extensionista: 'Extensionista',
  docente: 'Docente',
  extranjero: 'Extranjero/a',
};

const categoryOptions: { value: InscriptionCategory; label: string }[] = Object.entries(
  categoryLabel
).map(([value, label]) => ({ value: value as InscriptionCategory, label }));

export function PerfilPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    institution: '',
    province: '',
    category: '' as InscriptionCategory | '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const initials = useMemo(() => {
    const n = `${user.name?.[0] || ''}${user.lastName?.[0] || ''}`.trim().toUpperCase();
    return n || 'U';
  }, [user.name, user.lastName]);

  const comprobanteHref = useMemo(() => {
    const q = buildComprobanteSearchParamsFromUser(user);
    if (q) return `/inscripcion/comprobante?${q}`;
    if (user.inscriptionAccreditationToken) {
      return `/inscripcion/comprobante?t=${encodeURIComponent(user.inscriptionAccreditationToken)}`;
    }
    return '/inscripcion/comprobante';
  }, [user]);

  useEffect(() => {
    setForm({
      name: user.name || '',
      lastName: user.lastName || '',
      institution: user.institution || '',
      province: user.province || '',
      category: (user.category || '') as InscriptionCategory | '',
    });
  }, [user.name, user.lastName, user.institution, user.province, user.category]);

  const handleSave = () => {
    if (!form.name.trim() || !form.lastName.trim()) {
      setFeedback('Nombre y apellido son obligatorios.');
      return;
    }
    updateUser({
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      institution: form.institution.trim(),
      province: form.province.trim(),
      category: form.category || undefined,
    });
    setEditing(false);
    setFeedback('Perfil actualizado correctamente.');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-full bg-[#2d5016] text-white flex items-center justify-center text-xl font-semibold">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl text-gray-800">Mi perfil</h1>
              <p className="text-gray-600">Información de tu cuenta en el congreso</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Nombre</p>
              {editing ? (
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setFeedback('');
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-gray-800 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  {user.name}
                </p>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Apellido</p>
              {editing ? (
                <input
                  value={form.lastName}
                  onChange={(e) => {
                    setForm({ ...form, lastName: e.target.value });
                    setFeedback('');
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-gray-800 font-medium">{user.lastName}</p>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Email</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                {user.email}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Rol activo</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-500" />
                {user.currentRole ? roleLabel[user.currentRole] : 'Sin rol activo'}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Estado de inscripción</p>
              <p className="text-gray-800 font-medium flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-gray-500" />
                {user.inscriptionStatus ? inscriptionLabel[user.inscriptionStatus] : 'Sin inscripción enviada'}
              </p>
              {user.inscriptionStatus && user.inscriptionPaymentMethod && (
                <p className="text-xs text-gray-600 mt-2 pl-6">
                  Forma de pago declarada:{' '}
                  <span className="font-medium text-gray-800">
                    {user.inscriptionPaymentMethod === 'cash' ? 'Efectivo / presencial' : 'Transferencia u otro con comprobante'}
                  </span>
                </p>
              )}
              {user.inscriptionStatus === 'confirmed' &&
                user.inscriptionPaymentMethod === 'cash' &&
                user.inscriptionCashValidatedAt && (
                  <p className="text-xs text-emerald-800 mt-2 pl-6 rounded border border-emerald-200 bg-emerald-50/80 px-2 py-1.5">
                    Cobro en efectivo registrado el{' '}
                    {new Date(user.inscriptionCashValidatedAt).toLocaleString('es-AR')}
                    {user.inscriptionCashValidatedByLabel
                      ? ` por ${user.inscriptionCashValidatedByLabel}`
                      : ''}
                    .
                  </p>
                )}
              {user.inscriptionRequiresInvoice && (
                <p className="text-xs text-violet-800 mt-1 pl-6">Solicitaste factura fiscal — coordiná con administración.</p>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Categoría de inscripción</p>
              {editing ? (
                <select
                  value={form.category}
                  onChange={(e) => {
                    setForm({ ...form, category: e.target.value as InscriptionCategory | '' });
                    setFeedback('');
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Sin categoría</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-800 font-medium">
                  {user.category ? categoryLabel[user.category] : 'Sin categoría'}
                </p>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Institución</p>
              {editing ? (
                <input
                  value={form.institution}
                  onChange={(e) => {
                    setForm({ ...form, institution: e.target.value });
                    setFeedback('');
                  }}
                  placeholder="Tu institución"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-gray-800 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  {user.institution || 'No informada'}
                </p>
              )}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Provincia</p>
              {editing ? (
                <input
                  value={form.province}
                  onChange={(e) => {
                    setForm({ ...form, province: e.target.value });
                    setFeedback('');
                  }}
                  placeholder="Tu provincia"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-gray-800 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {user.province || 'No informada'}
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-2">Roles asignados</p>
            <div className="flex flex-wrap gap-2">
              {(user.roles || []).length === 0 ? (
                <span className="text-sm text-gray-500">Todavía no tenés roles asignados.</span>
              ) : (
                user.roles.map((r) => (
                  <span key={r} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {roleLabel[r] || r}
                  </span>
                ))
              )}
            </div>
          </div>

          {feedback && (
            <p className={`text-sm mb-4 ${feedback.includes('correctamente') ? 'text-green-700' : 'text-red-600'}`}>
              {feedback}
            </p>
          )}

          {user.inscriptionStatus === 'confirmed' &&
            user.inscriptionAccreditationToken &&
            user.inscriptionInvoiceId && (
              <div className="mb-8 rounded-xl border border-[#2d5016]/25 bg-[#f7faf5] p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Comprobante de inscripción</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Nº {user.inscriptionInvoiceId}
                  {user.inscriptionInvoiceIssuedAt &&
                    ` · emitido ${new Date(user.inscriptionInvoiceIssuedAt).toLocaleString('es-AR')}`}
                </p>
                <Link
                  to={comprobanteHref}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition text-sm font-medium"
                >
                  Abrir comprobante (QR e imprimir PDF)
                </Link>
              </div>
            )}

          <div className="flex flex-wrap gap-3">
            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setFeedback('');
                }}
                className="px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
              >
                Editar perfil
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFeedback('');
                    setForm({
                      name: user.name || '',
                      lastName: user.lastName || '',
                      institution: user.institution || '',
                      province: user.province || '',
                      category: (user.category || '') as InscriptionCategory | '',
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </>
            )}
            <Link
              to="/select-role"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cambiar rol
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

