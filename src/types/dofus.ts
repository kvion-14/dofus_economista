// Types basados en la API de dofusdb.fr

export interface DofusItem {
  _id: string;
  id: number;
  typeId: number;
  name: {
    es: string;
    en: string;
    fr: string;
    de: string;
    pt: string;
  };
  level: number;
  img: string;
  effects: Effect[];
}

export interface Effect {
  from: number;
  to: number;
  characteristic: number;
  category: number;
  elementId: number;
  effectId: number;
}

export interface DofusAPIResponse {
  total: number;
  limit: number;
  skip: number;
  data: DofusItem[];
}

// Tipos para nuestra aplicación

export interface RunePrice {
  runeId: number;
  runeName: string;
  price: number;
  updatedAt: string;
}

export interface PriceHistory {
  runeId: number;
  runeName: string;
  changes: PriceChange[];
}

export interface PriceChange {
  price: number;
  timestamp: string;
}

export interface BrokenItem {
  id: string;
  itemId?: number;
  itemIcon?: string;
  itemName: string;
  breakCoefficient: number;
  runesObtained: RuneObtained[];
  itemPrice?: number;
  craftPrice?: number;
  createdAt: string;
}

export interface RuneObtained {
  runeId: number;
  runeName: string;
  quantity: number;
}
