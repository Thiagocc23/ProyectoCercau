import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { obtenerVideoComercioServicio } from '../../servicios/resenas';

interface Props {
  comercioId?: string;
  videoUrl?: string;
  nombreComercio?: string;
}

export const VideoPresentacion: React.FC<Props> = ({
  comercioId = '1',
  videoUrl,
  nombreComercio = 'el comercio',
}) => {
  const theme = useTheme();

  const urlFinal = obtenerVideoComercioServicio(comercioId, videoUrl);
  const [cargando, setCargando] = useState(Boolean(urlFinal));
  const [errorCarga, setErrorCarga] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Instanciamos el reproductor de expo-video con la fuente determinada por el comercio

  const player = useVideoPlayer(urlFinal ?? null, (p) => {
    p.loop = false;
    p.muted = false;
  });


  // Escuchamos los cambios de estado del reproductor en nativo.
useEffect(() => {
  if (Platform.OS === 'web' || !urlFinal) return;

  const suscripcion = player.addListener(
    'statusChange',
    ({ status, error }) => {
      if (status === 'loading') {
        setCargando(true);
        setErrorCarga(false);
        setMensajeError(null);
      } else if (status === 'readyToPlay') {
        setCargando(false);
        setErrorCarga(false);
        setMensajeError(null);
      } else if (status === 'error') {
        setCargando(false);
        setErrorCarga(true);
        setMensajeError(
          error?.message ||
            'Ocurrió un error al intentar reproducir el video.'
        );
      }
    }
  );

  return () => {
    suscripcion.remove();
  };
}, [player, urlFinal]);





  const reintentarCarga = async () => {
    if (!urlFinal) return;
    setErrorCarga(false);
    setCargando(true);
    setMensajeError(null);

    try {
      if (Platform.OS !== 'web') {
        await player.replaceAsync(urlFinal);
      }
    } catch {
      setErrorCarga(true);
      setCargando(false);
      setMensajeError('No se pudo reintentar la reproducción del video.');
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.titulo, { color: theme.text }]}>Conocé {nombreComercio}</Text>
      <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>
        Video de presentación
      </Text>

      <View style={[styles.marcoVideo, { borderColor: theme.border }]}>
        {!urlFinal ? (
          <View
            style={[
              styles.contenedorSinVideo,
              { backgroundColor: theme.backgroundElement },
            ]}>
            <Text style={[styles.textoSinVideo, { color: theme.textSecondary }]}>
              Este comercio aún no tiene un video de presentación configurado.
            </Text>
          </View>
        ) : Platform.OS === 'web' ? (
          <View style={styles.contenedorWeb}>
            {cargando && !errorCarga && (
              <View style={styles.overlayCarga}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.textoCargando, { color: '#FFFFFF' }]}>
                  Cargando video...
                </Text>
              </View>
            )}
            <video
              src={urlFinal}
              controls
              playsInline
              preload="metadata"
              onLoadStart={() => setCargando(true)}
              onCanPlay={() => {
                setCargando(false);
                setErrorCarga(false);
              }}
              onError={() => {
                setCargando(false);
                setErrorCarga(true);
                setMensajeError('No se pudo reproducir el video en el navegador.');
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#000000',
              }}
            />
          </View>
        ) : (
          <View style={styles.contenedorNativo}>
            <VideoView
              style={styles.video}
              player={player}
              nativeControls={true}
              allowsPictureInPicture={true}
            />

            {cargando && !errorCarga && (
              <View style={styles.overlayCarga}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.textoCargando, { color: '#FFFFFF' }]}>
                  Cargando video...
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {errorCarga && (
        <View
          style={[
            styles.contenedorError,
            { backgroundColor: theme.errorBackground, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoError, { color: theme.error }]}>
            {mensajeError || 'No se pudo reproducir el video.'}
          </Text>
          <TouchableOpacity
            style={[styles.botonReintentar, { backgroundColor: theme.forest }]}
            onPress={() => void reintentarCarga()}>
            <Text style={[styles.textoBotonReintentar, { color: theme.onForest }]}>
              Reintentar reproducción
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default VideoPresentacion;

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 13,
    marginBottom: 10,
    marginTop: 2,
  },
  marcoVideo: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  contenedorSinVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textoSinVideo: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contenedorWeb: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  contenedorNativo: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlayCarga: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  textoCargando: {
    fontSize: 13,
    fontWeight: '600',
  },
  contenedorError: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  textoError: {
    fontSize: 13,
    flex: 1,
  },
  botonReintentar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  textoBotonReintentar: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});