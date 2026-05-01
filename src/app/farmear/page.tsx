'use client';

import { useState, useEffect } from 'react';
import { getFarmedItems, addFarmedItem, deleteFarmedItem, updateFarmedItem } from '@/lib/storage-sql';
import { fetchItemTypes, fetchAllItemsByType } from '@/lib/dofus-api';
import { Plus, Trash2, Save, X, Search } from 'lucide-react';

interface FarmedItem {
  id: string;
  itemId: number;
  itemIcon: string;
  itemName: string;
  category: string;
  notes: string;
  createdAt: string;
}

export default function FarmearPage() {
  const [farmedItems, setFarmedItems] = useState<FarmedItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState<Record<string, string | undefined>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<Record<number, any[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    loadFarmedItems();
  }, []);

  const loadFarmedItems = async () => {
    const items = await getFarmedItems();
    setFarmedItems(items);
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      // Cargar todas las categorías de items con paginación
      const allCategories: any[] = [];
      let skip = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`https://api.dofusdb.fr/item-types?$limit=${limit}&$skip=${skip}`);
        const data = await response.json();
        allCategories.push(...data.data);
        
        if (data.data.length < limit) {
          hasMore = false;
        } else {
          skip += limit;
        }
      }

      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadItemsForCategory = async (categoryId: number) => {
    setLoadingItems(true);
    try {
      const items = await fetchAllItemsByType(categoryId);
      setItemsByCategory(prev => ({ ...prev, [categoryId]: items }));
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddClick = () => {
    setShowAddModal(true);
    setSelectedCategory(null);
    setSelectedItem(null);
    setCategorySearch('');
    setItemSearch('');
    loadCategories();
  };

  const handleCategorySelect = async (categoryId: number) => {
    setSelectedCategory(categoryId);
    setSelectedItem(null);
    setItemSearch('');
    if (!itemsByCategory[categoryId]) {
      await loadItemsForCategory(categoryId);
    }
  };

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
  };

  const handleSaveItem = async () => {
    if (!selectedItem) return;

    const newItem: FarmedItem = {
      id: Date.now().toString(),
      itemId: selectedItem.id,
      itemIcon: selectedItem.img || '',
      itemName: selectedItem.name?.es || selectedItem.name?.fr || 'Unknown',
      category: categories.find(c => c.id === selectedCategory)?.name?.es || 'Unknown',
      notes: '',
      createdAt: new Date().toISOString()
    };

    await addFarmedItem(newItem);
    await loadFarmedItems();
    setShowAddModal(false);
    setSelectedItem(null);
    setSelectedCategory(null);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteFarmedItem(id);
    await loadFarmedItems();
  };

  const handleEditNotes = (id: string, currentNotes: string) => {
    setEditingNotes(prev => ({ ...prev, [id]: currentNotes }));
  };

  const handleSaveNotes = async (id: string) => {
    const notes = editingNotes[id];
    if (notes !== undefined) {
      await updateFarmedItem(id, notes);
      await loadFarmedItems();
      setEditingNotes(prev => ({ ...prev, [id]: undefined }));
    }
  };

  const handleCancelNotes = (id: string) => {
    setEditingNotes(prev => ({ ...prev, [id]: undefined }));
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.es?.toLowerCase().includes(categorySearch.toLowerCase()) ||
    cat.name?.fr?.toLowerCase().includes(categorySearch.toLowerCase()) ||
    cat.name?.en?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredItems = farmedItems.filter((item: FarmedItem) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredItemsInCategory = selectedCategory && itemsByCategory[selectedCategory]
    ? itemsByCategory[selectedCategory].filter((item: any) =>
        item.name?.es?.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.name?.fr?.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.name?.en?.toLowerCase().includes(itemSearch.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-[#100b2a] text-[#ecfeca]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Farmear Objetos</h1>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-[#adca9a] text-[#100b2a] px-4 py-2 rounded-lg hover:bg-[#8fa87d] transition-colors"
          >
            <Plus size={20} />
            Agregar Objeto
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#adca9a]" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1538] border border-[#adca9a] rounded-lg pl-10 pr-4 py-2 text-[#ecfeca] placeholder-[#adca9a] focus:outline-none focus:ring-2 focus:ring-[#adca9a]"
          />
        </div>

        {/* Table */}
        <div className="bg-[#1a1538] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#242040]">
              <tr>
                <th className="px-4 py-3 text-left">Icono</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Notas</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#adca9a]">
                    No hay objetos farmeados. Agrega uno para comenzar.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-[#adca9a]/20 hover:bg-[#242040]/50">
                    <td className="px-4 py-3">
                      {item.itemIcon ? (
                        <img
                          src={item.itemIcon.startsWith('http') ? item.itemIcon : `https://static.ankama.com/dofus/renderer/equipments/${item.itemIcon}`}
                          alt={item.itemName}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[#242040] rounded flex items-center justify-center text-[#adca9a] text-xs">
                          ?
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3 text-[#adca9a]">{item.category}</td>
                    <td className="px-4 py-3 text-[#adca9a]">
                      {new Date(item.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {editingNotes[item.id] !== undefined ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingNotes[item.id]}
                            onChange={(e) => setEditingNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="bg-[#100b2a] border border-[#adca9a] rounded px-2 py-1 text-[#ecfeca] w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#adca9a]"
                          />
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            className="text-[#adca9a] hover:text-[#ecfeca] transition-colors"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => handleCancelNotes(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditNotes(item.id, item.notes || '')}
                          className="text-[#adca9a] hover:text-[#ecfeca] transition-colors text-left"
                        >
                          {item.notes || <span className="italic text-[#adca9a]/50">Agregar nota...</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1538] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Agregar Objeto Farmeado</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#adca9a] hover:text-[#ecfeca] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Buscar categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: pelo, recurso, arma..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full bg-[#100b2a] border border-[#adca9a] rounded px-3 py-2 text-[#ecfeca] placeholder-[#adca9a] focus:outline-none focus:ring-2 focus:ring-[#adca9a]"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría ({filteredCategories.length} de {categories.length})</label>
                  {loadingCategories ? (
                    <div className="text-[#adca9a]">Cargando categorías...</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-2 rounded text-sm transition-colors ${
                            selectedCategory === cat.id
                              ? 'bg-[#adca9a] text-[#100b2a]'
                              : 'bg-[#100b2a] text-[#ecfeca] hover:bg-[#242040]'
                          }`}
                        >
                          {cat.name?.es || cat.name?.fr || 'Unknown'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item Selection */}
                {selectedCategory && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Buscar objeto</label>
                    <input
                      type="text"
                      placeholder="Ej: dragopedo, amuleto..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-[#100b2a] border border-[#adca9a] rounded px-3 py-2 text-[#ecfeca] placeholder-[#adca9a] focus:outline-none focus:ring-2 focus:ring-[#adca9a] mb-2"
                    />
                    <label className="block text-sm font-medium mb-2">Objeto ({filteredItemsInCategory.length} de {itemsByCategory[selectedCategory]?.length || 0})</label>
                    {loadingItems ? (
                      <div className="text-[#adca9a]">Cargando objetos...</div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                        {filteredItemsInCategory.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemSelect(item)}
                            className={`p-2 rounded flex flex-col items-center gap-1 transition-colors ${
                              selectedItem?.id === item.id
                                ? 'bg-[#adca9a] text-[#100b2a]'
                                : 'bg-[#100b2a] text-[#ecfeca] hover:bg-[#242040]'
                            }`}
                          >
                            {item.img && (
                              <img
                                src={item.img}
                                alt={item.name?.es || item.name?.fr}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-xs text-center">{item.name?.es || item.name?.fr || 'Unknown'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Item Preview */}
                {selectedItem && (
                  <div className="bg-[#100b2a] p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      {selectedItem.image?.url && (
                        <img
                          src={`https://static.ankama.com/dofus/renderer/equipments/${selectedItem.image.url}`}
                          alt={selectedItem.name?.es || selectedItem.name?.fr}
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <h3 className="font-bold">{selectedItem.name?.es || selectedItem.name?.fr || 'Unknown'}</h3>
                        <p className="text-[#adca9a] text-sm">
                          {categories.find(c => c.id === selectedCategory)?.name?.es || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {selectedItem && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg bg-[#100b2a] text-[#ecfeca] hover:bg-[#242040] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveItem}
                      className="px-4 py-2 rounded-lg bg-[#adca9a] text-[#100b2a] hover:bg-[#8fa87d] transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
