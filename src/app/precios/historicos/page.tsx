"use client";

import React, { useState, useEffect } from "react";
import { getPriceHistory, getRunePrices, getRunesData, clearPriceHistory } from "@/lib/storage-sql";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function HistoricosPage() {
  const [priceHistory, setPriceHistory] = useState<Record<number, any>>({});
  const [runePrices, setRunePrices] = useState<Record<number, any>>({});
  const [runes, setRunes] = useState<any[]>([]);
  const [selectedRune, setSelectedRune] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const history = await getPriceHistory();
    setPriceHistory(history);

    const prices = await getRunePrices();
    setRunePrices(prices);

    const savedRunes = await getRunesData();
    setRunes(savedRunes);
  };

  const handleClearHistory = async () => {
    if (confirm("¿Estás seguro de querer eliminar todo el historial?")) {
      await clearPriceHistory();
      await loadData();
    }
  };

  const getRuneName = (runeId: number) => {
    const rune = runes.find(r => r.id === runeId);
    return rune ? rune.name.es : `Runa ${runeId}`;
  };

  const getRuneImage = (runeId: number) => {
    const rune = runes.find(r => r.id === runeId);
    return rune ? rune.img : null;
  };

  const runesWithHistory = Object.keys(priceHistory).map(Number);

  const filteredRunes = runesWithHistory.filter(runeId => {
    const runeName = getRuneName(runeId);
    return runeName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#2a213a] pt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <Link
            href="/precios"
            className="flex items-center gap-2 text-[#974133] hover:text-[#974133]/80 font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver a Precios Runas
          </Link>
          <h1 className="text-4xl font-bold text-[#ecfeca] mb-2">Históricos de Precios</h1>
          <p className="text-[#adca9a] mb-6">Visualiza el historial de cambios de precios de todas las runas</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar runa..."
              className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
            />
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 bg-[#974133] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#974133]/90 transition-colors"
            >
              <Trash2 size={20} />
              Borrar todo el historial
            </button>
          </div>
        </div>

        {filteredRunes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No hay históricos de precios registrados</p>
            <p className="text-gray-400 text-sm mt-2">Los cambios de precio se registrarán automáticamente cuando los modifiques</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRunes.map((runeId) => {
              const history = priceHistory[runeId];
              const runeImage = getRuneImage(runeId);
              const runeName = getRuneName(runeId);
              const currentPrice = runePrices[runeId];

              return (
                <div key={runeId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div
                    className="p-6 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedRune(selectedRune === runeId ? null : runeId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {runeImage && (
                          <img
                            src={runeImage}
                            alt={runeName}
                            className="w-12 h-12"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-[#100b2a]">{runeName}</h3>
                          {currentPrice && (
                            <p className="text-sm text-gray-600">
                              Precio actual: {currentPrice.price.toLocaleString()} kamas
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {history.changes.length} cambios
                      </div>
                    </div>
                  </div>

                  {selectedRune === runeId && (
                    <div className="p-6">
                      <div className="max-h-96 overflow-y-auto">
                        {history.changes.slice().reverse().map((change: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0"
                          >
                            <div className="text-sm text-gray-600">
                              {new Date(change.timestamp).toLocaleString("es-ES")}
                            </div>
                            <div className="text-lg font-semibold text-[#100b2a]">
                              {change.price.toLocaleString()} kamas
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
