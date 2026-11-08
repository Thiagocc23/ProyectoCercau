import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  promedio: number;
  total: number;
}

export const ResumenCalificaciones: React.FC<Props> = ({ promedio, total }) => {
  return (
    <View style={styles.container}>
      <View style={styles.columnaPuntaje}>
        <Text style={styles.numeroPromedio}>{promedio > 0 ? promedio : '-'}</Text>
        <Text style={styles.estrellas}>
          {'★'.repeat(Math.round(promedio))}
          {'☆'.repeat(5 - Math.round(promedio))}
        </Text>
      </View>
      <View style={styles.columnaInfo}>
        <Text style={styles.totalTexto}>
          {total === 1 ? '1 calificación' : `${total} calificaciones`}
        </Text>
        <Text style={styles.subtexto}>Opiniones de la comunidad</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1b2e23',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#264232',
  },
  columnaPuntaje: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#264232',
  },
  numeroPromedio: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  estrellas: {
    color: '#f59e0b',
    fontSize: 14,
  },
  columnaInfo: {
    paddingLeft: 16,
  },
  totalTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtexto: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
});