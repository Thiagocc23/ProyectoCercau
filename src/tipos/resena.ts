export interface RespuestaComercio {
  comentario: string;
  fechaCreacion: string;
}

export interface Resena {
  id: string;
  comercioId: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario?: string;
  fotos?: string[];
  fechaCreacion: string;
  respuestaComercio?: RespuestaComercio;
  reportada?: boolean;
  motivoReporte?: string;
  fechaReporte?: string;
  pendienteSincronizacion?: boolean;
}

export interface DatosNuevaResena {
  comercioId: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario: string;
  fotos: string[];
}

export interface DatosEditarResena {
  id: string;
  usuarioId: string;
  calificacion: number;
  comentario: string;
  fotos: string[];
}