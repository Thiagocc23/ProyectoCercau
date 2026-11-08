import { Resena } from '../tipos/resena';

export const RESENAS_MOCK: Resena[] = [
  {
    id: 'res-1',
    comercioId: '1',
    usuarioId: 'usr-10',
    nombreUsuario: 'Martín Gómez',
    calificacion: 5,
    comentario: '¡Excelente atención y los productos son de primera calidad!',
    fechaCreacion: '2026-03-24T10:00:00Z',
    fotos: [],
  },
  {
    id: 'res-2',
    comercioId: '1',
    usuarioId: 'usr-11',
    nombreUsuario: 'Sofía Álvarez',
    calificacion: 4,
    comentario: 'Muy rico todo, aunque había bastante fila para pagar.',
    fechaCreacion: '2026-03-22T10:00:00Z',
    respuestaComercio: '¡Gracias Sofía! Ya sumamos otra caja para agilizar el servicio.',
  },
  {
    id: 'res-3',
    comercioId: '1',
    usuarioId: 'usr-12',
    nombreUsuario: 'Carlos Benítez',
    calificacion: 3,
    comentario: 'Precios accesibles, pero faltaba variedad de productos.',
    fechaCreacion: '2026-03-15T10:00:00Z',
  },
  {
    id: 'res-001',
    comercioId: 'com-001',
    usuarioId: 'usr-001',
    nombreUsuario: 'Juan Pérez',
    calificacion: 4,
    comentario: 'Muy rico café y excelente atención, aunque había mucha gente.',
    fechaCreacion: '2026-10-25T10:00:00Z',
    respuestaComercio: {
      comentario: '¡Hola Juan! Gracias por tu visita. Estamos ampliando el local para que estén más cómodos.',
      fechaCreacion: '2026-10-26T12:00:00Z',
    }
  }
];