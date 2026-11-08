import * as SQLite from 'expo-sqlite';

// Crea o abre la base de datos local
const db = SQLite.openDatabaseSync('resenas_offline.db');

export const inicializarBaseDeDatos = () => {
  // Crea la tabla si no existe
  db.execSync(`
    CREATE TABLE IF NOT EXISTS resenas_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calificacion INTEGER,
      comentario TEXT,
      fotos TEXT
    );
  `);
  console.log('Base de datos de reseñas lista');
};

export const guardarResenaPendiente = (calificacion: number, comentario: string, fotos: string[]) => {
  const query = db.prepareSync(
    'INSERT INTO resenas_pendientes (calificacion, comentario, fotos) VALUES (?, ?, ?)'
  );
  // Guardamos las fotos como un texto JSON para que SQLite las acepte en una sola columna
  query.executeSync([calificacion, comentario, JSON.stringify(fotos)]);
  console.log('Reseña guardada localmente en SQLite');
};

// --- NUEVA FUNCIÓN: Para leer las reseñas cuando vuelve el Wi-Fi ---
export const obtenerResenasLocales = () => {
  const filas = db.getAllSync('SELECT * FROM resenas_pendientes');
  
  // Transformamos los datos de SQLite al formato que espera tu pantalla
  return filas.map((fila: any) => ({
    id: `offline-${fila.id}`,
    usuarioId: 'usr-yo',
    nombreUsuario: 'Thiago Chamorro', // Tu nombre activo
    comercioId: '', 
    calificacion: fila.calificacion,
    comentario: fila.comentario,
    fotos: fila.fotos ? JSON.parse(fila.fotos) : [],
    fechaCreacion: new Date().toISOString(),
  }));
};

// --- NUEVA FUNCIÓN: Para borrar las reseñas locales una vez sincronizadas ---
export const vaciarResenasPendientes = () => {
  db.execSync('DELETE FROM resenas_pendientes');
  console.log('Base de datos local limpiada');
};