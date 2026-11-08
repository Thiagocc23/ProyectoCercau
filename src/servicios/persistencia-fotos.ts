import { Directory, File, Paths } from 'expo-file-system';

/**
 * Guarda una imagen temporal (como la que devuelve expo-image-picker) 
 * de manera permanente en el directorio de documentos local de la app.
 */
export const guardarFotoLocalmente = async (uriTemporal: string): Promise<string> => {
  try {
    // Definimos el directorio de documentos usando Paths
    const directorioDestino = new Directory(Paths.document, 'resenas-fotos');
    
    // Si la carpeta no existe, la creamos
    if (!directorioDestino.exists) {
      directorioDestino.create();
    }

    // Generamos un nombre único para la foto basado en la fecha actual
    const nombreArchivo = `foto_${Date.now()}.jpg`;
    const archivoDestino = new File(directorioDestino, nombreArchivo);

    // Creamos un objeto File apuntando a la uri temporal de origen
    const archivoOrigen = new File(uriTemporal);

    // Copiamos el archivo temporal al destino definitivo
    archivoOrigen.copy(archivoDestino);

    // Retornamos la ruta local permanente lista para guardarse en la reseña y mostrarse con <Image>
    return archivoDestino.uri;
  } catch (error) {
    console.error('Error al guardar la foto localmente:', error);
    // Si falla por algún motivo, devolvemos la URI original para no romper el flujo
    return uriTemporal;
  }
};