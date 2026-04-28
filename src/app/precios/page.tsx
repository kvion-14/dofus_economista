"use client";

import React, { useState, useEffect } from "react";
import { getRunePrices, setRunePrice, deleteRunePrice, getPriceHistory, getRunesData, setRunesData, resetAllPricesToZero } from "@/lib/storage-sql";
import { fetchAllRunes } from "@/lib/dofus-api";
import { History, Trash2, Save, X, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function PreciosPage() {
  const [runes, setRunes] = useState<any[]>([]);
  const [runePrices, setRunePrices] = useState<Record<number, any>>({});
  const [editingPrices, setEditingPrices] = useState<Record<number, string>>({});
  const [priceHistory, setPriceHistory] = useState<Record<number, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ runeId: number; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const prices = await getRunePrices();
      setRunePrices(prices);

      const history = await getPriceHistory();
      setPriceHistory(history);

      // Comprobar si hay runas guardadas en localStorage
      const savedRunes = await getRunesData();
      if (savedRunes.length > 0) {
        setRunes(savedRunes);
      } else {
        // Si no hay datos, cargar de la API
        await loadRunesFromAPI();
      }
    } catch (error) {
      console.error("Error loading runes:", error);
    }
  };

  const loadRunesFromAPI = async () => {
    setIsLoading(true);
    try {
      const runesData = await fetchAllRunes();
      setRunes(runesData);
      await setRunesData(runesData); // Guardar en localStorage
    } catch (error) {
      console.error("Error loading runes from API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (runeId: number, value: string) => {
    // Eliminar ceros a la izquierda
    const cleanedValue = value.replace(/^0+/, '') || '0';
    setEditingPrices({ ...editingPrices, [runeId]: cleanedValue });
  };

  const validatePrice = (value: string): { valid: boolean; message?: string } => {
    const price = parseFloat(value);
    
    if (isNaN(price)) {
      return { valid: false };
    }
    
    if (price < 0) {
      return { valid: false, message: "¿Te pagaron por la runa?" };
    }
    
    // Solo rechazar si hay múltiples ceros (ej: 00, 000), pero permitir un solo 0
    if (value.length > 1 && /^0+$/.test(value)) {
      return { valid: false, message: "¿Eres un cero a la izquierda?" };
    }
    
    return { valid: true };
  };

  const handleSavePrice = async (runeId: number, runeName: string) => {
    const value = editingPrices[runeId];
    const validation = validatePrice(value);
    
    if (!validation.valid && validation.message) {
      setValidationMessage({ runeId, message: validation.message });
      return;
    }
    
    const price = parseFloat(value);
    
    if (!isNaN(price)) {
      await setRunePrice(runeId, runeName, price);
      setRunePrices({ ...runePrices, [runeId]: { runeId, runeName, price, updatedAt: new Date().toISOString() } });
      
      // Eliminar del estado de edición
      const newEditingPrices = { ...editingPrices };
      delete newEditingPrices[runeId];
      setEditingPrices(newEditingPrices);
      
      await loadData();
    }
  };

  const handleDeletePrice = async (runeId: number) => {
    await deleteRunePrice(runeId);
    const newPrices = { ...runePrices };
    delete newPrices[runeId];
    setRunePrices(newPrices);
  };

  const handleResetAllPrices = async () => {
    if (confirm("¿Estás seguro de querer eliminar todos los precios?")) {
      await resetAllPricesToZero();
      await loadData();
    }
  };

  const handleCancelEdit = (runeId: number) => {
    const newEditingPrices = { ...editingPrices };
    delete newEditingPrices[runeId];
    setEditingPrices(newEditingPrices);
  };

  const filteredRunes = runes.filter(rune =>
    rune.name.es.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#2a213a] pt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#ecfeca] mb-2">Precios Runas</h1>
          <p className="text-[#adca9a] mb-6">Gestiona los precios de las runas para calcular el valor de tus items</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar runa..."
              className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
            />
            <button
              onClick={loadRunesFromAPI}
              disabled={isLoading}
              className="flex items-center gap-2 bg-[#314743] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#314743]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
              Actualizar datos API
            </button>
            <button
              onClick={handleResetAllPrices}
              className="flex items-center gap-2 bg-[#974133] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#974133]/90 transition-colors"
            >
              <Trash2 size={20} />
              Borrar todos los precios
            </button>
            <Link
              href="/precios/historicos"
              className="flex items-center gap-2 bg-[#65856d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#65856d]/90 transition-colors text-center"
            >
              <History size={20} />
              Ver Históricos
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Runa
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio (kamas)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Última actualización
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRunes.map((rune) => {
                const currentPrice = runePrices[rune.id];
                const isEditing = editingPrices[rune.id] !== undefined;

                return (
                  <tr key={rune.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={rune.img}
                            alt={rune.name.es}
                            className="w-10 h-10 mr-4"
                          />
                          <span className="text-sm font-medium text-[#100b2a]">
                            {rune.name.es}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {rune.level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <div className="flex items-center gap-3 relative">
                            <input
                              type="number"
                              value={editingPrices[rune.id]}
                              onChange={(e) => handlePriceChange(rune.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setValidationMessage(null);
                                  handleSavePrice(rune.id, rune.name.es);
                                } else if (e.key === 'Escape') {
                                  setValidationMessage(null);
                                  handleCancelEdit(rune.id);
                                }
                              }}
                              className="w-40 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
                              placeholder="Precio"
                              autoFocus
                            />
                            {validationMessage && validationMessage.runeId === rune.id && (
                              <div className="absolute top-full left-0 mt-2 bg-[#974133] text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                                {validationMessage.message}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setValidationMessage(null);
                                handleSavePrice(rune.id, rune.name.es);
                              }}
                              className="text-[#65856d] hover:text-[#65856d]/80 transition-colors"
                              title="Guardar"
                            >
                              <Save size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setValidationMessage(null);
                                handleCancelEdit(rune.id);
                              }}
                              className="text-gray-600 hover:text-gray-800 transition-colors"
                              title="Cancelar"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => setEditingPrices({ ...editingPrices, [rune.id]: currentPrice?.price?.toString() || "" })}
                            className={currentPrice ? "text-[#100b2a] font-semibold cursor-pointer hover:text-[#974133] transition-colors" : "text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"}
                          >
                            {currentPrice ? currentPrice.price.toLocaleString() : "0"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {currentPrice?.updatedAt
                          ? new Date(currentPrice.updatedAt).toLocaleDateString("es-ES")
                          : "-"}
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
