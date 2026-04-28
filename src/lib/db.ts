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
  
  try {
    localStorage.setItem('dofus.db', JSON.stringify(dbState.data));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded, trying to clean up...');
      // Limpiar historial de precios para liberar espacio
      if (dbState.data.price_history && dbState.data.price_history.length > 0) {
        // Mantener solo los últimos 20 cambios por runa
        const cleanedHistory: any[] = [];
        const historyByRune: Record<number, any[]> = {};
        
        dbState.data.price_history.forEach((entry: any) => {
          if (!historyByRune[entry.runeId]) {
            historyByRune[entry.runeId] = [];
          }
          historyByRune[entry.runeId].push(entry);
        });
        
        Object.keys(historyByRune).forEach(runeId => {
          const runeHistory = historyByRune[parseInt(runeId)];
          if (runeHistory.length > 20) {
            // Mantener los últimos 20
            cleanedHistory.push(...runeHistory.slice(-20));
          } else {
            cleanedHistory.push(...runeHistory);
          }
        });
        
        dbState.data.price_history = cleanedHistory;
        
        try {
          localStorage.setItem('dofus.db', JSON.stringify(dbState.data));
          console.log('Successfully cleaned up price history');
        } catch (retryError) {
          console.error('Still exceeded quota after cleanup, clearing all history');
          dbState.data.price_history = [];
          localStorage.setItem('dofus.db', JSON.stringify(dbState.data));
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
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
