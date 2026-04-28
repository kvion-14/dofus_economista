"use client";

import { useState, useEffect } from "react";
import { BrokenItem, RuneObtained } from "@/types/dofus";
import { getRunePrices, getBrokenItems, addBrokenItem, deleteBrokenItem } from "@/lib/storage-sql";
import { fetchAllRunes } from "@/lib/dofus-api";
import { Trash2, Plus } from "lucide-react";

export default function Home() {
  const [brokenItems, setBrokenItems] = useState<BrokenItem[]>([]);
  const [runes, setRunes] = useState<any[]>([]);
  const [runePrices, setRunePrices] = useState<Record<number, any>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    breakPercentage: "",
    itemPrice: "",
    craftPrice: "",
  });
  const [newRunes, setNewRunes] = useState<RuneObtained[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const items = await getBrokenItems();
      setBrokenItems(items);
      const prices = await getRunePrices();
      setRunePrices(prices);
      const runesData = await fetchAllRunes();
      setRunes(runesData);
    } catch (error) {
      console.error("Error loading data:", error);
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

  const handleSaveItem = async () => {
    if (!newItem.itemName || !newItem.breakPercentage || newRunes.length === 0) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    const item: BrokenItem = {
      id: Date.now().toString(),
      itemName: newItem.itemName,
      breakPercentage: parseFloat(newItem.breakPercentage),
      itemPrice: newItem.itemPrice ? parseFloat(newItem.itemPrice) : undefined,
      craftPrice: newItem.craftPrice ? parseFloat(newItem.craftPrice) : undefined,
      runesObtained: newRunes,
      createdAt: new Date().toISOString(),
    };

    await addBrokenItem(item);
    loadData();
    setShowAddForm(false);
    setNewItem({
      itemName: "",
      breakPercentage: "",
      itemPrice: "",
      craftPrice: "",
    });
    setNewRunes([]);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteBrokenItem(itemId);
    loadData();
  };

  const handleAddRune = () => {
    setNewRunes([...newRunes, { runeId: 0, runeName: "", quantity: 1 }]);
  };

  const handleUpdateRune = (index: number, field: keyof RuneObtained, value: any) => {
    const updated = [...newRunes];
    if (field === "runeId") {
      const selectedRune = runes.find(r => r.id === parseInt(value));
      updated[index] = {
        ...updated[index],
        runeId: parseInt(value),
        runeName: selectedRune ? selectedRune.name.es : "",
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setNewRunes(updated);
  };

  const handleRemoveRune = (index: number) => {
    setNewRunes(newRunes.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#2a213a] pt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-[#100b2a] mb-2">Items Rotos</h1>
            <p className="text-gray-600">Registra y calcula el valor de tus items rotos por forjamagia</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-[#974133] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#974133]/90 transition-colors"
          >
            <Plus size={20} />
            Agregar Item
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-[#ecfeca] mb-6">Nuevo Item Roto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Item
                </label>
                <input
                  type="text"
                  value={newItem.itemName}
                  onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  placeholder="Ej: Anillo del Dragón"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de Rotura (%)
                </label>
                <input
                  type="number"
                  value={newItem.breakPercentage}
                  onChange={(e) => setNewItem({ ...newItem, breakPercentage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  placeholder="Ej: 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio del Item (opcional)
                </label>
                <input
                  type="number"
                  value={newItem.itemPrice}
                  onChange={(e) => setNewItem({ ...newItem, itemPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  placeholder="Ej: 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Crafteo (opcional)
                </label>
                <input
                  type="number"
                  value={newItem.craftPrice}
                  onChange={(e) => setNewItem({ ...newItem, craftPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  placeholder="Ej: 8000"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#ecfeca]">Runas Obtenidas</h3>
                <button
                  onClick={handleAddRune}
                  className="text-[#974133] hover:text-[#974133]/80 font-medium"
                >
                  + Agregar Runa
                </button>
              </div>
              {newRunes.map((rune, index) => (
                <div key={index} className="flex gap-4 mb-3">
                  <select
                    value={rune.runeId}
                    onChange={(e) => handleUpdateRune(index, "runeId", e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                  >
                    <option value="">Seleccionar runa</option>
                    {runes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name.es}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={rune.quantity}
                    onChange={(e) => handleUpdateRune(index, "quantity", parseInt(e.target.value))}
                    className="w-32 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                    min="1"
                  />
                  <button
                    onClick={() => handleRemoveRune(index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveItem}
                className="bg-[#974133] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#974133]/90 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  % Rotura
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Runas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Runas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Beneficio (Compra)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Beneficio (Crafteo)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brokenItems.map((item) => {
                const { buyProfit, craftProfit } = calculateProfit(item);
                const runesTotal = calculateRunesTotal(item.runesObtained);

                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#100b2a]">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.breakPercentage}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.runesObtained.map((r, i) => (
                        <div key={i} className="py-1">
                          {r.runeName} x{r.quantity}
                        </div>
                      ))}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[#974133] hover:text-[#974133]/80 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {brokenItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
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
    </div>
  );
}
