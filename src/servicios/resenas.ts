import { ResenaCuenta } from '../tipos/actividad';
import { DatosEditarResena, DatosNuevaResena, Resena } from '../tipos/resena';
import { conectarConsultaResenas } from './actividad';
import { listarResenasApi, type ResenaApi } from './api-resenas';
import {
  actualizarResenaPendientePorClientId,
  eliminarResenaPendientePorClientId,
  eliminarResenaSincronizadaDB,
  guardarResenaPendiente,
  guardarResenaSincronizadaDB,
  inicializarBaseDeDatos,
  obtenerResenasLocales,
  obtenerResenasSincronizadasDB
} from './base-datos';

// Convierte el formato de reseña del servidor al que usa la interfaz del Rol 4.
function convertirResenaApi(resena: ResenaApi): Resena {
  return {
    id: resena.id,
    comercioId: resena.comercioId,
    usuarioId: resena.usuarioId,
    // La API de reseñas no incluye el nombre del autor.
    nombreUsuario: 'Vecino',
    calificacion: resena.estrellas,
    comentario: resena.comentario,
    fotos: [],
    fechaCreacion: resena.creadaEn,
    // La API devuelve el texto, pero no la fecha de la respuesta.
    respuestaComercio: resena.respuesta
      ? { comentario: resena.respuesta, fechaCreacion: '' }
      : undefined,
    reportada: resena.reportada,
    pendienteSincronizacion: !resena.sincronizada,
  };
}

const DEMORA_SIMULADA_MS = 600;

const esperarRedSimulada = () =>
  new Promise<void>((resolve) => setTimeout(resolve, DEMORA_SIMULADA_MS));

function ordenarPorFechaDescendente(lista: Resena[]): Resena[] {
  return [...lista].sort((a, b) => {
    const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
    const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
    return fechaB - fechaA;
  });
}

// Catálogo de videos de presentación asociados por comercioId
export const VIDEOS_COMERCIO_CATALOGO: Record<string, string> = {
  '1': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
  'cafe-la-esquina': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
  'panaderia-la-esquina': 'https://assets.mixkit.co/videos/4291/4291-720.mp4',
  'panaderia-el-sol': 'https://assets.mixkit.co/videos/4291/4291-720.mp4',
  'floreria-verde': 'https://assets.mixkit.co/videos/4885/4885-720.mp4',
  'cafe-jacaranda': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
};

/**
 * Obtiene la URL del video de presentación asociado a un comercioId.
 */
export const obtenerVideoComercioServicio = (
  comercioId?: string,
  urlFallback?: string
): string | null => {
  if (urlFallback && urlFallback.trim().length > 0) {
    return urlFallback.trim();
  }
  if (!comercioId) {
    return null;
  }
  return VIDEOS_COMERCIO_CATALOGO[comercioId] ?? null;
};

// Consultamos primero la API y guardamos una copia local como respaldo.
export const obtenerResenasPorComercio = async (comercioId: string): Promise<Resena[]> => {
  console.log('ROL 4 - Comercio consultado:', comercioId);
  inicializarBaseDeDatos();
  const pendientes = obtenerResenasLocales(comercioId);

  try {
    const resenasServidor = await listarResenasApi(comercioId);
    const resenasConvertidas = resenasServidor.map(convertirResenaApi);

    for (const resena of resenasConvertidas) {
      guardarResenaSincronizadaDB(resena);
    }

    const idsServidor = new Set(resenasConvertidas.map((resena) => resena.id));
    const pendientesSinDuplicar = pendientes.filter(
      (resena) => !idsServidor.has(resena.id)
    );

    return ordenarPorFechaDescendente([
      ...resenasConvertidas,
      ...pendientesSinDuplicar,
    ]);
  } catch (error) {
    console.warn('No se pudieron consultar las reseñas de la API:', error);

    const guardadas = obtenerResenasSincronizadasDB(comercioId);
    const idsGuardados = new Set(guardadas.map((resena) => resena.id));
    const pendientesSinDuplicar = pendientes.filter(
      (resena) => !idsGuardados.has(resena.id)
    );

    return ordenarPorFechaDescendente([
      ...pendientesSinDuplicar,
      ...guardadas,
    ]);
  }
};

