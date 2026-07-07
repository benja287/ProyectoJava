export interface EnvioEmail {
  id: number;
  destinatario: string;
  asunto: string;
  cuerpo: string;
  fechaEnvio?: string;
  enviado: boolean;
  error?: string;
}

export interface PaginaEnviosEmail {
  items: EnvioEmail[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface EnvioEmailResumen {
  total: number;
  enviados: number;
  fallidos: number;
}

export interface LimpiezaEnvioEmailResult {
  eliminados: number;
  mensaje: string;
}
