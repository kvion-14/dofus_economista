import { RunePrice, PriceHistory, PriceChange, BrokenItem, RuneObtained } from '@/types/dofus';
import dbState, { saveDatabase, initializeDatabase } from './db';

// Precios de runas
export async function getRunePrices(): Promise<Record<number, RunePrice>> {
  const db = await initializeDatabase();
  
  const runePrices = db.rune_prices || [];
  const prices: Record<number, RunePrice> = {};
  for (const row of runePrices) {
    prices[row.runeId] = {
      runeId: row.runeId,
      runeName: row.runeName,
      price: row.price,
      updatedAt: row.updatedAt,
    };
  }
  return prices;
}

export async function setRunePrice(runeId: number, runeName: string, price: number): Promise<void> {
  const db = await initializeDatabase();
  
  if (!db.rune_prices) db.rune_prices = [];
  
  const oldPrice = db.rune_prices.find((p: any) => p.runeId === runeId);
  const now = new Date().toISOString();
  
  // Si es la primera vez que se establece un precio para esta runa, guardar 0 kamas primero
  if (oldPrice === undefined) {
    db.price_history = db.price_history || [];
    db.price_history.push({ runeId, runeName, price: 0, timestamp: now });
  }
  
  // Actualizar o insertar
  const existingIndex = db.rune_prices.findIndex((p: any) => p.runeId === runeId);
  if (existingIndex >= 0) {
    db.rune_prices[existingIndex] = { runeId, runeName, price, updatedAt: now };
  } else {
    db.rune_prices.push({ runeId, runeName, price, updatedAt: now });
  }
  
  // Guardar en historial si el precio cambió
  if (oldPrice !== undefined && oldPrice.price !== price) {
    await addPriceToHistory(runeId, runeName, price);
  }
  
  saveDatabase();
}

export async function deleteRunePrice(runeId: number): Promise<void> {
  const db = await initializeDatabase();
  
  if (db.rune_prices) {
    db.rune_prices = db.rune_prices.filter((p: any) => p.runeId !== runeId);
  }
  saveDatabase();
}

// Historial de precios
export async function getPriceHistory(): Promise<Record<number, PriceHistory>> {
  const db = await initializeDatabase();
  
  const priceHistory = db.price_history || [];
  const history: Record<number, PriceHistory> = {};
  for (const row of priceHistory) {
    if (!history[row.runeId]) {
      history[row.runeId] = {
        runeId: row.runeId,
        runeName: row.runeName,
        changes: [],
      };
    }
    history[row.runeId].changes.push({
      price: row.price,
      timestamp: row.timestamp,
    });
  }
  return history;
}

async function addPriceToHistory(runeId: number, runeName: string, price: number): Promise<void> {
  const db = await initializeDatabase();
  
  if (!db.price_history) db.price_history = [];
  
  const now = new Date().toISOString();
  db.price_history.push({ runeId, runeName, price, timestamp: now });
  
  // Mantener solo los últimos 50 cambios por runa
  const runeHistory = db.price_history.filter((h: any) => h.runeId === runeId);
  if (runeHistory.length > 50) {
    db.price_history = db.price_history.filter((h: any) => {
      if (h.runeId !== runeId) return true;
      return h.timestamp !== runeHistory[0].timestamp;
    });
  }
  
  saveDatabase();
}

// Items rotos
export async function getBrokenItems(): Promise<BrokenItem[]> {
  const db = await initializeDatabase();
  
  const brokenItems = db.broken_items || [];
  return brokenItems.map((row: any) => ({
    id: row.id,
    itemName: row.itemName,
    breakPercentage: row.breakPercentage,
    itemPrice: row.itemPrice,
    craftPrice: row.craftPrice,
    runesObtained: typeof row.runesObtained === 'string' ? JSON.parse(row.runesObtained) : row.runesObtained,
    createdAt: row.createdAt,
  }));
}

export async function addBrokenItem(item: BrokenItem): Promise<void> {
  const db = await initializeDatabase();
  
  if (!db.broken_items) db.broken_items = [];
  
  db.broken_items.push({
    id: item.id,
    itemName: item.itemName,
    breakPercentage: item.breakPercentage,
    itemPrice: item.itemPrice,
    craftPrice: item.craftPrice,
    runesObtained: JSON.stringify(item.runesObtained),
    createdAt: item.createdAt || new Date().toISOString(),
  });
  
  saveDatabase();
}

export async function deleteBrokenItem(itemId: string): Promise<void> {
  const db = await initializeDatabase();
  
  if (db.broken_items) {
    db.broken_items = db.broken_items.filter((item: any) => item.id !== itemId);
  }
  saveDatabase();
}

// Datos de runas desde la API
export async function getRunesData(): Promise<any[]> {
  const db = await initializeDatabase();
  
  console.log('getRunesData - db:', db);
  console.log('getRunesData - db.runes:', db.runes);
  
  return db.runes || [];
}

export async function setRunesData(runes: any[]): Promise<void> {
  const db = await initializeDatabase();
  
  console.log('setRunesData - Guardando', runes.length, 'runas');
  db.runes = runes;
  saveDatabase();
  console.log('setRunesData - Guardado completado');
}

export async function clearAllData(): Promise<void> {
  const db = await initializeDatabase();
  
  db.rune_prices = [];
  db.price_history = [];
  db.broken_items = [];
  db.runes = [];
  saveDatabase();
}

export async function resetAllPricesToZero(): Promise<void> {
  const db = await initializeDatabase();
  
  if (db.rune_prices) {
    db.rune_prices.forEach((price: any) => {
      price.price = 0;
      price.updatedAt = new Date().toISOString();
    });
  }
  saveDatabase();
}

export async function clearPriceHistory(): Promise<void> {
  const db = await initializeDatabase();
  
  db.price_history = [];
  saveDatabase();
}
