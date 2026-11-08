import { RESENAS_MOCK } from '../mocks/resenas';
import { Resena } from '../tipos/resena';

export const obtenerResenasPorComercio = async (comercioId: string): Promise<Resena[]> => {
  // Simula la demora de red exigida por la cátedra
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!RESENAS_MOCK || !Array.isArray(RESENAS_MOCK)) {
    return [];
  }

  return RESENAS_MOCK
    .filter((r) => r.comercioId === comercioId)
    .sort((a, b) => {
      const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
      const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
      return fechaB - fechaA; 
    });
};

export const calcularEstadisticasResenas = (resenas: Resena[]) => {
  if (!resenas || resenas.length === 0) {
    return { promedio: 0, total: 0 };
  }
  const suma = resenas.reduce((acc, curr) => acc + (curr.calificacion || 0), 0);
  const promedio = Number((suma / resenas.length).toFixed(1));
  return { promedio, total: resenas.length };
};