export const calcularEstadisticasResenas = (resenas: Resena[]) => {
  if (!resenas || resenas.length === 0) {
    return { promedio: 0, total: 0 };
  }
  const suma = resenas.reduce((acc, curr) => acc + (curr.calificacion || 0), 0);
  const promedio = Number((suma / resenas.length).toFixed(1));
  return { promedio, total: resenas.length };
};

export const crearResena = async (
  datos: DatosNuevaResena
): Promise<Resena> => {
  if (datos.calificacion < 1 || datos.calificacion > 5) {
    throw new Error(
      'La calificación debe estar entre 1 y 5 estrellas.'
    );
  }

  inicializarBaseDeDatos();

  // Mientras no esté integrada la autenticación real,
  // conservamos la reseña en la cola offline.
  // No la marcamos como sincronizada con Docker.
  return guardarResenaPendiente(
    datos.calificacion,
    datos.comentario.trim(),
    datos.fotos ?? [],
    datos.comercioId,
    datos.usuarioId,
    datos.nombreUsuario.trim() || 'Vecino'
  );
};






export const crearResenaOffline = async (datos: DatosNuevaResena): Promise<Resena> => {
  if (datos.calificacion < 1 || datos.calificacion > 5) {
    throw new Error('La calificación debe estar entre 1 y 5 estrellas.');
  }

  inicializarBaseDeDatos();

  return guardarResenaPendiente(
    datos.calificacion,
    datos.comentario.trim(),
    datos.fotos ?? [],
    datos.comercioId,
    datos.usuarioId,
    datos.nombreUsuario.trim() || 'Vecino'
  );
};

export const editarResena = async (
  datos: DatosEditarResena,
  online = true
): Promise<Resena> => {
  if (datos.calificacion < 1 || datos.calificacion > 5) {
    throw new Error('La calificación debe estar entre 1 y 5 estrellas.');
  }

  inicializarBaseDeDatos();

  // 1. Verificar si es una reseña pendiente en la cola offline
  const pendientes = obtenerResenasLocales();
  const pendienteExistente = pendientes.find((p) => p.id === datos.id);

  if (pendienteExistente) {
    if (pendienteExistente.usuarioId !== datos.usuarioId) {
      throw new Error('Solo podés editar tus propias reseñas.');
    }
    actualizarResenaPendientePorClientId(
      datos.id,
      datos.calificacion,
      datos.comentario.trim(),
      datos.fotos
    );
    return {
      ...pendienteExistente,
      calificacion: datos.calificacion,
      comentario: datos.comentario.trim(),
      fotos: datos.fotos,
      pendienteSincronizacion: true,
    };
  }

  // 2. Si es una reseña sincronizada, validamos propiedad y actualizamos en SQLite
  if (online) {
    await esperarRedSimulada();
  }

  const sincronizadas = obtenerResenasSincronizadasDB();
  const existente = sincronizadas.find((r) => r.id === datos.id);

  if (!existente) {
    throw new Error('No se encontró la reseña que intentás editar.');
  }

  if (existente.usuarioId !== datos.usuarioId) {
    throw new Error('Solo podés editar tus propias reseñas.');
  }

  const actualizada: Resena = {
    ...existente,
    calificacion: datos.calificacion,
    comentario: datos.comentario.trim(),
    fotos: datos.fotos,
  };

  return guardarResenaSincronizadaDB(actualizada);
};

export const eliminarResenaServicio = async (
  id: string,
  usuarioId: string
): Promise<void> => {
  inicializarBaseDeDatos();

  // Si estaba en la cola de pendientes offline
  const pendientes = obtenerResenasLocales();
  const pendiente = pendientes.find((p) => p.id === id);
  if (pendiente) {
    if (pendiente.usuarioId !== usuarioId) {
      throw new Error('Solo podés eliminar tus propias reseñas.');
    }
    eliminarResenaPendientePorClientId(id);
    return;
  }

  await esperarRedSimulada();

  const sincronizadas = obtenerResenasSincronizadasDB();
  const existente = sincronizadas.find((r) => r.id === id);

  if (!existente) {
    throw new Error('La reseña ya no existe.');
  }

  if (existente.usuarioId !== usuarioId) {
    throw new Error('Solo podés eliminar tus propias reseñas.');
  }

  eliminarResenaSincronizadaDB(id);
};

