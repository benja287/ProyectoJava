import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Banknote, CreditCard, Upload, CheckCircle, Landmark } from 'lucide-react';
import { saveBrowserFile } from '../lib/browserFiles';
import { buildComprobanteSearchParamsFromUser } from '../lib/inscriptionComprobantePayload';
import type { InscriptionCategory } from '../context/AuthContext';

export function InscripcionPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const categoriesRequiringCertificate = new Set<InscriptionCategory>([
    'socio_saae',
    'estudiante',
    'productor',
    'investigador',
    'extensionista',
    'docente',
  ]);
  const categoryOptions: { value: InscriptionCategory; label: string }[] = [
    { value: 'socio_saae', label: 'Socio/a SAAE' },
    { value: 'no_socio', label: 'No socio/a' },
    { value: 'estudiante', label: 'Estudiante de grado' },
    { value: 'productor', label: 'Productor/a de organización/comunidad' },
    { value: 'investigador', label: 'Investigador/a' },
    { value: 'extensionista', label: 'Extensionista' },
    { value: 'docente', label: 'Docente' },
    { value: 'extranjero', label: 'Extranjero/a' },
  ];
  const categoryFees: Record<
    InscriptionCategory,
    { amount: string; linkLabel: string }
  > = {
    socio_saae: { amount: '$ 75.000', linkLabel: 'Link socios SAAE' },
    no_socio: { amount: '$ 150.000', linkLabel: 'Link no socios' },
    estudiante: { amount: '$ 37.000', linkLabel: 'Link estudiantes' },
    productor: { amount: '$ 50.000', linkLabel: 'Link productores' },
    investigador: { amount: '$ 150.000', linkLabel: 'Link arancel general' },
    extensionista: { amount: '$ 150.000', linkLabel: 'Link arancel general' },
    docente: { amount: '$ 150.000', linkLabel: 'Link arancel general' },
    extranjero: { amount: 'USD 170', linkLabel: 'Link extranjeros' },
  };

  const [formData, setFormData] = useState({
    institution: user?.institution || '',
    province:    user?.province    || '',
    category:    (user?.category || '') as InscriptionCategory | '',
    receipt:     null as File | null,
    categoryCertificate: null as File | null,
  });

  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>(
    user?.inscriptionPaymentMethod === 'cash' ? 'cash' : 'transfer'
  );
  const [requiresInvoice, setRequiresInvoice] = useState(!!user?.inscriptionRequiresInvoice);

  const [submitted, setSubmitted]   = useState(false);
  const [fileError, setFileError]   = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [uploading, setUploading]   = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const comprobanteHref = useMemo(() => {
    const q = buildComprobanteSearchParamsFromUser(user);
    if (q) return `/inscripcion/comprobante?${q}`;
    if (user.inscriptionAccreditationToken) {
      return `/inscripcion/comprobante?t=${encodeURIComponent(user.inscriptionAccreditationToken)}`;
    }
    return '/inscripcion/comprobante';
  }, [user]);

  // ── Bloquear re-inscripción si ya está pendiente o confirmada ───────────────
  if (user.inscriptionStatus === 'pending' || user.inscriptionStatus === 'confirmed') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <h2 className="text-3xl text-gray-800 mb-4">
            {user.inscriptionStatus === 'confirmed'
              ? '¡Tu inscripción fue aprobada! ✅'
              : 'Tu inscripción está pendiente de aprobación ⏳'}
          </h2>
          <p className="text-gray-600 mb-6">
            {user.inscriptionStatus === 'confirmed'
              ? 'Ya estás inscripto/a al congreso.'
              : user.inscriptionPaymentMethod === 'cash'
                ? 'Declaraste pago en efectivo / presencial. La organización validará el cobro (en caja o acreditación durante el congreso) y te confirmará la inscripción. No hace falta comprobante digital.'
                : 'Enviaste comprobante de transferencia. Será validado por el equipo organizador. Te notificaremos cuando sea aprobada.'}
          </p>
          {user.inscriptionStatus === 'confirmed' && user.inscriptionAccreditationToken && (
            <div className="mb-6 rounded-lg border border-[#2d5016]/30 bg-[#f6faf3] px-4 py-3 text-left text-sm text-gray-700">
              <p className="font-medium text-gray-800 mb-2">Tu comprobante con QR de acreditación</p>
              <p className="text-xs text-gray-600 mb-3">
                Podés abrirlo, imprimirlo o guardarlo como PDF. El mismo enlace llega por email si el envío está
                configurado.
              </p>
              <Link
                to={comprobanteHref}
                className="inline-block px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition text-sm font-medium"
              >
                Ver / descargar comprobante
              </Link>
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];
  const selectedCategory = formData.category as InscriptionCategory | '';
  const categoryFromRegister = user?.category as InscriptionCategory | undefined;
  const requiresCategoryCertificate =
    !!selectedCategory &&
    categoriesRequiringCertificate.has(selectedCategory);
  const hasCategoryCertificateAlready = !!user.categoryCertificateFileId;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setFileError('Formato inválido. Solo PDF, JPG o PNG.');
      setFormData({ ...formData, receipt: null });
      e.target.value = '';
      return;
    }

    setFileError('');
    setFormData({ ...formData, receipt: file });
  };

  const handleCategoryCertificateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setCategoryError('Formato inválido. Solo PDF, JPG o PNG.');
      setFormData({ ...formData, categoryCertificate: null });
      e.target.value = '';
      return;
    }

    setCategoryError('');
    setFormData({ ...formData, categoryCertificate: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      setCategoryError('Debés seleccionar una categoría.');
      return;
    }

    if (paymentMethod === 'transfer' && !formData.receipt) {
      setFileError('Debés subir un comprobante de transferencia (PDF, JPG o PNG).');
      return;
    }
    if (
      requiresCategoryCertificate &&
      !hasCategoryCertificateAlready &&
      !formData.categoryCertificate
    ) {
      setCategoryError('Esta categoría requiere certificado.');
      return;
    }

    setUploading(true);

    // ── Guardar comprobante en IndexedDB (solo transferencia) ───────────────
    let storedFile = null;
    if (paymentMethod === 'transfer' && formData.receipt) {
      try {
        storedFile = await saveBrowserFile(formData.receipt);
      } catch {
        console.warn('No se pudo guardar el comprobante en IndexedDB');
      }
    }
    let storedCategoryFile = null;
    if (formData.categoryCertificate) {
      try {
        storedCategoryFile = await saveBrowserFile(formData.categoryCertificate);
      } catch {
        console.warn('No se pudo guardar el certificado de categoría en IndexedDB');
      }
    }

    // Actualizar usuario — solo metadatos en localStorage, archivo en IndexedDB
    const updates: any = {
      institution:       formData.institution,
      province:          formData.province,
      inscriptionStatus: 'pending',
      category:          formData.category,
      inscriptionPaymentMethod: paymentMethod,
      inscriptionRequiresInvoice: requiresInvoice,
    };

    if (paymentMethod === 'transfer') {
      updates.receipt = formData.receipt ? formData.receipt.name : '';
      if (storedFile) {
        updates.receiptFileId = storedFile.fileId;
        updates.receiptFileSize = storedFile.fileSize;
        updates.receiptMimeType = storedFile.fileType;
      }
    } else {
      updates.receipt = '';
      updates.receiptFileId = undefined;
      updates.receiptFileSize = undefined;
      updates.receiptMimeType = undefined;
    }
    if (storedCategoryFile) {
      updates.categoryCertificate = storedCategoryFile.fileName;
      updates.categoryCertificateFileId = storedCategoryFile.fileId;
      updates.categoryCertificateFileSize = storedCategoryFile.fileSize;
      updates.categoryCertificateMimeType = storedCategoryFile.fileType;
    }

    updateUser(updates);

    setUploading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <h2 className="text-3xl text-gray-800 mb-4">Tu inscripción fue enviada</h2>
          <p className="text-gray-600 mb-6">Será validada por el equipo organizador</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">

          <div className="flex items-center gap-4 mb-8">
            <CreditCard className="w-10 h-10 text-[#2d5016]" />
            <div>
              <h1 className="text-3xl text-gray-800">Inscripción al Congreso</h1>
              <p className="text-gray-600">
                {paymentMethod === 'cash'
                  ? 'Efectivo: no subís comprobante de pago. Completá datos y certificados que correspondan a tu categoría.'
                  : 'Transferencia: adjuntá el comprobante de pago y completá el resto de los datos.'}
              </p>
            </div>
          </div>

          {user.inscriptionStatus === 'rejected' && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              Tu inscripción anterior fue <strong>rechazada</strong>. Podés enviar una nueva solicitud: revisá el método
              de pago (transferencia con comprobante o efectivo presencial) y los archivos requeridos.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="rounded-xl border border-[#2d5016]/25 bg-[#f7faf5] p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900">Forma de pago</p>
              <div className="flex flex-col gap-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 has-[:checked]:border-[#2d5016] has-[:checked]:ring-2 has-[:checked]:ring-[#2d5016]/20">
                  <input
                    type="radio"
                    name="inscriptionPayMethod"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => {
                      setPaymentMethod('transfer');
                      setFileError('');
                    }}
                    className="mt-1"
                  />
                  <div>
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <Landmark className="w-4 h-4 shrink-0 text-[#2d5016]" />
                      Transferencia u otro pago con comprobante
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Subís el comprobante (captura, PDF o imagen) para que administración lo valide.
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 has-[:checked]:border-[#2d5016] has-[:checked]:ring-2 has-[:checked]:ring-[#2d5016]/20">
                  <input
                    type="radio"
                    name="inscriptionPayMethod"
                    checked={paymentMethod === 'cash'}
                    onChange={() => {
                      setPaymentMethod('cash');
                      setFormData((fd) => ({ ...fd, receipt: null }));
                      setFileError('');
                    }}
                    className="mt-1"
                  />
                  <div>
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <Banknote className="w-4 h-4 shrink-0 text-[#2d5016]" />
                      Efectivo / inscripción presencial (durante el congreso)
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Sin archivo de pago: la confirmación la hace administración en el panel (ver texto debajo).
                    </p>
                  </div>
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={requiresInvoice}
                  onChange={(e) => setRequiresInvoice(e.target.checked)}
                  className="rounded border-gray-300 text-[#2d5016] focus:ring-[#2d5016]"
                />
                Solicito factura (fiscal)
              </label>
            </div>

            {paymentMethod === 'transfer' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprobante de pago (obligatorio)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="w-full"
                  />
                  {fileError && <p className="text-red-600 text-sm mt-2">{fileError}</p>}
                  {formData.receipt && (
                    <p className="text-green-600 text-sm mt-2">Archivo cargado: {formData.receipt.name}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="font-semibold text-amber-950 mb-2">Pago en efectivo — sin comprobante digital</p>
                <p className="text-amber-950/95 leading-relaxed">
                  La inscripción queda pendiente hasta que un administrador valide en el panel que registraste el pago
                  en efectivo (por ejemplo en caja o acreditación durante el congreso).
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institución
              </label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                required
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="CABA">CABA</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Misiones">Misiones</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría de Inscripción
              </label>
              {categoryFromRegister ? (
                <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2">
                  <p className="text-sm text-gray-800">
                    {categoryOptions.find((option) => option.value === categoryFromRegister)?.label || categoryFromRegister}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Definida en el registro de usuario.
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={formData.category}
                  onChange={(e) => {
                    const nextCategory = e.target.value as InscriptionCategory | '';
                    setFormData({
                      ...formData,
                      category: nextCategory,
                      categoryCertificate: categoriesRequiringCertificate.has(nextCategory as InscriptionCategory)
                        ? formData.categoryCertificate
                        : null,
                    });
                    setCategoryError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecciona una categoría</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {selectedCategory && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-sm text-emerald-900">
                    Arancel para tu categoría: <strong>{categoryFees[selectedCategory].amount}</strong>
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Pago: {categoryFees[selectedCategory].linkLabel}
                  </p>
                </div>
              )}
              {categoryError && (
                <p className="text-red-600 text-sm mt-2">{categoryError}</p>
              )}
            </div>

            {requiresCategoryCertificate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificado de categoría (obligatorio){' '}
                  <span className="font-normal text-gray-500">— no es el comprobante de pago</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCategoryCertificateChange}
                    className="w-full"
                  />
                  {hasCategoryCertificateAlready && !formData.categoryCertificate && (
                    <p className="text-green-700 text-sm mt-2">
                      Ya tenés un certificado cargado en el registro previo.
                    </p>
                  )}
                  {formData.categoryCertificate && (
                    <p className="text-green-700 text-sm mt-2">
                      Certificado cargado: {formData.categoryCertificate.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition font-medium disabled:opacity-60"
            >
              {uploading ? 'Enviando...' : 'Enviar inscripción'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}