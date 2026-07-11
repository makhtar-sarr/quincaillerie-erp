import React, { useState, useMemo, useRef } from 'react';
import { 
  Download,
  Upload,
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  History, 
  PlusCircle,
  MinusCircle,
  TrendingUp,
} from 'lucide-react';
import { Item, Category, StockMovement } from '../types';
import { formatFCFA } from '../utils/data';
import { exportToCSV } from '@/utils/export';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table, type Column } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { useTemporalFilter } from '@/hooks/useTemporalFilter';
import { useAuth } from '@/context/AuthContext';
import { importArticlesFromCSV } from '@/utils/import';
import { useStore } from '@/context/StoreContext';

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
  const { user } = useAuth();
  const isVendeur = user?.role === 'vendeur';
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'out'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  
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

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, dispatch] = useStore();

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
  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    filterByMonth,
  } = useTemporalFilter<StockMovement>();
  const filteredMovements = useMemo(() => {
    return filterByMonth(movements).filter(mov => {
      const matchItemName = mov.itemName.toLowerCase().includes(historySearch.toLowerCase()) ||
                            mov.referenceCode.toLowerCase().includes(historySearch.toLowerCase());
      return matchItemName;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, historySearch, filterByMonth]);

  const catalogColumns = useMemo<Column[]>(() => [
    { key: 'ref', label: 'Code / Réf', className: 'py-3.5 px-5 text-xs' },
    { key: 'name', label: "Nom de l'article", className: 'py-3.5 px-5 text-xs' },
    { key: 'category', label: 'Catégorie', className: 'py-3.5 px-5 text-xs' },
    { key: 'buyingPrice', label: 'P. Achat', className: 'py-3.5 px-5 text-xs text-right' },
    { key: 'sellingPrice', label: 'P. Vente', className: 'py-3.5 px-5 text-xs text-right' },
    { key: 'unit', label: 'Unité', className: 'py-3.5 px-5 text-xs text-center' },
    { key: 'stock', label: 'Stock Actuel', className: 'py-3.5 px-5 text-xs text-center' },
    { key: 'adjustments', label: 'Ajustements', className: 'py-3.5 px-5 text-xs text-center' },
    { key: 'actions', label: 'Actions', className: 'py-3.5 px-5 text-xs text-right' },
  ], []);

  const historyColumns = useMemo<Column[]>(() => [
    { key: 'date', label: 'Date', className: 'text-xs' },
    { key: 'itemName', label: 'Article', className: 'text-xs' },
    { key: 'type', label: 'Type', className: 'text-xs text-center' },
    { key: 'quantity', label: 'Quantité', className: 'text-xs text-center' },
    { key: 'reason', label: 'Raison', className: 'text-xs' },
    { key: 'referenceCode', label: 'Document Réf', className: 'text-xs' },
    { key: 'operator', label: 'Opérateur', className: 'text-xs text-right' },
  ], []);

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
      toast.error("Veuillez remplir le nom et la référence de l'article");
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

  const handleExportCatalogCSV = () => {
    if (filteredItems.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const data = filteredItems.map(item => ({
      'Référence': item.ref,
      'Nom': item.name,
      'Catégorie': item.category,
      'Prix Achat (FCFA)': item.buyingPrice,
      'Prix Vente (FCFA)': item.sellingPrice,
      'Stock Actuel': item.stockCount,
      'Stock Min': item.minStock,
      'Unité': item.unit,
    }));
    exportToCSV(data, 'articles');
  };

  const handleExportMovementsCSV = () => {
    if (filteredMovements.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const data = filteredMovements.map(mov => ({
      'Date': mov.date,
      'Article': mov.itemName,
      'Type': mov.type,
      'Quantité': mov.quantity,
      'Raison': mov.reason,
      'Référence': mov.referenceCode,
      'Opérateur': mov.operator,
    }));
    exportToCSV(data, 'mouvements-stock');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const existingRefs = items.map(i => i.ref);
      const result = importArticlesFromCSV(content, existingRefs);

      if (result.imported > 0) {
        dispatch({ type: 'SET_ITEMS', payload: [...items, ...result.items] });
        toast.success(`${result.imported} article(s) importé(s) avec succès${result.skipped > 0 ? `, ${result.skipped} ignoré(s)` : ''}`);
      } else {
        toast.info('Aucun nouvel article importé');
      }

      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erreur(s) détectée(s) dans le fichier CSV`);
      }
    };
    reader.onerror = () => {
      toast.error('Erreur lors de la lecture du fichier');
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-foreground">Catalogue & Gestion des Stocks</h2>
          <p className="text-xs text-muted mt-1">Gérez vos articles, surveillez les ruptures et ajustez les stocks physiques</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 self-start sm:self-center">
          <Button
            variant={activeTab === 'catalog' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('catalog')}
            className="flex items-center space-x-1"
          >
            <Package className="h-4 w-4" />
            <span>Catalogue</span>
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="flex items-center space-x-1"
          >
            <History className="h-4 w-4" />
            <span>Historique des Flux</span>
          </Button>
        </div>
      </div>
      {activeTab === 'catalog' ? (
        <>
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-amber-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center space-x-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 p-3 rounded-2xl">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider font-display block">Articles Catalogués</span>
                <span className="font-black text-foreground text-xl font-display">{items.length} références</span>
              </div>
            </div>
            <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-rose-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${lowStockItemsCount > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 animate-pulse' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider font-display block">Stocks d'Alerte / Critique</span>
                <span className={`font-black text-xl font-display ${lowStockItemsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{lowStockItemsCount} articles</span>
              </div>
            </div>
            <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-indigo-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center space-x-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider font-display block">Valorisation du Stock</span>
                <span className="font-black text-indigo-900 dark:text-indigo-300 text-xl font-display">{formatFCFA(totalStockValuation)}</span>
              </div>
            </div>
          </div>

          {/* Filters and Actions bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-surface p-4 rounded-3xl border-2 border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {/* Search input */}
              <Input
                variant="search"
                icon={<Search className="h-4 w-4" />}
                placeholder="Rechercher nom, code, réf..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-2xl bg-neutral-50/50 text-xs"
              />

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2.5 px-3.5 border border-border rounded-2xl text-xs bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="Tous">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <div className="flex gap-1.5 text-[11px] font-bold">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter('all')}
                  className="flex-1"
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setStatusFilter('alert')}
                  className={cn('flex-1', statusFilter === 'alert' && 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 shadow-xs font-black')}
                >
                  Bas
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setStatusFilter('out')}
                  className={cn('flex-1', statusFilter === 'out' && 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-red-700 dark:text-red-400 shadow-xs font-black')}
                >
                  Rupture
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={handleExportCatalogCSV}>
                <Download className="w-4 h-4" />
                <span>Exporter CSV</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                <span>Importer CSV</span>
              </Button>
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleImportCSV} className="hidden" />
              {!isVendeur && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-1.5"
                >
                  <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span>Nouvel Article</span>
                </Button>
              )}
            </div>
          </div>

          {/* Catalog Grid/Table - Desktop */}
          <div className="hidden md:block bg-surface rounded-3xl border-2 border-border/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)] overflow-hidden">
            <Table
              columns={[
                { key: 'ref', label: 'Code / Réf', className: 'py-3.5 px-5' },
                { key: 'name', label: 'Nom de l\'article', className: 'py-3.5 px-5' },
                { key: 'category', label: 'Catégorie', className: 'py-3.5 px-5' },
                { key: 'buyingPrice', label: 'P. Achat', className: 'py-3.5 px-5 text-right' },
                { key: 'sellingPrice', label: 'P. Vente', className: 'py-3.5 px-5 text-right' },
                { key: 'unit', label: 'Unité', className: 'py-3.5 px-5 text-center' },
                { key: 'stock', label: 'Stock Actuel', className: 'py-3.5 px-5 text-center' },
                { key: 'adjustments', label: 'Ajustements', className: 'py-3.5 px-5 text-center' },
                { key: 'actions', label: 'Actions', className: 'py-3.5 px-5 text-right' },
              ]}
              data={filteredItems.map((item) => {
                const isLow = item.stockCount <= item.minStock;
                const isOut = item.stockCount <= 0;
                const margin = item.sellingPrice - item.buyingPrice;
                const marginPercent = Math.round((margin / item.sellingPrice) * 100);

                return {
                  ref: <span className="font-mono font-bold text-muted text-[10px]">{item.ref}</span>,
                  name: (
                    <div>
                      <span className="text-foreground font-bold text-xs block">{item.name}</span>
                      {item.description && <span className="text-[10px] text-muted block truncate max-w-[200px] mt-1 font-normal">{item.description}</span>}
                    </div>
                  ),
                  category: (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-neutral-100 dark:bg-neutral-200 text-foreground">
                      {item.category}
                    </span>
                  ),
                  buyingPrice: <span className="font-mono text-muted font-semibold">{formatFCFA(item.buyingPrice)}</span>,
                  sellingPrice: (
                    <>
                      <div className="font-mono font-bold text-foreground">{formatFCFA(item.sellingPrice)}</div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Marge: +{marginPercent}%</div>
                    </>
                  ),
                  unit: <span className="text-muted font-bold">{item.unit}</span>,
                  stock: (
                    <div className="flex flex-col items-center">
                      <span className={`px-3 py-1 rounded-full font-black font-mono text-[11px] ${
                        isOut ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                        isLow ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse' :
                        'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {item.stockCount} {item.unit}(s)
                      </span>
                      <span className="text-[9px] text-muted mt-1 font-bold">Min: {item.minStock}</span>
                    </div>
                  ),
                  adjustments: (
                    <div className="flex justify-center space-x-1.5">
                      {!isVendeur && (
                        <>
                          <Button
                            variant="icon"
                            onClick={() => handleOpenAdjust(item, 'ENTREE')}
                            title="Ajouter du Stock (Entrée)"
                            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="icon"
                            onClick={() => handleOpenAdjust(item, 'SORTIE')}
                            title="Diminuer du Stock (Sortie/Perte)"
                            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-100 dark:border-rose-800"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ),
                  actions: (
                    <div className="flex items-center justify-end space-x-1">
                      {!isVendeur && (
                        <>
                          <Button variant="icon" onClick={() => setEditingItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="icon"
                            onClick={() => setItemToDelete(item)}
                            className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ),
                };
              })}
              emptyMessage="Aucun article correspondant à la recherche ou au filtre."
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredItems.map((item) => {
              const isLow = item.stockCount <= item.minStock;
              const isOut = item.stockCount <= 0;
              const margin = item.sellingPrice - item.buyingPrice;
              const marginPercent = Math.round((margin / item.sellingPrice) * 100);

              return (
                <div key={item.id} className="bg-surface p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground text-sm">{item.name}</p>
                      <p className="text-xs text-muted font-mono">{item.ref}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-black font-mono text-[11px] ${
                      isOut ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' :
                      isLow ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                      'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {item.stockCount}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 dark:bg-neutral-200 text-muted">{item.category}</span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 dark:bg-neutral-200 text-muted">{item.unit}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted font-semibold">Achat</span>
                      <p className="font-mono font-bold text-foreground">{formatFCFA(item.buyingPrice)}</p>
                    </div>
                    <div>
                      <span className="text-muted font-semibold">Vente</span>
                      <p className="font-mono font-bold text-foreground">{formatFCFA(item.sellingPrice)}</p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Marge: +{marginPercent}%</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center pt-3 border-t border-border">
                    {!isVendeur && (
                      <>
                        <div className="flex gap-1.5">
                          <Button
                            variant="icon"
                            onClick={() => handleOpenAdjust(item, 'ENTREE')}
                            title="Ajouter du Stock (Entrée)"
                            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="icon"
                            onClick={() => handleOpenAdjust(item, 'SORTIE')}
                            title="Diminuer du Stock (Sortie/Perte)"
                            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-100 dark:border-rose-800"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="icon"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="icon"
                            onClick={() => setItemToDelete(item)}
                            className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-muted font-mono italic bg-surface rounded-xl border border-dashed border-border">
                Aucun article correspondant à la recherche ou au filtre.
              </div>
            )}
          </div>
        </>
      ) : (
        /* History movements tab */
        <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-sm font-black text-foreground font-display uppercase tracking-wider">Registre des Mouvements physiques (Entrées / Sorties)</h3>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportMovementsCSV}>
                <Download className="w-4 h-4" />
                <span>Exporter CSV</span>
              </Button>
              {/* Month selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="py-2 px-3 border border-border rounded-2xl text-xs bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-semibold"
              >
                <option value={0}>Tous les mois</option>
                <option value={1}>Janvier</option>
                <option value={2}>Février</option>
                <option value={3}>Mars</option>
                <option value={4}>Avril</option>
                <option value={5}>Mai</option>
                <option value={6}>Juin</option>
                <option value={7}>Juillet</option>
                <option value={8}>Août</option>
                <option value={9}>Septembre</option>
                <option value={10}>Octobre</option>
                <option value={11}>Novembre</option>
                <option value={12}>Décembre</option>
              </select>
              {/* Year selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="py-2 px-3 border border-border rounded-2xl text-xs bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-semibold"
              >
                <option value={0}>Toutes les années</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Input
                variant="search"
                icon={<Search className="h-4 w-4" />}
                placeholder="Filtrer par article ou référence..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full sm:w-56 rounded-2xl bg-neutral-50/50 text-xs"
              />
            </div>
          </div>

          <Table
            className="rounded-2xl border border-border"
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'article', label: 'Article' },
              { key: 'type', label: 'Type', className: 'text-center' },
              { key: 'quantity', label: 'Quantité', className: 'text-center' },
              { key: 'reason', label: 'Raison' },
              { key: 'reference', label: 'Document Réf' },
              { key: 'operator', label: 'Opérateur', className: 'text-right' },
            ]}
            data={filteredMovements.map((mov) => ({
              date: <span className="font-mono text-muted text-[11px] font-semibold">{mov.date}</span>,
              article: <span className="font-bold text-foreground">{mov.itemName}</span>,
              type: (
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  mov.type === 'ENTREE' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                }`}>
                  {mov.type}
                </span>
              ),
              quantity: (
                <span className={`font-mono font-black text-xs ${
                  mov.type === 'ENTREE' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {mov.type === 'ENTREE' ? '+' : '-'}{mov.quantity}
                </span>
              ),
              reason: <span className="text-foreground font-semibold">{mov.reason}</span>,
              reference: <span className="font-mono text-muted text-[11px] font-bold">{mov.referenceCode}</span>,
              operator: <span className="text-muted font-bold">{mov.operator}</span>,
            }))}
            emptyMessage="Aucun mouvement de stock enregistré."
          />
        </div>
      )}

      {/* MODAL 1: ADD NEW ITEM */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un nouvel article au catalogue"
        icon={Package}
        size="lg"
        footer={
          <div className="flex items-end justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="add-item-form">
              Enregistrer
            </Button>
          </div>
        }
      >
        <form id="add-item-form" onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Référence / SKU *</label>
              <input
                type="text"
                placeholder="e.g. SOC-CPJ-42.5"
                value={newItemRef}
                onChange={(e) => setNewItemRef(e.target.value.toUpperCase())}
                className="w-full border border-border p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                required
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Catégorie *</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as Category)}
                className="w-full border border-border p-2.5 rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-muted font-bold mb-1">Nom de l'article *</label>
            <input
              type="text"
              placeholder="e.g. Ciment SOCOCIM CPJ 42.5 (Sac 50kg)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden font-bold bg-neutral-50/50 dark:bg-neutral-200/30"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-muted font-bold mb-1">Unité de mesure</label>
              <input
                type="text"
                placeholder="Sac, Barre, Litre, etc."
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden font-bold bg-neutral-50/50 dark:bg-neutral-200/30"
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Stock de Sécurité *</label>
              <input
                type="number"
                value={newItemMinStock}
                onChange={(e) => setNewItemMinStock(Number(e.target.value))}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                required
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Stock Initial</label>
              <input
                type="number"
                value={newItemInitialQty}
                onChange={(e) => setNewItemInitialQty(Number(e.target.value))}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Prix d'Achat Unitaire (FCFA) *</label>
              <input
                type="number"
                value={newItemBuying}
                onChange={(e) => setNewItemBuying(Number(e.target.value))}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30 text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Prix de Vente Unitaire (FCFA) *</label>
              <input
                type="number"
                value={newItemSelling}
                onChange={(e) => setNewItemSelling(Number(e.target.value))}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30 text-foreground"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-muted font-bold mb-1">Description</label>
            <textarea
              placeholder="Détails additionnels du produit..."
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl h-20 focus:ring-2 focus:ring-primary focus:outline-hidden font-medium bg-neutral-50/50 dark:bg-neutral-200/30"
            />
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Opérateur effectuant l'ajout</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-200 border border-border p-2.5 rounded-xl font-bold text-foreground focus:outline-hidden"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADJUST STOCK (ENTRY/EXIT) */}
      <Modal
        isOpen={isAdjustModalOpen && !!selectedItem}
        onClose={() => { setIsAdjustModalOpen(false); setSelectedItem(null); }}
        title={adjustType === 'ENTREE' ? 'Entrée de Stock (Réappro)' : 'Sortie de Stock (Ajustement)'}
        icon={History}
        size="md"
        variant={adjustType === 'SORTIE' ? 'danger' : 'default'}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => { setIsAdjustModalOpen(false); setSelectedItem(null); }}>
              Annuler
            </Button>
            <Button variant={adjustType === 'ENTREE' ? 'success' : 'danger'} type="submit" form="adjust-stock-form">
              Valider le mouvement
            </Button>
          </div>
        }
      >
        <form id="adjust-stock-form" onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          {selectedItem && (
            <>
              <div className="bg-neutral-50 dark:bg-neutral-200 p-4 rounded-2xl border-2 border-border/50">
                <span className="text-[10px] text-muted block font-black uppercase tracking-wider">Article Sélectionné</span>
                <span className="font-black text-foreground text-xs block mt-1">{selectedItem.name}</span>
                <span className="text-[11px] font-bold text-foreground block mt-1.5">
                  Stock Actuel: <span className="font-mono font-black text-amber-600">{selectedItem.stockCount} {selectedItem.unit}(s)</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-bold mb-1">Quantité à {adjustType === 'ENTREE' ? 'ajouter' : 'déduire'} *</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-border p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1">Raison du mouvement *</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as StockMovement['reason'])}
                    className="w-full border border-border p-2.5 rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
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
                  <label className="block text-muted font-bold mb-1">Code Réf / N° Bon</label>
                  <input
                    type="text"
                    placeholder="e.g. BON-ACHAT-412"
                    value={adjustRefCode}
                    onChange={(e) => setAdjustRefCode(e.target.value.toUpperCase())}
                    className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                  />
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1">Opérateur effectuant l'action *</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                    required
                  />
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Modifier l'article : ${editingItem?.name || ''}`}
        icon={Edit}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setEditingItem(null)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="edit-item-form">
              Sauvegarder les modifications
            </Button>
          </div>
        }
      >
        {editingItem && (
          <form id="edit-item-form" onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-muted font-bold mb-1">Référence / SKU *</label>
                <input
                  type="text"
                  value={editingItem.ref}
                  onChange={(e) => setEditingItem({ ...editingItem, ref: e.target.value.toUpperCase() })}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                  required
                />
              </div>
              <div>
                <label className="block text-muted font-bold mb-1">Catégorie *</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as Category })}
                  className="w-full border border-border p-2.5 rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-muted font-bold mb-1">Nom de l'article *</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden font-bold bg-neutral-50/50 dark:bg-neutral-200/30"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted font-bold mb-1">Unité de mesure</label>
                <input
                  type="text"
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  className="w-full border border-border p-2.5 rounded-xl focus:ring-2 focus:ring-primary bg-neutral-50/50 dark:bg-neutral-200/30 font-semibold"
                />
              </div>
              <div>
                <label className="block text-muted font-bold mb-1">Stock de Sécurité Minimal *</label>
                <input
                  type="number"
                  value={editingItem.minStock}
                  onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-muted font-bold mb-1">Prix d'Achat (FCFA) *</label>
                <input
                  type="number"
                  value={editingItem.buyingPrice}
                  onChange={(e) => setEditingItem({ ...editingItem, buyingPrice: Number(e.target.value) })}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-muted font-bold mb-1">Prix de Vente (FCFA) *</label>
                <input
                  type="number"
                  value={editingItem.sellingPrice}
                  onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: Number(e.target.value) })}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-200/30 text-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-muted font-bold mb-1">Description</label>
              <textarea
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl h-20 focus:ring-2 focus:ring-primary bg-neutral-50/50 dark:bg-neutral-200/30 font-medium"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirmer la suppression"
        icon={AlertTriangle}
        size="sm"
        variant="danger"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (itemToDelete) {
                  onDeleteItem(itemToDelete.id);
                  toast.success(`Article "${itemToDelete.name}" supprimé avec succès`);
                  setItemToDelete(null);
                }
              }}
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          Êtes-vous sûr de vouloir supprimer l'article <strong>{itemToDelete?.name}</strong> ? Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
