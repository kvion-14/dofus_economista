import { RunePrice, PriceHistory, PriceChange, BrokenItem, RuneObtained } from '@/types/dofus';

const API_BASE = 'http://localhost:5000/api';

// Precios de runas
export async function getRunePrices(): Promise<Record<number, RunePrice>> {
  const response = await fetch(`${API_BASE}/rune-prices`);
  const data = await response.json();
  
  const prices: Record<number, RunePrice> = {};
  for (const row of data) {
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
  await fetch(`${API_BASE}/rune-prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runeId, runeName, price }),
  });
}

export async function deleteRunePrice(runeId: number): Promise<void> {
  await fetch(`${API_BASE}/rune-prices/${runeId}`, { method: 'DELETE' });
}

// Historial de precios
export async function getPriceHistory(): Promise<Record<number, PriceHistory>> {
  const response = await fetch(`${API_BASE}/price-history`);
  const data = await response.json();
  
  const history: Record<number, PriceHistory> = {};
  for (const row of data) {
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

export async function clearPriceHistory(): Promise<void> {
  await fetch(`${API_BASE}/price-history`, { method: 'DELETE' });
}

// Items rotos
export async function getBrokenItems(): Promise<BrokenItem[]> {
  const response = await fetch(`${API_BASE}/broken-items`);
  const data = await response.json();
  
  return data.map((row: any) => ({
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
  await fetch(`${API_BASE}/broken-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
}

export async function deleteBrokenItem(itemId: string): Promise<void> {
  await fetch(`${API_BASE}/broken-items/${itemId}`, { method: 'DELETE' });
}

// Datos de runas desde la API
export async function getRunesData(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/runes`);
  const data = await response.json();
  return data;
}

export async function setRunesData(runes: any[]): Promise<void> {
  await fetch(`${API_BASE}/runes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runes),
  });
}

export async function clearAllData(): Promise<void> {
  await fetch(`${API_BASE}/clear-all`, { method: 'POST' });
}

export async function resetAllPricesToZero(): Promise<void> {
  await fetch(`${API_BASE}/reset-prices`, { method: 'POST' });
}

// Funciones para equipo
export async function getEquipment(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/equipment`);
  return await response.json();
}

export async function setEquipment(equipment: any[]): Promise<void> {
  await fetch(`${API_BASE}/equipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipment),
  });
}

export async function getEquipmentItems(): Promise<Record<number, any>> {
  const response = await fetch(`${API_BASE}/equipment-items`);
  return await response.json();
}

export async function setEquipmentItem(itemId: number, itemData: any): Promise<void> {
  await fetch(`${API_BASE}/equipment-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, ...itemData }),
  });
}

export async function removeEquipmentItem(itemId: number): Promise<void> {
  await fetch(`${API_BASE}/equipment-items/${itemId}`, { method: 'DELETE' });
}

// Funciones para caché de items de equipo
export async function getCachedItems(typeId: number): Promise<any[] | null> {
  const response = await fetch(`${API_BASE}/items-cache/${typeId}`);
  const data = await response.json();
  return data;
}

export async function setCachedItems(typeId: number, items: any[]): Promise<void> {
  await fetch(`${API_BASE}/items-cache`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ typeId, items }),
  });
}

// Funciones para caché de imágenes de items
export async function getCachedItemImages(): Promise<Record<number, string> | null> {
  const response = await fetch(`${API_BASE}/item-images-cache`);
  const data = await response.json();
  return data;
}

export async function setCachedItemImages(images: Record<number, string>): Promise<void> {
  await fetch(`${API_BASE}/item-images-cache`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(images),
  });
}

// Funciones para caché de características
export async function getCachedCharacteristics(): Promise<any[] | null> {
  const response = await fetch(`${API_BASE}/characteristics-cache`);
  const data = await response.json();
  return data;
}

export async function setCachedCharacteristics(characteristics: any[]): Promise<void> {
  await fetch(`${API_BASE}/characteristics-cache`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(characteristics),
  });
}

// Funciones para favoritos
export async function getFavorites(): Promise<Record<number, boolean>> {
  const response = await fetch(`${API_BASE}/favorites`);
  return await response.json();
}

export async function toggleFavorite(itemId: number): Promise<void> {
  await fetch(`${API_BASE}/favorites/${itemId}`, { method: 'POST' });
}

// Funciones para mapeo de iconos de características
export async function getCharacteristicIcons(): Promise<Record<number, string>> {
  const response = await fetch(`${API_BASE}/characteristic-icons`);
  return await response.json();
}

// API para objetos farmeados
export async function getFarmedItems(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/farmed-items`);
  return await response.json();
}

export async function addFarmedItem(item: any): Promise<void> {
  await fetch(`${API_BASE}/farmed-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
}

export async function deleteFarmedItem(itemId: string): Promise<void> {
  await fetch(`${API_BASE}/farmed-items/${itemId}`, { method: 'DELETE' });
}

export async function updateFarmedItem(itemId: string, notes: string): Promise<void> {
  await fetch(`${API_BASE}/farmed-items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
}

// Funciones para historial de items rotos
export async function getBrokenItemsHistory(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/broken-items-history`);
  return await response.json();
}

// Exportar funciones dummy para compatibilidad
export const saveDatabase = () => {};
export const initializeDatabase = () => Promise.resolve({});

