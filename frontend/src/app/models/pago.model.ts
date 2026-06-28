export interface Pago {
  id?: number;
  monto: number;
  metodo: string;
  requiereFactura: boolean;
  comprobanteUrl?: string | null;
  estado?: string;
  motivoRechazo?: string | null;
  idAsociacion?: string | null;
  fechaRegistro?: string | null;
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
}
