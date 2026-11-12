import * as Network from 'expo-network';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';
import {
  calcularEstadisticasResenas,
  crearResena,
  crearResenaOffline,
  editarResena,
  eliminarResenaServicio,
  obtenerResenasPorComercio,
  reportarResenaServicio,
  responderResenaServicio,
  sincronizarResenasPendientes
} from '../../servicios/resenas';
import { Resena } from '../../tipos/resena';
import { GaleriaComercio } from './galeria-comercio';
import { ModalNuevaResena } from './modal-nueva-resena';
import { ResumenCalificaciones } from './resumen-calificaciones';
import TarjetaResena from './tarjeta-resena';
import { VideoPresentacion } from './video-presentacion';

interface Props {
  comercioId: string;
}

type ModoPruebaRol = 'vecino' | 'comercio';

function tieneConexionActiva(red: Network.NetworkState): boolean {
  return Boolean(red.isConnected && red.isInternetReachable !== false);
}

export const SeccionResenas: React.FC<Props> = ({ comercioId }) => {
  const theme = useTheme();
  const { usuario } = useAutenticacion();

  const [modalVisible, setModalVisible] = useState(false);
  const [resenaEditando, setResenaEditando] = useState<Resena | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState({ promedio: 0, total: 0 });

  // Selector de demostración para probar el Rol 4
  const [rolDemo, setRolDemo] = useState<ModoPruebaRol>('vecino');

  // Se permite el modo de prueba si no hay sesión o si
  // la cuenta es comercio pero todavía no tiene comercioId.
  const puedeUsarModoDemo =
    !usuario ||
    (usuario.rol === 'comercio' && !usuario.comercioId);
  const usuarioActivoId = usuario ? usuario.id : 'usr-yo';
  const nombreUsuarioActivo = usuario ? usuario.nombre : 'Thiago Chamorro';
  const esDueñoDelComercio =
    usuario?.rol === 'comercio' && usuario.comercioId
      ? usuario.comercioId === comercioId ||
        (comercioId === '1' && Boolean(usuario.comercioId))
      : puedeUsarModoDemo && rolDemo === 'comercio';
  const cargarResenas = useCallback(
    async (mostrarIndicador = true) => {
      try {
        if (mostrarIndicador) {
          setCargando(true);
        }
        setError(null);
        // 1. Verificamos si hay internet para sincronizar las pendientes de SQLite ANTES de listar
        try {
          const estadoRed = await Network.getNetworkStateAsync();
          if (tieneConexionActiva(estadoRed)) {
            const resultadoSync = await sincronizarResenasPendientes(comercioId);
            if (resultadoSync.sincronizadas > 0) {
              Alert.alert(
                'Sincronización completa',
                `Se ${
                  resultadoSync.sincronizadas === 1
                    ? 'sincronizó 1 reseña guardada'
                    : `sincronizaron ${resultadoSync.sincronizadas} reseñas guardadas`
                } sin conexión.`
              );
            }
          }
        } catch (errRed) {
          console.error('Error al verificar red durante carga:', errRed);
        }

        // 2. Cargamos el listado actualizado desde el servicio (persistido en SQLite)
        const data = await obtenerResenasPorComercio(comercioId);
        setResenas(data);
        setEstadisticas(calcularEstadisticasResenas(data));
      } catch {
        setError('Ocurrió un error al cargar las opiniones.');
      } finally {
        setCargando(false);
      }
    },
    [comercioId]
  );

  useEffect(() => {
    let activo = true;

    const iniciarCarga = async () => {
      await Promise.resolve();

      if (activo) {
        await cargarResenas(true);
      }
    };

    void iniciarCarga();

    return () => {
      activo = false;
    };
  }, [cargarResenas]);

  // Escucha automáticamente cuando el teléfono recupera la conexión a Internet
  useEffect(() => {
    const suscripcion = Network.addNetworkStateListener((estadoRed) => {
      if (tieneConexionActiva(estadoRed)) {
        void (async () => {
          const resultado = await sincronizarResenasPendientes(comercioId);
          if (resultado.sincronizadas > 0) {
            const data = await obtenerResenasPorComercio(comercioId);
            setResenas(data);
            setEstadisticas(calcularEstadisticasResenas(data));
            Alert.alert(
              'Sincronización completa',
              'Tus reseñas guardadas sin conexión se han sincronizado.'
            );
          }
        })();
      }
    });

    return () => {
      suscripcion.remove();
    };
  }, [comercioId]);

  const abrirParaNueva = () => {
    setResenaEditando(null);
    setModalVisible(true);
  };

  const abrirParaEditar = (resena: Resena) => {
    setResenaEditando(resena);
    setModalVisible(true);
  };

  const eliminarResena = (id: string) => {
    Alert.alert('Eliminar reseña', '¿Estás seguro de que querés eliminar esta reseña?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await eliminarResenaServicio(id, usuarioActivoId);
              const actualizadas = await obtenerResenasPorComercio(comercioId);
              setResenas(actualizadas);
              setEstadisticas(calcularEstadisticasResenas(actualizadas));
              Alert.alert('Reseña eliminada', 'Tu reseña se eliminó correctamente.');
            } catch (err) {
              const mensaje =
                err instanceof Error ? err.message : 'No se pudo eliminar la reseña.';
              Alert.alert('Error', mensaje);
            }
          })();
        },
      },
    ]);
  };

  const reportarResena = (id: string) => {
    Alert.alert(
      'Reportar reseña ofensiva',
      '¿Querés reportar esta reseña por contenido ofensivo o inapropiado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await reportarResenaServicio(id, 'Contenido ofensivo o inapropiado');
                const actualizadas = await obtenerResenasPorComercio(comercioId);
                setResenas(actualizadas);
                Alert.alert(
                  'Reporte registrado',
                  'Gracias. La reseña quedó marcada como reportada para su moderación.'
                );
              } catch (err) {
                const mensaje =
                  err instanceof Error ? err.message : 'No se pudo registrar el reporte.';
                Alert.alert('Aviso', mensaje);
              }
            })();
          },
        },
      ]
    );
  };

  const responderResena = (id: string, respuesta: string) => {
    void (async () => {
      try {
        await responderResenaServicio(id, respuesta);
        const actualizadas = await obtenerResenasPorComercio(comercioId);
        setResenas(actualizadas);
        Alert.alert('Respuesta publicada', 'Tu respuesta única como comercio fue registrada.');
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'No se pudo publicar la respuesta.';
        Alert.alert('Error', mensaje);
      }
    })();
  };

  const handlePublicar = async (calificacion: number, comentario: string, fotos: string[]) => {
    try {
      setGuardando(true);
      const red = await Network.getNetworkStateAsync();
      const online = tieneConexionActiva(red);

      if (resenaEditando) {
        await editarResena(
          {
            id: resenaEditando.id,
            usuarioId: usuarioActivoId,
            calificacion,
            comentario,
            fotos,
          },
          online
        );
        const actualizadas = await obtenerResenasPorComercio(comercioId);
        setResenas(actualizadas);
        setEstadisticas(calcularEstadisticasResenas(actualizadas));
        Alert.alert('Reseña actualizada', 'Tu reseña se actualizó correctamente.');
      } else if (online) {
        await crearResena({
          comercioId,
          usuarioId: usuarioActivoId,
          nombreUsuario: nombreUsuarioActivo,
          calificacion,
          comentario,
          fotos,
        });
        const actualizadas = await obtenerResenasPorComercio(comercioId);
        setResenas(actualizadas);
        setEstadisticas(calcularEstadisticasResenas(actualizadas));
        Alert.alert('Reseña guardada',
        'Tu reseña se guardó en el dispositivo y está pendiente de enviarse al servidor.');
      } else {
        await crearResenaOffline({
          comercioId,
          usuarioId: usuarioActivoId,
          nombreUsuario: nombreUsuarioActivo,
          calificacion,
          comentario,
          fotos,
        });
        const actualizadas = await obtenerResenasPorComercio(comercioId);
        setResenas(actualizadas);
        setEstadisticas(calcularEstadisticasResenas(actualizadas));
        Alert.alert(
          'Modo sin conexión',
          'Tu reseña se guardó localmente en SQLite. Quedará pendiente hasta que esté habilitada la sincronización con el servidor.'
        );
      }

      setModalVisible(false);
      setResenaEditando(null);
    } catch (err) {
      console.error('Error al guardar la reseña:', err);
      const mensaje =
        err instanceof Error ? err.message : 'Hubo un problema al intentar guardar la reseña.';
      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const pendientesCount = resenas.filter((r) => r.pendienteSincronizacion).length;

  return (
    <View style={styles.contenedor}>
      {/* Video de presentación asociado al comercio */}
      <VideoPresentacion comercioId={comercioId} nombreComercio="Café La Esquina" />

      {/* Galería de Fotografías de la ficha del comercio */}
      <GaleriaComercio comercioId={comercioId} nombreComercio="Café La Esquina" />

      {/* Selector de demostración exclusivo para pruebas independientes cuando no hay sesión iniciada */}
      {puedeUsarModoDemo && (
        <View
          style={[
            styles.barraDemo,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoDemo, { color: theme.textSecondaryStrong }]}>
            Modo prueba Rol 4:
          </Text>
          <View style={styles.botonesDemo}>
            <TouchableOpacity
              onPress={() => setRolDemo('vecino')}
              style={[
                styles.chipDemo,
                {
                  backgroundColor:
                    rolDemo === 'vecino' ? theme.forest : theme.backgroundSelected,
                },
              ]}>
              <Text
                style={[
                  styles.textoChipDemo,
                  { color: rolDemo === 'vecino' ? theme.onForest : theme.text },
                ]}>
                Vecino (Thiago)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRolDemo('comercio')}
              style={[
                styles.chipDemo,
                {
                  backgroundColor:
                    rolDemo === 'comercio' ? theme.forest : theme.backgroundSelected,
                },
              ]}>
              <Text
                style={[
                  styles.textoChipDemo,
                  { color: rolDemo === 'comercio' ? theme.onForest : theme.text },
                ]}>
                Dueño del comercio
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {pendientesCount > 0 && (
        <View
          style={[
            styles.avisoPendientes,
            { backgroundColor: theme.promotionBackground, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoAvisoPendientes, { color: theme.promotion }]}>
            Tenés {pendientesCount}{' '}
            {pendientesCount === 1 ? 'reseña guardada' : 'reseñas guardadas'} sin conexión en
            SQLite.
          </Text>
          <TouchableOpacity onPress={() => void cargarResenas(false)}>
            <Text style={[styles.linkSincronizar, { color: theme.actionText }]}>
              Sincronizar ahora
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.encabezado}>
        <Text style={[styles.titulo, { color: theme.text }]}>Opiniones y Reseñas</Text>
        <TouchableOpacity
          style={[styles.botonOpinar, { backgroundColor: theme.forest }]}
          onPress={abrirParaNueva}>
          <Text style={[styles.textoBotonOpinar, { color: theme.onForest }]}>+ Opinar</Text>
        </TouchableOpacity>
      </View>

      <ResumenCalificaciones promedio={estadisticas.promedio} total={estadisticas.total} />

      <View style={styles.lista}>
        {cargando ? (
          <View style={styles.contenedorEstado}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.textoEstado, { color: theme.textSecondary }]}>
              Cargando opiniones...
            </Text>
          </View>
        ) : error ? (
          <View
            style={[
              styles.contenedorError,
              { backgroundColor: theme.errorBackground, borderColor: theme.border },
            ]}>
            <Text style={[styles.textoError, { color: theme.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.botonReintentar, { backgroundColor: theme.forest }]}
              onPress={() => void cargarResenas(true)}>
              <Text style={[styles.textoBotonOpinar, { color: theme.onForest }]}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : resenas.length > 0 ? (
          resenas.map((resena) => (
            <TarjetaResena
              key={resena.id}
              resena={resena}
              esComercio={esDueñoDelComercio}
              usuarioActivoId={usuarioActivoId}
              onEditar={abrirParaEditar}
              onEliminar={eliminarResena}
              onReportar={reportarResena}
              onResponder={responderResena}
            />
          ))
        ) : (
          <Text style={[styles.textoVacio, { color: theme.textSecondary }]}>
            Aún no hay opiniones para este comercio. ¡Sé el primero en comentar!
          </Text>
        )}
      </View>

      <ModalNuevaResena
        visible={modalVisible}
        resenaInicial={resenaEditando}
        guardando={guardando}
        onCerrar={() => {
          if (!guardando) {
            setModalVisible(false);
            setResenaEditando(null);
          }
        }}
        onPublicar={handlePublicar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  barraDemo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  textoDemo: {
    fontSize: 12,
    fontWeight: '600',
  },
  botonesDemo: {
    flexDirection: 'row',
    gap: 6,
  },
  chipDemo: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  textoChipDemo: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  avisoPendientes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  textoAvisoPendientes: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  linkSincronizar: {
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  botonOpinar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  textoBotonOpinar: { fontWeight: 'bold' },
  lista: { gap: 12 },
  contenedorEstado: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  textoEstado: {
    fontSize: 14,
  },
  contenedorError: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  textoError: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  botonReintentar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  textoVacio: { textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
});