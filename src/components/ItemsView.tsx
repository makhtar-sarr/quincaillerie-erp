import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  AlertTriangle, 
  History, 
  Settings, 
  CheckCircle,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { Item, Category, StockMovement } from '../types';
import { formatFCFA } from '../utils/data';

interface ItemsViewProps {
  items: Item[];
  movements: StockMovement[];
  onAddItem: (item: Omit<Item, 'id' | 'stockCount'>, initialQty: number, operator: string) => void;
  onUpdateItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  onAdjustStock: (itemId: string, qty: number, type: 'ENTREE' | 'SORTIE', reason: StockMovement['reason'], operator: string, ref: string) => void;
}

export default function ItemsView({
  items,
  movements,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAdjustStock
}: ItemsViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'out'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Add item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemRef, setNewItemRef] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>('Ciment & Matériaux');
  const [newItemUnit, setNewItemUnit] = useState('Sac');
  const [newItemMinStock, setNewItemMinStock] = useState(10);
  const [newItemInitialQty, setNewItemInitialQty] = useState(0);
  const [newItemBuying, setNewItemBuying] = useState(1000);
  const [newItemSelling, setNewItemSelling] = useState(1200);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [operatorName, setOperatorName] = useState('Abdou');

  // Adjust stock form state
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustType, setAdjustType] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [adjustReason, setAdjustReason] = useState<StockMovement['reason']>('Achat Fournisseur');
  const [adjustRefCode, setAdjustRefCode] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const categories: Category[] = [
    'Ciment & Matériaux',
    'Fer & Métaux',
    'Peinture & Finition',
    'Plomberie & Sanitaire',
    'Électricité & Éclairage',
    'Outillage & Sécurité',
    'Divers'
  ];

  // Filtering items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.ref.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'Tous' || item.category === categoryFilter;
      
      let matchStatus = true;
      if (statusFilter === 'alert') {
        matchStatus = item.stockCount <= item.minStock && item.stockCount > 0;
      } else if (statusFilter === 'out') {
        matchStatus = item.stockCount <= 0;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  // Filtering movements
  const [historySearch, setHistorySearch] = useState('');
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      const matchItemName = mov.itemName.toLowerCase().includes(historySearch.toLowerCase()) ||
                            mov.referenceCode.toLowerCase().includes(historySearch.toLowerCase());
      return matchItemName;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, historySearch]);

  const handleOpenAdjust = (item: Item, type: 'ENTREE' | 'SORTIE') => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustReason(type === 'ENTREE' ? 'Achat Fournisseur' : 'Perte / Casse');
    setAdjustQty(10);
    setAdjustRefCode(type === 'ENTREE' ? 'AJUST-ENTREE' : 'AJUST-PERTE');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    onAdjustStock(
      selectedItem.id,
      adjustQty,
      adjustType,
      adjustReason,
      operatorName,
      adjustRefCode || "AJUST-MANUEL"
    );
    setIsAdjustModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemRef) {
      alert("Veuillez remplir le nom et la référence de l'article");
      return;
    }
    onAddItem({
      name: newItemName,
      ref: newItemRef,
      category: newItemCategory,
      unit: newItemUnit,
      minStock: Number(newItemMinStock),
      buyingPrice: Number(newItemBuying),
      sellingPrice: Number(newItemSelling),
      description: newItemDesc
    }, Number(newItemInitialQty), operatorName);

    // reset
    setNewItemName('');
    setNewItemRef('');
    setNewItemCategory('Ciment & Matériaux');
    setNewItemUnit('Sac');
    setNewItemMinStock(10);
    setNewItemInitialQty(0);
    setNewItemBuying(1000);
    setNewItemSelling(1200);
    setNewItemDesc('');
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  const totalStockValuation = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.stockCount * item.sellingPrice), 0);
  }, [items]);

  const lowStockItemsCount = useMemo(() => {
    return items.filter(item => item.stockCount <= item.minStock).length;
  }, [items]);

  return (
    <div id="items-view-root" className="space-y-6">
      {/* Header section with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900">Catalogue & Gestion des Stocks</h2>
          <p className="text-xs text-gray-500 mt-1">Gérez vos articles, surveillez les ruptures et ajustez les stocks physiques</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg mt-4 sm:mt-0 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-1 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'catalog' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Package className="h-4 w-4" />
            <span>Catalogue</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <History className="h-4 w-4" />
            <span>Historique des Flux</span>
          </button>
        </div>
      </div>
      {activeTab === 'catalog' ? (
        <>
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100/80 border-b-4 border-b-amber-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center space-x-4">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-display block">Articles Catalogués</span>
                <span className="font-black text-slate-900 text-xl font-display">{items.length} références</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100/80 border-b-4 border-b-rose-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${lowStockItemsCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-800'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-display block">Stocks d'Alerte / Critique</span>
                <span className={`font-black text-xl font-display ${lowStockItemsCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{lowStockItemsCount} articles</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100/80 border-b-4 border-b-indigo-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center space-x-4">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-display block">Valorisation du Stock</span>
                <span className="font-black text-indigo-900 text-xl font-display">{formatFCFA(totalStockValuation)}</span>
              </div>
            </div>
          </div>

          {/* Filters and Actions bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-3xl border-2 border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, code, réf..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2.5 px-3.5 border border-slate-200 rounded-2xl text-xs bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="Tous">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <div className="flex bg-slate-100 p-1 rounded-2xl text-[11px] font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setStatusFilter('alert')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-colors cursor-pointer ${statusFilter === 'alert' ? 'bg-white text-amber-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Bas
                </button>
                <button
                  onClick={() => setStatusFilter('out')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-colors cursor-pointer ${statusFilter === 'out' ? 'bg-white text-red-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Rupture
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
              >
                <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>Nouvel Article</span>
              </button>
            </div>
          </div>

          {/* Catalog Grid/Table */}
          <div className="bg-white rounded-3xl border-2 border-slate-100/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-5">Code / Réf</th>
                    <th className="py-3.5 px-5">Nom de l'article</th>
                    <th className="py-3.5 px-5">Catégorie</th>
                    <th className="py-3.5 px-5 text-right">P. Achat</th>
                    <th className="py-3.5 px-5 text-right">P. Vente</th>
                    <th className="py-3.5 px-5 text-center">Unité</th>
                    <th className="py-3.5 px-5 text-center">Stock Actuel</th>
                    <th className="py-3.5 px-5 text-center">Ajustements</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isLow = item.stockCount <= item.minStock;
                    const isOut = item.stockCount <= 0;
                    const margin = item.sellingPrice - item.buyingPrice;
                    const marginPercent = Math.round((margin / item.sellingPrice) * 100);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-400 text-[10px]">{item.ref}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          <div>
                            <span className="text-slate-900 font-bold text-xs block">{item.name}</span>
                            {item.description && <span className="text-[10px] text-slate-400 block truncate max-w-[200px] mt-1 font-normal">{item.description}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-slate-500 font-semibold">{formatFCFA(item.buyingPrice)}</td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="font-mono font-bold text-slate-900">{formatFCFA(item.sellingPrice)}</div>
                          <div className="text-[9px] text-emerald-600 font-bold mt-0.5">Marge: +{marginPercent}%</div>
                        </td>
                        <td className="py-3.5 px-5 text-center text-slate-400 font-bold">{item.unit}</td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full font-black font-mono text-[11px] ${
                              isOut ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              isLow ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {item.stockCount} {item.unit}(s)
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1 font-bold">Min: {item.minStock}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenAdjust(item, 'ENTREE')}
                              title="Ajouter du Stock (Entrée)"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100 cursor-pointer"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(item, 'SORTIE')}
                              title="Diminuer du Stock (Sortie/Perte)"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100 cursor-pointer"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer l'article ${item.name} ?`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-mono italic">
                        Aucun article correspondant à la recherche ou au filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* History movements tab */
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">Registre des Mouvements physiques (Entrées / Sorties)</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer par article ou référence..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4">Raison</th>
                  <th className="py-3 px-4">Document Réf</th>
                  <th className="py-3 px-4 text-right">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] font-semibold">{mov.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{mov.itemName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        mov.type === 'ENTREE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-center font-mono font-black text-xs ${
                      mov.type === 'ENTREE' ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {mov.type === 'ENTREE' ? '+' : '-'}{mov.quantity}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{mov.reason}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] font-bold">{mov.referenceCode}</td>
                    <td className="py-3 px-4 text-right text-slate-500 font-bold">{mov.operator}</td>
                  </tr>
                ))}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic font-mono">
                      Aucun mouvement de stock enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW ITEM */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-slate-100 max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-6 py-5 border-b-2 border-amber-500">
                <h3 className="font-black font-display text-sm uppercase tracking-wider">Ajouter un nouvel article au catalogue</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-950 hover:text-white cursor-pointer transition-colors">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Référence / SKU *</label>
                    <input
                      type="text"
                      placeholder="e.g. SOC-CPJ-42.5"
                      value={newItemRef}
                      onChange={(e) => setNewItemRef(e.target.value.toUpperCase())}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Catégorie *</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as Category)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nom de l'article *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ciment SOCOCIM CPJ 42.5 (Sac 50kg)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold bg-slate-50/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Unité de mesure</label>
                    <input
                      type="text"
                      placeholder="Sac, Barre, Litre, etc."
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Stock de Sécurité *</label>
                    <input
                      type="number"
                      value={newItemMinStock}
                      onChange={(e) => setNewItemMinStock(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Stock Initial</label>
                    <input
                      type="number"
                      value={newItemInitialQty}
                      onChange={(e) => setNewItemInitialQty(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Prix d'Achat Unitaire (FCFA) *</label>
                    <input
                      type="number"
                      value={newItemBuying}
                      onChange={(e) => setNewItemBuying(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50 text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Prix de Vente Unitaire (FCFA) *</label>
                    <input
                      type="number"
                      value={newItemSelling}
                      onChange={(e) => setNewItemSelling(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50 text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Description</label>
                  <textarea
                    placeholder="Détails additionnels du produit..."
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl h-20 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium bg-slate-50/50"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Opérateur effectuant l'ajout</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-end justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADJUST STOCK (ENTRY/EXIT) */}
      <AnimatePresence>
        {isAdjustModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-slate-100 max-w-md w-full overflow-hidden"
            >
              <div className={`px-6 py-5 text-slate-950 flex items-center justify-between border-b-2 ${
                adjustType === 'ENTREE' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-500' : 'bg-gradient-to-r from-rose-400 to-rose-500 border-rose-500'
              }`}>
                <h3 className="font-black font-display text-sm uppercase tracking-wider">
                  {adjustType === 'ENTREE' ? 'Entrée de Stock (Réappro)' : 'Sortie de Stock (Ajustement)'}
                </h3>
                <button onClick={() => { setIsAdjustModalOpen(false); setSelectedItem(null); }} className="text-slate-950 hover:text-white cursor-pointer transition-colors">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100/50">
                  <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Article Sélectionné</span>
                  <span className="font-black text-slate-900 text-xs block mt-1">{selectedItem.name}</span>
                  <span className="text-[11px] font-bold text-slate-600 block mt-1.5">
                    Stock Actuel: <span className="font-mono font-black text-amber-600">{selectedItem.stockCount} {selectedItem.unit}(s)</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Quantité à {adjustType === 'ENTREE' ? 'ajouter' : 'déduire'} *</label>
                    <input
                      type="number"
                      min="1"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Raison du mouvement *</label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value as StockMovement['reason'])}
                      className="w-full border border-slate-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold"
                    >
                      {adjustType === 'ENTREE' ? (
                        <>
                          <option value="Achat Fournisseur">Achat Fournisseur (Arrivage)</option>
                          <option value="Retour Client">Retour de marchandise Client</option>
                          <option value="Ajustement Inventaire">Ajustement Inventaire (+)</option>
                        </>
                      ) : (
                        <>
                          <option value="Perte / Casse">Perte / Vol / Casse</option>
                          <option value="Ajustement Inventaire">Ajustement Inventaire (-)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Code Réf / N° Bon</label>
                    <input
                      type="text"
                      placeholder="e.g. BON-ACHAT-412"
                      value={adjustRefCode}
                      onChange={(e) => setAdjustRefCode(e.target.value.toUpperCase())}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Opérateur effectuant l'action *</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => { setIsAdjustModalOpen(false); setSelectedItem(null); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 text-slate-950 font-black rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                      adjustType === 'ENTREE' ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-rose-400 hover:bg-rose-500'
                    }`}
                  >
                    Valider le mouvement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-slate-100 max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-5 border-b-2 border-indigo-600">
                <h3 className="font-black font-display text-sm uppercase tracking-wider">Modifier l'article : {editingItem.name}</h3>
                <button onClick={() => setEditingItem(null)} className="text-white hover:text-slate-100 cursor-pointer transition-colors">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Référence / SKU *</label>
                    <input
                      type="text"
                      value={editingItem.ref}
                      onChange={(e) => setEditingItem({ ...editingItem, ref: e.target.value.toUpperCase() })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Catégorie *</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as Category })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nom de l'article *</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold bg-slate-50/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Unité de mesure</label>
                    <input
                      type="text"
                      value={editingItem.unit}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Stock de Sécurité Minimal *</label>
                    <input
                      type="number"
                      value={editingItem.minStock}
                      onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Prix d'Achat (FCFA) *</label>
                    <input
                      type="number"
                      value={editingItem.buyingPrice}
                      onChange={(e) => setEditingItem({ ...editingItem, buyingPrice: Number(e.target.value) })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50 text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Prix de Vente (FCFA) *</label>
                    <input
                      type="number"
                      value={editingItem.sellingPrice}
                      onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: Number(e.target.value) })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50 text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Description</label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl h-20 focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 font-medium"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
                  >
                    Sauvegarder les modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
