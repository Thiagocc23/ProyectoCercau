import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface Props {
  videoUrl?: string;
  nombreComercio?: string;
}

// Video MP4 directo de cafetería optimizado y con CORS abierto
const VIDEO_CAFE_URL =
  'https://assets.mixkit.co/videos/4385/4385-720.mp4';

export const VideoPresentacion: React.FC<Props> = ({
  videoUrl = VIDEO_CAFE_URL,
  nombreComercio = 'Café La Esquina',
}) => {
  const [errorCarga, setErrorCarga] = useState(false);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.muted = false;
  });

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Conocé {nombreComercio}</Text>
      <Text style={styles.subtitulo}>Video de presentación</Text>

      <View style={styles.marcoVideo}>
        {Platform.OS === 'web' ? (
          <video
            src={videoUrl}
            controls
            playsInline
            preload="auto"
            onError={() => setErrorCarga(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000000',
            }}
          />
        ) : (
          <VideoView
            style={styles.video}
            player={player}
            nativeControls={true}
            allowsPictureInPicture={true}
          />
        )}
      </View>

      {errorCarga && (
        <Text style={styles.textoError}>
          No se pudo reproducir el video. Revisa la conexión a internet.
        </Text>
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
    color: '#ffffff',
  },
  subtitulo: {
    fontSize: 13,
    color: '#9ca3af',
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
    borderColor: '#264232',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  textoError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
  },
});