export const reportarResenaServicio = async (
  id: string,
  motivo = 'Contenido ofensivo o inapropiado'
): Promise<Resena> => {
  inicializarBaseDeDatos();
  await esperarRedSimulada();

  const sincronizadas = obtenerResenasSincronizadasDB();
  const existente = sincronizadas.find((r) => r.id === id);

  if (!existente) {
    throw new Error('No se encontró la reseña a reportar.');
  }

  if (existente.reportada) {
    throw new Error('Esta reseña ya fue reportada anteriormente.');
  }

  const actualizada: Resena = {
    ...existente,
    reportada: true,
    motivoReporte: motivo.trim() || 'Contenido ofensivo o inapropiado',
    fechaReporte: new Date().toISOString(),
  };

  return guardarResenaSincronizadaDB(actualizada);
};

export const responderResenaServicio = async (
  id: string,
  comentarioRespuesta: string
): Promise<Resena> => {
  const textoLimpio = comentarioRespuesta.trim();
  if (!textoLimpio) {
    throw new Error('La respuesta del comercio no puede estar vacía.');
  }

  inicializarBaseDeDatos();
  await esperarRedSimulada();

  const sincronizadas = obtenerResenasSincronizadasDB();
  const existente = sincronizadas.find((r) => r.id === id);

  if (!existente) {
    throw new Error('No se encontró la reseña para responder.');
  }

  if (existente.respuestaComercio) {
    throw new Error('El comercio ya respondió a esta reseña (solo se permite una respuesta).');
  }

  const actualizada: Resena = {
    ...existente,
    respuestaComercio: {
      comentario: textoLimpio,
      fechaCreacion: new Date().toISOString(),
    },
  };

  return guardarResenaSincronizadaDB(actualizada);
};

// Sin token de la API no podemos enviar la cola offline de forma segura.
// Por eso, por ahora no marcamos ninguna reseña como sincronizada.

export const sincronizarResenasPendientes = async (
  comercioId?: string
): Promise<{ sincronizadas: number; errores: number }> => {
  inicializarBaseDeDatos();

  const pendientes = obtenerResenasLocales(comercioId);

  if (pendientes.length > 0) {
    console.log(
      `Hay ${pendientes.length} reseñas pendientes de enviar a la API.`
    );
  }

  // No marcamos ninguna reseña como sincronizada
  // hasta que la API confirme que fue recibida.
  return {
    sincronizadas: 0,
    errores: 0,
  };
};












const NOMBRES_COMERCIOS_CONOCIDOS: Record<string, string> = {
  '1': 'Café La Esquina',
  'cafe-la-esquina': 'Café La Esquina',
  'panaderia-la-esquina': 'Panadería La Esquina',
  'panaderia-el-sol': 'Panadería El Sol',
  'floreria-verde': 'Florería Verde',
  'cafe-jacaranda': 'Café Jacarandá',
  'farmacia-del-barrio': 'Farmacia del Barrio',
};

export const obtenerResenasPorUsuario = async (usuarioId: string): Promise<ResenaCuenta[]> => {
  inicializarBaseDeDatos();
  const todas = [
    ...obtenerResenasLocales(),
    ...obtenerResenasSincronizadasDB(),
  ];

  const delUsuario = ordenarPorFechaDescendente(
    todas.filter((r) => r.usuarioId === usuarioId)
  );

  return delUsuario.map((r) => ({
    id: r.id,
    comercioNombre: NOMBRES_COMERCIOS_CONOCIDOS[r.comercioId] ?? `Comercio #${r.comercioId}`,
    texto: `${'★'.repeat(r.calificacion)} — ${r.comentario || 'Sin comentario escrito'}`,
    fecha: new Date(r.fechaCreacion).toLocaleDateString(),
  }));
};

// Registramos automáticamente el proveedor de lectura para `/mis-resenas`
conectarConsultaResenas(obtenerResenasPorUsuario);