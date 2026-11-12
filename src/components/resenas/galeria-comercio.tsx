import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import {
  eliminarFotoComercio,
  guardarFotoComercio,
  obtenerFotosComercio,
} from '../../servicios/persistencia-fotos';

interface Props {
  comercioId: string;
  nombreComercio?: string;
}

export const GaleriaComercio: React.FC<Props> = ({
  comercioId,
  nombreComercio = 'el comercio',
}) => {
  const theme = useTheme();
  const [fotos, setFotos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoSeleccionadaModal, setFotoSeleccionadaModal] = useState<string | null>(null);

  const cargarFotos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const lista = await obtenerFotosComercio(comercioId);
      setFotos(lista);
    } catch {
      setError('No se pudieron cargar las fotografías del comercio.');
    } finally {
      setCargando(false);
    }
  }, [comercioId]);

  useEffect(() => {
    void cargarFotos();
  }, [cargarFotos]);

  const seleccionarYGuardarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tus fotos para cargar imágenes en la ficha del comercio.'
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets.length > 0) {
        setGuardando(true);
        const uriTemporal = resultado.assets[0].uri;
        await guardarFotoComercio(comercioId, uriTemporal);
        const listaActualizada = await obtenerFotosComercio(comercioId);
        setFotos(listaActualizada);
        Alert.alert(
          'Foto agregada',
          'La fotografía se guardó correctamente en la ficha del comercio y en SQLite.'
        );
      }
    } catch (err) {
      console.error('Error al cargar foto del comercio:', err);
      Alert.alert('Error', 'Hubo un problema al guardar la fotografía del comercio.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarFoto = (uri: string) => {
    Alert.alert(
      'Eliminar fotografía',
      '¿Querés eliminar esta foto de la ficha del comercio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await eliminarFotoComercio(comercioId, uri);
                const listaActualizada = await obtenerFotosComercio(comercioId);
                setFotos(listaActualizada);
                setFotoSeleccionadaModal(null);
                Alert.alert('Eliminada', 'La foto fue eliminada.');
              } catch {
                Alert.alert('Error', 'No se pudo eliminar la fotografía.');
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={styles.columnaTitulo}>
          <Text style={[styles.titulo, { color: theme.text }]}>Fotografías</Text>
          <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>
            Ficha de {nombreComercio}
          </Text>
        </View>
        <TouchableOpacity
          disabled={guardando}
          style={[styles.botonCargar, { backgroundColor: theme.forest, opacity: guardando ? 0.6 : 1 }]}
          onPress={() => void seleccionarYGuardarFoto()}>
          <Text style={[styles.textoBotonCargar, { color: theme.onForest }]}>
            {guardando ? 'Guardando...' : '+ Cargar foto'}
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.contenedorCarga}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.textoEstado, { color: theme.textSecondary }]}>
            Cargando fotos...
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
            onPress={() => void cargarFotos()}>
            <Text style={[styles.textoBotonCargar, { color: theme.onForest }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : fotos.length > 0 ? (
        <View style={styles.galeriaGrid}>
          {fotos.map((uri, index) => (
            <TouchableOpacity
              key={`${uri}-${index}`}
              activeOpacity={0.8}
              onPress={() => setFotoSeleccionadaModal(uri)}>
              <Image
                source={{ uri }}
                style={[styles.fotoGrid, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.contenedorVacio,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoVacio, { color: theme.textSecondary }]}>
            El comercio aún no tiene fotografías en su ficha. ¡Sé el primero en agregar una!
          </Text>
        </View>
      )}

      {/* Modal para ver la foto a tamaño completo o eliminarla */}
      {fotoSeleccionadaModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={[styles.modalFondo, { backgroundColor: theme.overlay }]}>
            <View
              style={[
                styles.modalContenedor,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Image source={{ uri: fotoSeleccionadaModal }} style={styles.fotoModalVista} />
              <View style={styles.modalBotonesFila}>
                <TouchableOpacity
                  style={[styles.modalBotonEliminar, { backgroundColor: theme.error }]}
                  onPress={() => confirmarEliminarFoto(fotoSeleccionadaModal)}>
                  <Text style={styles.textoBotonBlanco}>Eliminar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBotonCerrar, { backgroundColor: theme.forest }]}
                  onPress={() => setFotoSeleccionadaModal(null)}>
                  <Text style={[styles.textoBotonBlanco, { color: theme.onForest }]}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 20,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  columnaTitulo: {
    flex: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 13,
    marginTop: 2,
  },
  botonCargar: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  textoBotonCargar: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  contenedorCarga: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  textoEstado: {
    fontSize: 13,
  },
  contenedorError: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  textoError: {
    fontSize: 13,
  },
  botonReintentar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  contenedorVacio: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  galeriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fotoGrid: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalFondo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContenedor: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 14,
  },
  fotoModalVista: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  modalBotonesFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  modalBotonEliminar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalBotonCerrar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  textoBotonBlanco: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
