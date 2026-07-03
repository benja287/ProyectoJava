export const CATEGORIAS_INSCRIPCION = [
  { value: 'SOCIO_SAAE', label: 'Socio/a SAAE', requiereCertificado: true },
  { value: 'NO_SOCIO', label: 'No socio/a', requiereCertificado: false },
  { value: 'ESTUDIANTE', label: 'Estudiante de grado', requiereCertificado: true },
  { value: 'PRODUCTOR', label: 'Productor/a', requiereCertificado: true },
  { value: 'INVESTIGADOR', label: 'Investigador/a', requiereCertificado: true },
  { value: 'EXTENSIONISTA', label: 'Extensionista', requiereCertificado: true },
  { value: 'DOCENTE', label: 'Docente', requiereCertificado: true },
  { value: 'EXTRANJERO', label: 'Extranjero/a', requiereCertificado: false },
] as const;

export type CategoriaInscripcion = (typeof CATEGORIAS_INSCRIPCION)[number]['value'];

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
  pagoComprobanteUrl?: string | null;
}

export interface PaginaInscripciones {
  items: InscripcionCongreso[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface InscripcionCreateRequest {
  categoria: string;
  institucion: string;
  provincia: string;
  requiereFactura: boolean;
  certificado?: File;
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
