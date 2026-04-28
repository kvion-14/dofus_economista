"use client";

import React, { useState, useEffect } from "react";
import { fetchItemTypes, fetchAllItemsByType, fetchAllCharacteristics } from "@/lib/dofus-api";
import { setEquipmentItem, getEquipmentItems, removeEquipmentItem, getCachedItems, setCachedItems, getCachedCharacteristics, setCachedCharacteristics, getCachedItemImages, setCachedItemImages, getFavorites, toggleFavorite } from "@/lib/storage-sql";
import Link from "next/link";
import { ArrowLeft, Star, ChevronUp, ChevronDown, RefreshCw, X } from "lucide-react";
import CHARACTERISTIC_ICONS from "@/lib/mapeo_caracteristicas";

// Mapeo de superTypeId a typeId
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

const CATEGORIES = Object.keys(CATEGORY_SUPER_TYPES);

export default function EquipoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Favoritos");
  const [items, setItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [equipmentItems, setEquipmentItems] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFrom, setLevelFrom] = useState<string>("");
  const [levelTo, setLevelTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<number[]>([]);
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadEquipment();
    loadFavorites();
    loadCharacteristics();
    // Cargar Sombrero por defecto
    loadCategoryItems("Sombrero");
  }, []);

  const loadEquipment = async () => {
    const items = await getEquipmentItems();
    setEquipmentItems(items);
  };

  const loadFavorites = async () => {
    const favorites = await getFavorites();
    setFavorites(favorites);
  };

  const loadCharacteristics = async () => {
    const cached = await getCachedCharacteristics();
    if (cached) {
      setCharacteristics(cached);
    } else {
      const allCharacteristics = await fetchAllCharacteristics();
      await setCachedCharacteristics(allCharacteristics);
      setCharacteristics(allCharacteristics);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Recargar características
      await loadCharacteristics();
      
      // Recargar items de la categoría actual
      if (selectedCategory && selectedCategory !== "Favoritos") {
        const superTypeId = CATEGORY_SUPER_TYPES[selectedCategory];
        const itemTypesResponse = await fetchItemTypes(superTypeId);
        if (itemTypesResponse.data && itemTypesResponse.data.length > 0) {
          const typeId = itemTypesResponse.data[0].id;
          // Limpiar caché de items (no hay API para limpiar, simplemente recargamos)
          await loadCategoryItems(selectedCategory);
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadCategoryItems = async (category: string) => {
    setIsLoading(true);
    try {
      const superTypeId = CATEGORY_SUPER_TYPES[category];
      
      // Obtener item-types para obtener el typeId
      const itemTypesResponse = await fetchItemTypes(superTypeId);
      
      if (itemTypesResponse.data && itemTypesResponse.data.length > 0) {
        const typeId = itemTypesResponse.data[0].id;
        
        // Intentar obtener items del caché
        const cachedItems = await getCachedItems(typeId);
        
        if (cachedItems) {
          setItems(cachedItems);
        } else {
          // Obtener items por typeId
          const allItems = await fetchAllItemsByType(typeId);
          // Guardar en caché
          await setCachedItems(typeId, allItems);
          
          // Guardar imágenes de items en caché
          const itemImages: Record<number, string> = {};
          allItems.forEach((item: any) => {
            if (item.img) {
              itemImages[item.id] = item.img;
            }
          });
          await setCachedItemImages(itemImages);
          
          setItems(allItems);
        }
      }
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    loadCategoryItems(category);
  };

  const handleToggleFavorite = async (itemId: number) => {
    await toggleFavorite(itemId);
    const favorites = await getFavorites();
    setFavorites(favorites);
  };

  const handleToggleCharacteristic = (charId: number) => {
    if (selectedCharacteristics.includes(charId)) {
      setSelectedCharacteristics(selectedCharacteristics.filter(id => id !== charId));
    } else {
      setSelectedCharacteristics([...selectedCharacteristics, charId]);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.name.es.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevelFrom = levelFrom === "" || item.level >= parseInt(levelFrom);
      const matchesLevelTo = levelTo === "" || item.level <= parseInt(levelTo);
      const matchesCharacteristics = selectedCharacteristics.length === 0 || 
        selectedCharacteristics.every(charId => 
          item.effects?.some((effect: any) => effect.characteristic === charId)
        );
      
      return matchesSearch && matchesLevelFrom && matchesLevelTo && matchesCharacteristics;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "level") {
        comparison = a.level - b.level;
      } else if (sortBy === "name") {
        comparison = a.name.es.localeCompare(b.name.es);
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const renderEffects = (effects: any[]) => {
    if (!effects || effects.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-1">
        {effects.map((effect, index) => {
          const iconFile = CHARACTERISTIC_ICONS[effect.characteristic];
          const iconUrl = iconFile ? `/assets/caracteristicas/${iconFile}` : null;
          const characteristic = characteristics.find(c => c.id === effect.characteristic);
          const charName = characteristic?.name?.es || `Característica ${effect.characteristic}`;
          
          return (
            <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
              {iconUrl ? (
                <img src={iconUrl} alt={charName} title={charName} className="w-4 h-4" />
              ) : (
                <span title={charName}>📊</span>
              )}
              <span>{effect.from} a {effect.to}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const favoriteItems = Object.keys(favorites)
    .filter(itemId => favorites[parseInt(itemId)])
    .map(itemId => items.find(item => item.id === parseInt(itemId)))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#2a213a] pt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#974133] hover:text-[#974133]/80 font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Volver al Inicio
          </Link>
          <h1 className="text-4xl font-bold text-[#ecfeca] mb-2">Equipo</h1>
          <p className="text-[#adca9a] mb-6">Gestiona tu equipo de Dofus</p>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#974133] text-white rounded-lg hover:bg-[#974133]/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
            Actualizar datos
          </button>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setSelectedCategory("Favoritos")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === "Favoritos"
                  ? "bg-[#974133] text-white"
                  : "bg-white text-[#100b2a] hover:bg-gray-100"
              }`}
            >
              ⭐ Favoritos
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-[#974133] text-white"
                    : "bg-white text-[#100b2a] hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory !== "Favoritos" && (
            <div className="flex flex-wrap gap-4 mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar item..."
                className="w-full md:w-48 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
              />
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#adca9a]">Nivel:</label>
                <input
                  type="number"
                  value={levelFrom}
                  onChange={(e) => setLevelFrom(e.target.value)}
                  placeholder="De"
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={levelTo}
                  onChange={(e) => setLevelTo(e.target.value)}
                  placeholder="Hasta"
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent text-sm"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#974133] focus:border-transparent"
              >
                <option value="level">Nivel</option>
                <option value="name">Nombre</option>
              </select>

              <button
                onClick={() => handleSort(sortBy)}
                className="border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                {sortDirection === "asc" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              <select
                onChange={(e) => {
                  const charId = parseInt(e.target.value);
                  if (charId && !selectedCharacteristics.includes(charId)) {
                    handleToggleCharacteristic(charId);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded bg-white text-[#100b2a]"
              >
                <option value="" className="text-[#100b2a]">Añadir característica</option>
                {characteristics.filter(c => c.visible).map((char) => (
                  <option key={char.id} value={char.id} className="text-[#100b2a]">
                    {char.name.es}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2">
                {selectedCharacteristics.map(charId => {
                  const char = characteristics.find(c => c.id === charId);
                  if (!char) return null;
                  const iconFile = CHARACTERISTIC_ICONS[charId];
                  const iconUrl = iconFile ? `/assets/caracteristicas/${iconFile}` : null;
                  
                  return (
                    <button
                      key={charId}
                      onClick={() => handleToggleCharacteristic(charId)}
                      className="flex items-center gap-1 px-3 py-2 bg-[#974133] text-white rounded-lg hover:bg-[#974133]/80 transition-colors group"
                      title="Click para quitar"
                    >
                      {iconUrl ? (
                        <img src={iconUrl} alt="" className="w-4 h-4" />
                      ) : (
                        <span>📊</span>
                      )}
                      <span className="group-hover:line-through">{char.name.es}</span>
                      <X size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-[#ecfeca]">Cargando items...</p>
          </div>
        )}

        {selectedCategory === "Favoritos" && !isLoading && favoriteItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No tienes items favoritos</p>
          </div>
        )}

        {selectedCategory === "Favoritos" && !isLoading && favoriteItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {favoriteItems.map((item: any) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.img}
                      alt={item.name.es}
                      className="w-16 h-16 object-contain"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#100b2a] text-sm mb-1">
                        {item.name.es}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">Nivel: {item.level}</p>
                      {renderEffects(item.effects)}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="text-yellow-500 hover:text-yellow-600 transition-colors"
                      title="Quitar de favoritos"
                    >
                      <Star size={18} fill={favorites[item.id] ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCategory !== "Favoritos" && !isLoading && filteredAndSortedItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No se encontraron items</p>
          </div>
        )}

        {selectedCategory !== "Favoritos" && !isLoading && filteredAndSortedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredAndSortedItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.img}
                      alt={item.name.es}
                      className="w-16 h-16 object-contain"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#100b2a] text-sm mb-1">
                        {item.name.es}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">Nivel: {item.level}</p>
                      {renderEffects(item.effects)}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="text-yellow-500 hover:text-yellow-600 transition-colors"
                      title={favorites[item.id] ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      <Star size={18} fill={favorites[item.id] ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
