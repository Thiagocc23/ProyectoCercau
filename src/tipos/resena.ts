export interface Resena {
  id: string;
  comercioId: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario?: string;
  fotos?: string[];
  fecha?: string; 
  fechaCreacion?: Date | string; 
  respuestaComercio?: {
    comentario: string;
    fechaCreacion?: Date | string;
  };
}