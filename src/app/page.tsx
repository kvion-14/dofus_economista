"use client";

import { useState, useEffect } from "react";
import { BrokenItem, RuneObtained, DofusItem } from "@/types/dofus";
import { getRunePrices, getBrokenItems, addBrokenItem, deleteBrokenItem, getCachedItems, setCachedItems, getBrokenItemsHistory, getFavorites, setRunePrice } from "@/lib/storage-sql";
import { fetchAllRunes, fetchItemTypes, fetchAllItemsByType } from "@/lib/dofus-api";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORY_SUPER_TYPES: Record<string, number> = {
  "Sombrero": 10,
  "Capa": 11,
  "Amuleto": 1,
  "Anillo": 3,
  "Arma": 2,
  "Cinturón": 4,
  "Botas": 5,
  "Escudo": 7
};

const CATEGORIES = [...Object.keys(CATEGORY_SUPER_TYPES), "Favoritos"];

export default function Home() {
  const [brokenItems, setBrokenItems] = useState<BrokenItem[]>([]);
  const [runes, setRunes] = useState<any[]>([]);
  const [runePrices, setRunePrices] = useState<Record<number, any>>({});
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [availableItems, setAvailableItems] = useState<DofusItem[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [sortField, setSortField] = useState<'createdAt' | 'buyProfit' | 'craftProfit'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [newItem, setNewItem] = useState({
    itemId: 0,
    itemIcon: "",
    itemName: "",
    breakCoefficient: "",
    itemPrice: "",
    craftPrice: "",
  });
  const [possibleRunes, setPossibleRunes] = useState<RuneObtained[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingRunePrices, setEditingRunePrices] = useState<Record<number, string>>({});
  const [selectedItemRunes, setSelectedItemRunes] = useState<RuneObtained[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadData();
    loadItemTypes();
  }, [searchParams]);

  const loadData = async () => {
    try {
      const items = await getBrokenItemsHistory();
      // Parse runesObtained from JSON string to array
      const parsedItems = items.map((item: any) => ({
        ...item,
        runesObtained: typeof item.runesObtained === 'string' 
          ? JSON.parse(item.runesObtained) 
          : item.runesObtained
      }));
      setBrokenItems(parsedItems);
      const prices = await getRunePrices();
      setRunePrices(prices);
      const runesData = await fetchAllRunes();
      setRunes(runesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadItemTypes = async () => {
    try {
      // No cargamos itemTypes, usamos las categorías predefinidas de equipo
      setItemTypes(CATEGORIES.map(name => ({ id: CATEGORY_SUPER_TYPES[name] || 0, name: { es: name } })));
    } catch (error) {
      console.error("Error loading item types:", error);
    }
  };

  const loadCategoryItems = async (category: string) => {
    try {
      if (category === "Favoritos") {
        // Cargar favoritos
        const favorites = await getFavorites();
        const favoriteItems = await Promise.all(
          Object.keys(favorites).filter(id => favorites[parseInt(id)]).map(async (id) => {
            const cached = await getCachedItems(parseInt(id));
            if (cached && cached.length > 0) {
              return cached[0];
            }
            return null;
          })
        );
        setAvailableItems(favoriteItems.filter(item => item !== null) as DofusItem[]);
      } else {
        const superTypeId = CATEGORY_SUPER_TYPES[category];
        if (superTypeId) {
          const itemTypesResponse = await fetchItemTypes(superTypeId);
          if (itemTypesResponse.data && itemTypesResponse.data.length > 0) {
            const typeId = itemTypesResponse.data[0].id;
            const items = await fetchAllItemsByType(typeId);
            setAvailableItems(items);
            setCachedItems(typeId, items);
          }
        }
      }
    } catch (error) {
      console.error("Error loading category items:", error);
    }
  };

  const calculateRunesTotal = (runesObtained: RuneObtained[]) => {
    return runesObtained.reduce((total, rune) => {
      const price = runePrices[rune.runeId]?.price || 0;
      return total + (price * rune.quantity);
    }, 0);
  };

  const calculateProfit = (item: BrokenItem) => {
    const runesTotal = calculateRunesTotal(item.runesObtained);
    
    let buyProfit: number | string = "Falta info";
    let craftProfit: number | string = "Falta info";

    if (item.itemPrice !== undefined) {
      buyProfit = runesTotal - item.itemPrice;
    }

    if (item.craftPrice !== undefined) {
      craftProfit = runesTotal - item.craftPrice;
    }

    return { buyProfit, craftProfit };
  };

  const calculatePossibleRunes = (item: DofusItem) => {
    const runeMap: Record<number, number> = {
      10: 1519, // Fuerza -> Runa Fu
      11: 1523, // Vida -> Runa Vi
      15: 1522, // Inteligencia -> Runa In
      14: 1524, // Agilidad -> Runa Agi
      13: 1525, // Suerte -> Runa Sue
      55: 7452, // Re Fuego (fijo) -> Re Fuego
      56: 7454, // Re Agua (fijo) -> Re Agua
      57: 7453, // Re Aire (fijo) -> Re Aire
      54: 7455, // Re Tierra (fijo) -> Re Tierra
      58: 7456, // Re Neutral (fijo) -> Re Neutral
      18: 7433, // Crítico -> Re Cri
      40: 7443, // Pods -> Re Pod
      44: 7448, // Iniciativa -> Re Ini
      1: 1557, // PA -> Runa Ga PA
      23: 1558, // PM -> Runa Ga PM
      12: 1521, // Sabiduría -> Runa Sa
      48: 7451, // Prospección -> Runa Prospe
      49: 7434, // Curas -> Runa Cu
      50: 7437, // Reenvío -> Runa Da Reen
      84: 11649, // Empuje -> Runa Da Emp
      79: 11639, // Placaje -> Runa Pla
      78: 11637, // Huida -> Runa Hui
      27: 11641, // Esquiva PA -> Runa Re PA
      28: 11643, // Esquiva PM -> Runa Re PM
      82: 11645, // Retirada PA -> Runa Ret PA
      83: 11647, // Retirada PM -> Runa Ret PM
      25: 7436, // Potencia -> Runa Pot
      16: 7435, // Daños -> Runa Da
      19: 7438, // Alcance -> Runa Al
      26: 7442, // Invocación -> Runa Invo
      88: 11657, // Daño Tierra -> Runa Da Tierra
      89: 11659, // Daño Fuego -> Runa Da Fuego
      90: 11661, // Daño Agua -> Runa Da Agua
      91: 11663, // Daño Aire -> Runa Da Aire
      92: 11665, // Daño Neutral -> Runa Da Neutral
      86: 11653, // Daño Crítico -> Runa Da Cri
      87: 11655, // Resistencia Crítico -> Runa Re Cri
      85: 11651, // Resistencia Empuje -> Runa Re Emp
    };

    const possibleRunes: RuneObtained[] = [];
    
    if (item.effects) {
      for (const effect of item.effects) {
        const runeId = runeMap[effect.characteristic];
        if (runeId) {
          const existingRune = possibleRunes.find(r => r.runeId === runeId);
          if (existingRune) {
            existingRune.quantity += 1;
          } else {
            const rune = runes.find(r => r.id === runeId);
            possibleRunes.push({
              runeId: runeId,
              runeName: rune ? rune.name.es : "Unknown",
              quantity: 1,
            });
          }
        }
      }
    }

    return possibleRunes;
  };

  const handleSelectItem = (item: DofusItem) => {
    const possibleRunes = calculatePossibleRunes(item);
    setNewItem({
      itemId: item.id,
      itemIcon: item.img,
      itemName: item.name.es,
      breakCoefficient: "",
      itemPrice: "",
      craftPrice: "",
    });
    setPossibleRunes(possibleRunes);
    setShowItemModal(false);
  };

  const handleSaveItem = async () => {
    if (!newItem.itemName) {
      alert("Por favor selecciona un item");
      return;
    }

    // Filtrar runas con cantidad mayor a 0
    const filteredRunes = possibleRunes.filter(r => r.quantity > 0);

    const item: BrokenItem = {
      id: Date.now().toString(),
      itemId: newItem.itemId,
      itemIcon: newItem.itemIcon,
      itemName: newItem.itemName,
      breakCoefficient: newItem.breakCoefficient ? parseFloat(newItem.breakCoefficient) : 0,
      itemPrice: newItem.itemPrice ? parseFloat(newItem.itemPrice) : 0,
      craftPrice: newItem.craftPrice ? parseFloat(newItem.craftPrice) : 0,
      runesObtained: filteredRunes,
      createdAt: new Date().toISOString(),
    };

    await addBrokenItem(item);
    loadData();
    setNewItem({
      itemId: 0,
      itemIcon: "",
      itemName: "",
      breakCoefficient: "",
      itemPrice: "",
      craftPrice: "",
    });
    setPossibleRunes([]);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este item?")) {
      await deleteBrokenItem(itemId);
      loadData();
    }
  };

  const handleUpdateRuneQuantity = (index: number, value: number) => {
    const updated = [...possibleRunes];
    updated[index].quantity = value;
    setPossibleRunes(updated);
  };

  const handleOpenPricePage = (runesObtained: RuneObtained[]) => {
    setSelectedItemRunes(runesObtained);
    // Inicializar precios de edición con los precios actuales
    const initialPrices: Record<number, string> = {};
    runesObtained.forEach(r => {
      const price = runePrices[r.runeId]?.price;
      initialPrices[r.runeId] = price !== undefined ? price.toString() : '';
    });
    setEditingRunePrices(initialPrices);
    setShowPriceModal(true);
  };

  const handleSaveRunePrice = async (runeId: number, runeName: string) => {
    const value = editingRunePrices[runeId];
    if (value !== undefined && value !== '') {
      const price = parseFloat(value);
      await setRunePrice(runeId, runeName, price);
      // Actualizar precios locales
      setRunePrices({ ...runePrices, [runeId]: { runeId, runeName, price, updatedAt: new Date().toISOString() } });
    }
  };

  const handleSaveAllRunePrices = async () => {
    for (const rune of selectedItemRunes) {
      const value = editingRunePrices[rune.runeId];
      if (value !== undefined && value !== '') {
        const price = parseFloat(value);
        await setRunePrice(rune.runeId, rune.runeName, price);
      }
    }
    // Recargar precios
    const prices = await getRunePrices();
    setRunePrices(prices);
    setShowPriceModal(false);
  };

  const handleSort = (field: 'createdAt' | 'buyProfit' | 'craftProfit') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedItems = [...brokenItems].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'buyProfit' || sortField === 'craftProfit') {
      const { buyProfit: profitA } = calculateProfit(a);
      const { buyProfit: profitB } = calculateProfit(b);
      const valueA = sortField === 'buyProfit' ? profitA : calculateProfit(a).craftProfit;
      const valueB = sortField === 'buyProfit' ? profitB : calculateProfit(b).craftProfit;
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else if (typeof valueA === 'number') {
        comparison = -1;
      } else if (typeof valueB === 'number') {
        comparison = 1;
      }
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const filteredItems = availableItems.filter(item =>
    item.name.es.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#2a213a] pt-12">
      <div className="max-w-[95%] mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-[#ecfeca] mb-2">Items Rotos</h1>
            <p className="text-[#adca9a]">Registra y calcula el valor de tus items rotos por forjamagia</p>
          </div>
          <button
            onClick={() => setShowItemModal(true)}
            className="flex items-center gap-2 bg-[#974133] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#974133]/90 transition-colors"
          >
            <Plus size={20} />
            Agregar Item
          </button>
        </div>

        {newItem.itemName && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#a3685b]">Nuevo Item Roto</h2>
              <button
                onClick={() => {
                  setNewItem({
                    itemId: 0,
                    itemIcon: "",
                    itemName: "",
                    breakCoefficient: "",
                    itemPrice: "",
                    craftPrice: "",
                  });
                  setPossibleRunes([]);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {newItem.itemIcon && (
                <img src={newItem.itemIcon} alt={newItem.itemName} className="w-16 h-16" />
              )}
              <div>
                <h3 className="text-xl font-semibold text-[#100b2a]">{newItem.itemName}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coeficiente de Rotura (%)
                </label>
                <input
                  type="number"
                  value={newItem.breakCoefficient}
                  onChange={(e) => setNewItem({ ...newItem, breakCoefficient: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent text-black"
                  placeholder="Ej: 50"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio del Item (kamas)
                </label>
                <input
                  type="number"
                  value={newItem.itemPrice}
                  onChange={(e) => setNewItem({ ...newItem, itemPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent text-black"
                  placeholder="Ej: 10000"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Crafteo (kamas)
                </label>
                <input
                  type="number"
                  value={newItem.craftPrice}
                  onChange={(e) => setNewItem({ ...newItem, craftPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent text-black"
                  placeholder="Ej: 8000"
                  min="0"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#a3685b] mb-4">Runas Posibles</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {possibleRunes.map((rune, index) => {
                  const runeData = runes.find(r => r.id === rune.runeId);
                  return (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      {runeData && (
                        <img src={runeData.img} alt={rune.runeName} className="w-8 h-8" />
                      )}
                      <span className="text-xs font-medium text-[#100b2a] flex-1 truncate" title={rune.runeName}>
                        {rune.runeName}
                      </span>
                      <input
                        type="number"
                        value={rune.quantity}
                        onChange={(e) => handleUpdateRuneQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-14 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent text-center text-black text-sm"
                        min="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveItem}
                className="bg-[#974133] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#974133]/90 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Coeficiente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Runas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio Item (Compra)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio Item (Crafteo)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio Runas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('buyProfit')}>
                  Beneficio (Compra) {sortField === 'buyProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('craftProfit')}>
                  Beneficio (Crafteo) {sortField === 'craftProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
                  Fecha {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedItems.map((item) => {
                const { buyProfit, craftProfit } = calculateProfit(item);
                const runesTotal = calculateRunesTotal(item.runesObtained);

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.itemIcon ? (
                        <img src={item.itemIcon} alt={item.itemName} className="w-10 h-10" />
                      ) : (
                        <button
                          onClick={() => setShowItemModal(true)}
                          className="flex items-center justify-center w-10 h-10 bg-[#974133] text-white rounded-lg hover:bg-[#974133]/90 transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#100b2a]">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.breakCoefficient}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="grid grid-cols-3 gap-3">
                        {item.runesObtained.filter(r => r.quantity > 0).map((r, i) => {
                          const runeData = runes.find(rune => rune.id === r.runeId);
                          return (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                              {runeData && runeData.img ? (
                                <img src={runeData.img} alt={r.runeName} className="w-4 h-4 flex-shrink-0" title={r.runeName} />
                              ) : (
                                <span className="text-xs text-gray-400 flex-shrink-0">?</span>
                              )}
                              <span className="text-xs whitespace-nowrap">{r.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.itemPrice !== undefined ? `${item.itemPrice.toLocaleString()} kamas` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.craftPrice !== undefined ? `${item.craftPrice.toLocaleString()} kamas` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#100b2a]">
                      {runesTotal.toLocaleString()} kamas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={
                        typeof buyProfit === "number" 
                          ? buyProfit >= 0 ? "text-[#65856d]" : "text-[#974133]"
                          : "text-gray-400"
                      }>
                        {typeof buyProfit === "number" ? `${buyProfit.toLocaleString()} kamas` : buyProfit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={
                        typeof craftProfit === "number" 
                          ? craftProfit >= 0 ? "text-[#65856d]" : "text-[#974133]"
                          : "text-gray-400"
                      }>
                        {typeof craftProfit === "number" ? `${craftProfit.toLocaleString()} kamas` : craftProfit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenPricePage(item.runesObtained)}
                          className="text-[#974133] hover:text-[#974133]/80 transition-colors"
                          title="Completar precios runas"
                        >
                          <img src="/assets/kama.png" alt="Editar precios" className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-[#974133] hover:text-[#974133]/80 transition-colors"
                          title="Eliminar"
                        >
                          <img src="/assets/dragopedo.jpg" alt="Eliminar" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-lg">No hay items rotos registrados</p>
                      <p className="text-sm">Agrega uno para empezar a trackear tus forjamagias</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {showItemModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#2a213a] rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#ecfeca]">Seleccionar Item</h2>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 border-b border-gray-700">
                <div className="flex gap-4 mb-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      if (e.target.value) {
                        loadCategoryItems(e.target.value);
                      }
                    }}
                    className="flex-1 bg-white text-black border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  >
                    <option value="">Seleccionar categoría</option>
                    {itemTypes.map((type) => (
                      <option key={type.id} value={type.name.es}>
                        {type.name.es}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="Buscar item..."
                    className="flex-1 bg-white text-black border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="flex items-center gap-4 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left"
                    >
                      <img src={item.img} alt={item.name.es} className="w-12 h-12" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#ecfeca]">{item.name.es}</div>
                        <div className="text-xs text-gray-400">Nivel {item.level}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {filteredItems.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <p>No se encontraron items</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showPriceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#2a213a] rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-[#ecfeca]">Editar Precios de Runas</h2>
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {selectedItemRunes.map((rune) => {
                    const runeData = runes.find(r => r.id === rune.runeId);
                    return (
                      <div key={rune.runeId} className="flex items-center gap-4 bg-gray-800 rounded-lg p-4">
                        {runeData && (
                          <img src={runeData.img} alt={rune.runeName} className="w-12 h-12" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#ecfeca]">{rune.runeName}</div>
                          <div className="text-xs text-gray-400">Cantidad: {rune.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingRunePrices[rune.runeId] || ''}
                            onChange={(e) => setEditingRunePrices({ ...editingRunePrices, [rune.runeId]: e.target.value })}
                            className="w-32 bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                            placeholder="Precio"
                            min="0"
                          />
                          <span className="text-sm text-gray-400">kamas</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-700 flex justify-end gap-4">
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAllRunePrices}
                  className="px-6 py-2 bg-[#974133] text-white rounded-lg hover:bg-[#974133]/90 transition-colors"
                >
                  Guardar Todos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
