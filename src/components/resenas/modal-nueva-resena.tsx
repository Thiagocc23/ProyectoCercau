import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { guardarFotoLocalmente } from '../../servicios/persistencia-fotos';
import { Resena } from '../../tipos/resena';

interface Props {
  visible: boolean;
  resenaInicial?: Resena | null;
  onCerrar: () => void;
  onPublicar: (calificacion: number, comentario: string, fotos: string[]) => void;
}

export const ModalNuevaResena: React.FC<Props> = ({ 
  visible, 
  resenaInicial, 
  onCerrar, 
  onPublicar 
}) => {
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);

  useEffect(() => {
    if (resenaInicial) {
      setCalificacion(resenaInicial.calificacion);
      setComentario(resenaInicial.comentario || '');
      setFotos(resenaInicial.fotos || []);
    } else {
      setCalificacion(5);
      setComentario('');
      setFotos([]);
    }
  }, [resenaInicial, visible]);

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Necesitamos permiso para acceder a tus fotos');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      const uriTemporal = resultado.assets[0].uri;
      const uriPermanente = await guardarFotoLocalmente(uriTemporal);
      setFotos([...fotos, uriPermanente]);
    }
  };

  const eliminarFoto = (indexAEliminar: number) => {
    const nuevasFotos = fotos.filter((_, index) => index !== indexAEliminar);
    setFotos(nuevasFotos);
  };

  const handleGuardar = () => {
    onPublicar(calificacion, comentario, fotos);
    onCerrar();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.fondoModal}>
        <View style={styles.contenedorModal}>
          <Text style={styles.tituloModal}>
            {resenaInicial ? 'Editar opinión' : 'Nueva opinión'}
          </Text>

          <Text style={styles.label}>Calificación:</Text>
          <View style={styles.contenedorEstrellas}>
            {[1, 2, 3, 4, 5].map((estrella) => (
              <TouchableOpacity key={estrella} onPress={() => setCalificacion(estrella)}>
                <Text style={[styles.estrella, calificacion >= estrella && styles.estrellaActiva]}>
                  {calificacion >= estrella ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Comentario:</Text>
          <TextInput
            style={styles.inputComentario}
            multiline
            numberOfLines={4}
            placeholder="¿Qué te pareció el lugar?"
            placeholderTextColor="#9ca3af"
            value={comentario}
            onChangeText={setComentario}
          />

          <View style={styles.seccionFotos}>
            <TouchableOpacity style={styles.botonFoto} onPress={seleccionarImagen}>
              <Text style={styles.textoBotonFoto}>+ Adjuntar foto</Text>
            </TouchableOpacity>
            
            <View style={styles.galeriaMiniaturas}>
              {fotos.map((uri, index) => (
                <View key={index} style={styles.contenedorMiniatura}>
                  <Image source={{ uri }} style={styles.miniatura} />
                  
                  <TouchableOpacity 
                    style={styles.botonEliminarFoto}
                    onPress={() => eliminarFoto(index)}
                  >
                    <Text style={styles.textoEliminarFoto}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.filaBotones}>
            <TouchableOpacity style={styles.botonCancelar} onPress={onCerrar}>
              <Text style={styles.textoBotonSecundario}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.botonPublicar} onPress={handleGuardar}>
              <Text style={styles.textoBotonPrincipal}>
                {resenaInicial ? 'Guardar cambios' : 'Publicar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fondoModal: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  contenedorModal: {
    width: '90%', backgroundColor: '#1b2e23', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#374151',
  },
  tituloModal: {
    fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 20, textAlign: 'center',
  },
  label: {
    fontSize: 14, color: '#d1d5db', marginBottom: 8,
  },
  contenedorEstrellas: {
    flexDirection: 'row', marginBottom: 20, justifyContent: 'center',
  },
  estrella: {
    fontSize: 32, color: '#4b5563', marginHorizontal: 4,
  },
  estrellaActiva: {
    color: '#fbbf24',
  },
  inputComentario: {
    backgroundColor: '#374151', color: '#ffffff', borderRadius: 8, padding: 12, textAlignVertical: 'top', fontSize: 15, minHeight: 100, marginBottom: 20,
  },
  seccionFotos: {
    marginBottom: 20,
  },
  botonFoto: {
    backgroundColor: '#374151', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10,
  },
  textoBotonFoto: {
    color: '#d1d5db', fontSize: 13,
  },
  galeriaMiniaturas: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  contenedorMiniatura: {
    position: 'relative',
  },
  miniatura: {
    width: 60, height: 60, borderRadius: 8, backgroundColor: '#4b5563',
  },
  botonEliminarFoto: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoEliminarFoto: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filaBotones: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
  },
  botonCancelar: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
  },
  botonPublicar: {
    backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
  },
  textoBotonSecundario: {
    color: '#d1d5db', fontWeight: 'bold',
  },
  textoBotonPrincipal: {
    color: '#ffffff', fontWeight: 'bold',
  },
});