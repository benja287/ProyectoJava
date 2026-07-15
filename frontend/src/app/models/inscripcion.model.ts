export const CATEGORIAS_INSCRIPCION = [
  { value: 'SOCIO_SAAE', label: 'Socio/a SAAE', requiereCertificado: true },
  { value: 'NO_SOCIO', label: 'No socio/a', requiereCertificado: false },
  { value: 'ESTUDIANTE', label: 'Estudiante de grado', requiereCertificado: true },
  { value: 'PRODUCTOR', label: 'Productor/a de organización/comunidad', requiereCertificado: true },
  { value: 'INVESTIGADOR', label: 'Investigador/a', requiereCertificado: true },
  { value: 'EXTENSIONISTA', label: 'Extensionista', requiereCertificado: true },
  { value: 'DOCENTE', label: 'Docente', requiereCertificado: true },
  { value: 'EXTRANJERO', label: 'Extranjero/a', requiereCertificado: false },
] as const;

export type CategoriaInscripcion = (typeof CATEGORIAS_INSCRIPCION)[number]['value'];

export const PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export const ARANCELES_CATEGORIA: Record<
  CategoriaInscripcion,
  { monto: number; etiqueta: string; linkLabel: string }
> = {
  SOCIO_SAAE: { monto: 75000, etiqueta: '$ 75.000', linkLabel: 'Link socios SAAE' },
  NO_SOCIO: { monto: 150000, etiqueta: '$ 150.000', linkLabel: 'Link no socios' },
  ESTUDIANTE: { monto: 37000, etiqueta: '$ 37.000', linkLabel: 'Link estudiantes' },
  PRODUCTOR: { monto: 50000, etiqueta: '$ 50.000', linkLabel: 'Link productores' },
  INVESTIGADOR: { monto: 150000, etiqueta: '$ 150.000', linkLabel: 'Link arancel general' },
  EXTENSIONISTA: { monto: 150000, etiqueta: '$ 150.000', linkLabel: 'Link arancel general' },
  DOCENTE: { monto: 150000, etiqueta: '$ 150.000', linkLabel: 'Link arancel general' },
  EXTRANJERO: { monto: 170, etiqueta: 'USD 170', linkLabel: 'Link extranjeros' },
};

export interface InscripcionCongreso {
  id?: number;
  categoria: string;
  estado?: string;
  fechaSolicitud?: string;
  motivoRechazo?: string | null;
  institucion?: string;
  provincia?: string;
  requiereFactura?: boolean;
  certificadoUrl?: string | null;
  usuarioId?: number;
  usuarioNombre?: string;
  usuarioApellido?: string;
  usuarioEmail?: string;
  pagoId?: number | null;
  pagoMonto?: number | null;
  pagoEstado?: string | null;
  /** TRANSFERENCIA | EFECTIVO | TARJETA */
  pagoMetodo?: string | null;
  pagoComprobanteUrl?: string | null;
}

export interface EstadoInscripcionParticipante {
  inscripcion: InscripcionCongreso | null;
  categoriaPreferida: string | null;
  puedeInscribirse: boolean;
  esAsistente: boolean;
}

export interface PaginaInscripciones {
  items: InscripcionCongreso[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface InscripcionCreateRequest {
  categoria?: string;
  institucion: string;
  provincia: string;
  requiereFactura: boolean;
  metodoPago: 'TRANSFERENCIA' | 'EFECTIVO';
  monto: number;
  certificado?: File;
  comprobante?: File;
}

export interface ValidacionInscripcionRequest {
  aprobar: boolean;
  motivoRechazo?: string;
}

export interface InscripcionListFiltro {
  estado?: string;
  categoria?: string;
}

export function categoriaRequiereCertificado(categoria: string): boolean {
  return CATEGORIAS_INSCRIPCION.some((c) => c.value === categoria && c.requiereCertificado);
}

export function etiquetaCategoria(categoria: string): string {
  return CATEGORIAS_INSCRIPCION.find((c) => c.value === categoria)?.label ?? categoria;
}

export function arancelCategoria(categoria: string): { monto: number; etiqueta: string; linkLabel: string } | null {
  return ARANCELES_CATEGORIA[categoria as CategoriaInscripcion] ?? null;
}

export function asCategoriaInscripcion(value: string | null | undefined): CategoriaInscripcion | null {
  if (!value) {
    return null;
  }
  return CATEGORIAS_INSCRIPCION.some((c) => c.value === value)
    ? (value as CategoriaInscripcion)
    : null;
}

export function esPagoEfectivo(inscripcion: {
  pagoMetodo?: string | null;
  pagoEstado?: string | null;
  pagoComprobanteUrl?: string | null;
}): boolean {
  if (inscripcion.pagoMetodo) {
    return inscripcion.pagoMetodo === 'EFECTIVO';
  }
  // Compatibilidad con respuestas viejas sin pagoMetodo.
  return !!inscripcion.pagoEstado && !inscripcion.pagoComprobanteUrl;
}

export function etiquetaMetodoPago(metodo?: string | null): string {
  switch (metodo) {
    case 'EFECTIVO':
      return 'Efectivo / presencial';
    case 'TRANSFERENCIA':
      return 'Transferencia';
    case 'TARJETA':
      return 'Tarjeta';
    default:
      return metodo || '—';
  }
}
