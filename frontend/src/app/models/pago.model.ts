export interface Pago {
  id?: number;
  monto: number;
  metodo: string;
  requiereFactura: boolean;
  comprobanteUrl?: string | null;
  facturaUrl?: string | null;
  estado?: string;
  motivoRechazo?: string | null;
  idAsociacion?: string | null;
  fechaRegistro?: string | null;
  numeroRecibo?: string | null;
  observacionesValidacion?: string | null;
  fechaValidacion?: string | null;
  validadoPorId?: number | null;
  validadoPorNombre?: string | null;
  efectivoFisicoRecibido?: boolean;
}

export interface PaginaPagos {
  items: Pago[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ValidacionPagoRequest {
  aprobar: boolean;
  motivoRechazo?: string;
  montoAjustado?: number;
  numeroRecibo?: string;
  observaciones?: string;
  efectivoFisicoRecibido?: boolean;
}

export interface ArqueoCajaItem {
  pagoId: number;
  monto: number;
  numeroRecibo: string | null;
  fechaValidacion: string | null;
  validadoPorNombre: string | null;
  efectivoFisicoRecibido: boolean;
  observaciones: string | null;
}

export interface ArqueoCaja {
  desde: string;
  hasta: string;
  cantidadPagos: number;
  totalCobrado: number;
  items: ArqueoCajaItem[];
}

export interface ArqueoNotificacionResult {
  administradoresNotificados: number;
  mensaje: string;
  arqueo: ArqueoCaja;
}
