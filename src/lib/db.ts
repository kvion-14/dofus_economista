import alasql from 'alasql';

const dbState = {
  data: null as any
};

// Inicializar la base de datos
export async function initializeDatabase() {
  if (dbState.data !== null) return dbState.data;

  // Cargar base de datos desde localStorage o crear nueva
  const savedDb = localStorage.getItem('dofus.db');
  if (savedDb) {
    dbState.data = JSON.parse(savedDb);
  } else {
    dbState.data = {
      runes: [],
      rune_prices: [],
      price_history: [],
      broken_items: []
    };
    createTables();
  }

  return dbState.data;
}

function createTables() {
  // alasql usa arrays en lugar de tablas, así que no necesitamos crear tablas explícitamente
  // Los datos se estructuran como objetos en arrays
  console.log('Base de datos inicializada correctamente');
}

// Guardar la base de datos en localStorage
export function saveDatabase() {
  if (dbState.data === null) return;
  
  localStorage.setItem('dofus.db', JSON.stringify(dbState.data));
}

// Exportar la base de datos como archivo
export function exportDatabase() {
  if (dbState.data === null) return null;
  
  const data = JSON.stringify(dbState.data);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dofus.db.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Importar la base de datos desde un archivo
export async function importDatabase(file: File) {
  const text = await file.text();
  dbState.data = JSON.parse(text);
  saveDatabase();
  return dbState.data;
}

export default dbState;
