import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  eliminarFotoComercioDB,
  guardarFotoComercioDB,
  obtenerFotosComercioDB
} from './base-datos';

/**
 * Guarda una imagen temporal (como la que devuelve expo-image-picker)
 * de manera permanente en el directorio de documentos local de la app
 * utilizando la API moderna de expo-file-system: File, Directory y Paths.
 */
export const guardarFotoLocalmente = async (
  uriTemporal: string,
  subcarpeta = 'resenas-fotos'
): Promise<string> => {
  if (Platform.OS === 'web') {
    return uriTemporal;
  }

  try {
    const directorioDestino = new Directory(Paths.document, subcarpeta);

    if (!directorioDestino.exists) {
      directorioDestino.create();
    }

    const extension = uriTemporal.split('.').pop()?.split('?')[0] || 'jpg';
    const extensionLimpia = /^(jpg|jpeg|png|heic|webp)$/i.test(extension)
      ? extension.toLowerCase()
      : 'jpg';

    const nombreArchivo = `foto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${extensionLimpia}`;
    const archivoDestino = new File(directorioDestino, nombreArchivo);
    const archivoOrigen = new File(uriTemporal);

    archivoOrigen.copy(archivoDestino);

    return archivoDestino.uri;
  } catch (error) {
    console.error('Error al guardar la foto localmente con expo-file-system:', error);
    return uriTemporal;
  }
};

/**
 * Guarda una fotografía para la ficha de un comercio en la carpeta local `comercios-fotos`
 * utilizando File, Directory y Paths, y persiste la relación (comercioId, uri) en SQLite.
 */
export const guardarFotoComercio = async (
  comercioId: string,
  uriTemporal: string
): Promise<string> => {
  const uriPermanente = await guardarFotoLocalmente(uriTemporal, 'comercios-fotos');
  guardarFotoComercioDB(comercioId, uriPermanente);
  return uriPermanente;
};

/**
 * Obtiene todas las fotografías locales guardadas en SQLite para la ficha de un comercio.
 */
export const obtenerFotosComercio = async (comercioId: string): Promise<string[]> => {
  return obtenerFotosComercioDB(comercioId);
};

/**
 * Elimina la asociación y archivo de una fotografía de la ficha del comercio.
 */
export const eliminarFotoComercio = async (
  comercioId: string,
  uri: string
): Promise<void> => {
  eliminarFotoComercioDB(comercioId, uri);
};