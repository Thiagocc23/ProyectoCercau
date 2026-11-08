import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { guardarResenaPendiente, obtenerResenasLocales, vaciarResenasPendientes } from '../../servicios/base-datos';
import { calcularEstadisticasResenas, obtenerResenasPorComercio } from '../../servicios/resenas';
import { Resena } from '../../tipos/resena';
import { ModalNuevaResena } from './modal-nueva-resena';
import TarjetaResena from './tarjeta-resena';
import { VideoPresentacion } from './video-presentacion';

interface Props {
  comercioId: string;
}

export const SeccionResenas: React.FC<Props> = ({ comercioId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [resenaEditando, setResenaEditando] = useState<Resena | null>(null);
  
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState({ promedio: 0, total: 0 });

  // --- LÓGICA DINÁMICA DE ROLES (CONFIGURADO COMO THIAGO CHAMORRO) ---
  const usuarioActivoId = 'usr-yo'; 
  const esDueñoDelComercio = usuarioActivoId === comercioId;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const data = await obtenerResenasPorComercio(comercioId);
        setResenas(data);
        setEstadisticas(calcularEstadisticasResenas(data));
      } catch (err) {
        setError('Ocurrió un error al cargar las opiniones.');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [comercioId]);

  useEffect(() => {
    const revisarSincronizacionOffline = async () => {
      try {
        const red = await Network.getNetworkStateAsync();

        if (red.isConnected && red.isInternetReachable) {
          const pendientes = obtenerResenasLocales();

          if (pendientes.length > 0) {
            setResenas((prev) => {
              const nuevasResenas = [...pendientes, ...prev];
              setEstadisticas(calcularEstadisticasResenas(nuevasResenas));
              return nuevasResenas;
            });
            vaciarResenasPendientes();
            Alert.alert(
              'Sincronización completa',
              'Tus reseñas guardadas sin conexión se han sincronizado.'
            );
          }
        }
      } catch (error) {
        console.error('Error al verificar red:', error);
      }
    };

    revisarSincronizacionOffline();
  }, []);

  const abrirParaNueva = () => {
    setResenaEditando(null);
    setModalVisible(true);
  };

  const abrirParaEditar = (resena: Resena) => {
    setResenaEditando(resena);
    setModalVisible(true);
  };

  const eliminarResena = (id: string) => {
    Alert.alert(
      'Eliminar reseña',
      '¿Estás seguro de que querés eliminar esta reseña?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setResenas((prev) => {
              const actualizadas = prev.filter((r) => r.id !== id);
              setEstadisticas(calcularEstadisticasResenas(actualizadas));
              return actualizadas;
            });
            Alert.alert('Reseña eliminada', 'Tu reseña se eliminó correctamente.');
          },
        },
      ]
    );
  };

  const reportarResena = (id: string) => {
    Alert.alert('Reporte enviado', 'Gracias. La reseña ha sido reportada y un administrador la revisará.');
  };

  const responderResena = (id: string, respuesta: string) => {
    setResenas((prev) => 
      prev.map((r) => 
        r.id === id 
          ? { 
              ...r, 
              respuestaComercio: {
                comentario: respuesta,
                fechaCreacion: new Date().toISOString()
              } 
            } 
          : r
      )
    );
  };

  const handlePublicar = async (calificacion: number, comentario: string, fotos: string[]) => {
    try {
      const red = await Network.getNetworkStateAsync();

      if (red.isConnected && red.isInternetReachable) {
        const nuevaResena: Resena = {
          id: resenaEditando ? resenaEditando.id : Date.now().toString(),
          usuarioId: 'usr-yo', // <-- Corregido a tu usuario real
          nombreUsuario: 'Thiago Chamorro', // <-- Corregido a tu nombre real
          comercioId: comercioId,
          calificacion,
          comentario,
          fotos,
          fechaCreacion: new Date().toISOString(),
        };

        if (resenaEditando) {
          setResenas((prev) => {
            const actualizadas = prev.map((r) => (r.id === nuevaResena.id ? nuevaResena : r));
            setEstadisticas(calcularEstadisticasResenas(actualizadas));
            return actualizadas;
          });
          Alert.alert('Reseña actualizada', 'Tu reseña se actualizó correctamente.');
        } else {
          setResenas((prev) => {
            const actualizadas = [nuevaResena, ...prev];
            setEstadisticas(calcularEstadisticasResenas(actualizadas));
            return actualizadas;
          });
          Alert.alert('Éxito', '¡Reseña publicada online con éxito!');
        }
      } else {
        guardarResenaPendiente(calificacion, comentario, fotos);
        Alert.alert('Modo sin conexión', 'Tu reseña se guardó localmente y se subirá cuando recuperes internet.');
      }

      setModalVisible(false);
      setResenaEditando(null);
    } catch (error) {
      console.error('Error al guardar la reseña:', error);
      Alert.alert('Error', 'Hubo un problema al intentar guardar la reseña.');
    }
  };

  return (
    <View style={styles.contenedor}>
      <VideoPresentacion nombreComercio="Café La Esquina" />

      <View style={styles.encabezado}>
        <View>
          <Text style={styles.titulo}>Opiniones y Reseñas</Text>
          <View style={styles.estadisticasFila}>
            <Text style={styles.textoPromedio}>{estadisticas.promedio}</Text>
            <Text style={styles.estrellaPromedio}>★</Text>
            <Text style={styles.textoTotal}>({estadisticas.total} calificaciones)</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.botonOpinar} onPress={abrirParaNueva}>
          <Text style={styles.textoBotonOpinar}>+ Opinar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lista}>
        {cargando ? (
          <ActivityIndicator size="large" color="#059669" />
        ) : error ? (
          <Text style={styles.textoVacio}>{error}</Text>
        ) : resenas.length > 0 ? (
          resenas.map((resena) => (
            <TarjetaResena
              key={resena.id}
              resena={resena}
              esComercio={esDueñoDelComercio} // <-- Corregido para usar la variable dinámica en lugar de true fijo
              usuarioActivoId={usuarioActivoId}
              onEditar={abrirParaEditar}
              onEliminar={eliminarResena}
              onReportar={reportarResena}
              onResponder={responderResena}
            />
          ))
        ) : (
          <Text style={styles.textoVacio}>Aún no hay opiniones. ¡Sé el primero en comentar!</Text>
        )}
      </View>

      <ModalNuevaResena
        visible={modalVisible}
        resenaInicial={resenaEditando}
        onCerrar={() => {
          setModalVisible(false);
          setResenaEditando(null);
        }}
        onPublicar={handlePublicar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  estadisticasFila: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  textoPromedio: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  estrellaPromedio: { color: '#fbbf24', fontSize: 16, marginHorizontal: 4 },
  textoTotal: { color: '#9ca3af', fontSize: 14 },
  botonOpinar: { backgroundColor: '#059669', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  textoBotonOpinar: { color: '#ffffff', fontWeight: 'bold' },
  lista: { gap: 12 },
  textoVacio: { color: '#9ca3af', textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
});