import React, { useState } from 'react';
import { Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Resena } from '../../tipos/resena';

interface Props {
  resena: Resena;
  esComercio?: boolean;
  usuarioActivoId?: string; // <-- Propiedad agregada para validar el usuario dinámicamente
  onEditar?: (resena: Resena) => void;
  onEliminar?: (id: string) => void;
  onReportar?: (id: string) => void;
  onResponder?: (id: string, respuesta: string) => void;
}

const TarjetaResena: React.FC<Props> = ({ 
  resena, 
  esComercio = false, 
  usuarioActivoId = 'usr-10', 
  onEditar, 
  onEliminar, 
  onReportar, 
  onResponder 
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  
  // Evalúa si la reseña pertenece al usuario activo actual
  const esMia = resena.usuarioId === usuarioActivoId;

  const handleAccion = (accion: () => void) => {
    setMenuVisible(false);
    accion();
  };

  const enviarRespuesta = () => {
    if (textoRespuesta.trim() && onResponder) {
      onResponder(resena.id, textoRespuesta);
      setRespondiendo(false);
      setTextoRespuesta('');
    }
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.nombre}>{resena.nombreUsuario}</Text>
        <View style={styles.controlesSuperiores}>
          <Text style={styles.fecha}>
            {resena.fechaCreacion ? new Date(resena.fechaCreacion).toLocaleDateString() : 'Recién publicado'}
          </Text>
          <TouchableOpacity style={styles.botonOpciones} onPress={() => setMenuVisible(!menuVisible)}>
            <Text style={styles.textoOpciones}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {menuVisible && (
        <View style={styles.menuOpciones}>
          {esMia ? (
            <>
              <TouchableOpacity onPress={() => onEditar && handleAccion(() => onEditar(resena))} style={styles.opcionMenu}>
                <Text style={styles.textoOpcion}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onEliminar && handleAccion(() => onEliminar(resena.id))} style={styles.opcionMenu}>
                <Text style={[styles.textoOpcion, styles.textoPeligro]}>Eliminar</Text>
              </TouchableOpacity>
            </>
          ) : esComercio && !resena.respuestaComercio ? (
            <TouchableOpacity onPress={() => handleAccion(() => setRespondiendo(true))} style={styles.opcionMenu}>
              <Text style={styles.textoOpcion}>Responder</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onReportar && handleAccion(() => onReportar(resena.id))} style={styles.opcionMenu}>
              <Text style={styles.textoOpcion}>Reportar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Renderizado de estrellas corregido en una sola línea limpia */}
      <Text style={styles.estrellas}>
        {'★'.repeat(resena.calificacion || 0)}{'☆'.repeat(5 - (resena.calificacion || 0))}
      </Text>
      
      {resena.comentario ? <Text style={styles.comentario}>{resena.comentario}</Text> : null}

      {resena.fotos && resena.fotos.length > 0 && (
        <View style={styles.galeria}>
          {resena.fotos.map((fotoUrl, index) => (
            <Image key={index} source={{ uri: fotoUrl }} style={styles.fotoAdjunta} />
          ))}
        </View>
      )}

      {resena.respuestaComercio && (
        <View style={styles.respuestaContenedor}>
          <Text style={styles.respuestaTitulo}>Respuesta del comercio:</Text>
          <Text style={styles.respuestaTexto}>
            {typeof resena.respuestaComercio === 'string' ? resena.respuestaComercio : resena.respuestaComercio.comentario}
          </Text>
        </View>
      )}

      {respondiendo && (
        <View style={styles.cajaRespuesta}>
          <TextInput
            style={styles.inputRespuesta}
            placeholder="Escribe tu respuesta..."
            placeholderTextColor="#9ca3af"
            value={textoRespuesta}
            onChangeText={setTextoRespuesta}
            multiline
          />
          <View style={styles.botonesRespuesta}>
            <Button title="Cancelar" color="#ef4444" onPress={() => setRespondiendo(false)} />
            <Button title="Enviar" color="#059669" onPress={enviarRespuesta} />
          </View>
        </View>
      )}
    </View>
  );
};

export default TarjetaResena;

const styles = StyleSheet.create({
  contenedor: { backgroundColor: '#1b2e23', padding: 16, borderRadius: 8, marginBottom: 12 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  nombre: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  controlesSuperiores: { flexDirection: 'row', alignItems: 'center' },
  fecha: { color: '#9ca3af', fontSize: 12, marginRight: 10 },
  botonOpciones: { paddingHorizontal: 8, paddingVertical: 2 },
  textoOpciones: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  menuOpciones: { position: 'absolute', top: 40, right: 10, backgroundColor: '#374151', borderRadius: 8, padding: 4, zIndex: 10, elevation: 5, minWidth: 100 },
  opcionMenu: { paddingVertical: 8, paddingHorizontal: 12 },
  textoOpcion: { color: '#ffffff', fontSize: 14 },
  textoPeligro: { color: '#ef4444' },
  estrellas: { color: '#fbbf24', fontSize: 18, marginVertical: 6 },
  comentario: { color: '#d1d5db', fontSize: 14, lineHeight: 20 },
  galeria: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  fotoAdjunta: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#374151' },
  respuestaContenedor: { marginTop: 12, backgroundColor: '#064e3b', padding: 12, borderRadius: 8 },
  respuestaTitulo: { color: '#34d399', fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
  respuestaTexto: { color: '#d1d5db', fontSize: 13, lineHeight: 18 },
  cajaRespuesta: { marginTop: 12 },
  inputRespuesta: { backgroundColor: '#374151', color: '#ffffff', padding: 10, borderRadius: 8, textAlignVertical: 'top', minHeight: 60 },
  botonesRespuesta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }
});