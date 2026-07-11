import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown,
  ChevronUp,
  Download,
  FileText, 
  Plus, 
  Search, 
  Printer, 
  ArrowRight, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Calendar, 
  X, 
  Check, 
  XCircle,
  FileCheck2,
  DollarSign,
  User,
  ShoppingBag,
  QrCode,
  AlertTriangle,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { Quote, Item, Customer } from '../types';
import { formatFCFA } from '../utils/data';
import { exportToCSV } from '@/utils/export';
import { exportToPDFQuotes } from '@/utils/pdf';
import { useQuoteForm } from '../hooks/useQuoteForm';
import { useTemporalFilter } from '../hooks/useTemporalFilter';
import { useStore } from '@/context/StoreContext';
import { Modal } from './ui/Modal';
import { Table } from './ui/Table';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';

interface DevisViewProps {
  quotes: Quote[];
  items: Item[];
  customers: Customer[];
  onAddQuote: (quote: Omit<Quote, 'id' | 'number'>) => void;
  onUpdateQuoteStatus: (id: string, status: Quote['status']) => void;
  onDeleteQuote: (id: string) => void;
  onConvertQuoteToInvoice: (quote: Quote, paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement', amountPaid: number, operator: string) => void;
}

export default function DevisView({
  quotes,
  items,
  customers,
  onAddQuote,
  onUpdateQuoteStatus,
  onDeleteQuote,
  onConvertQuoteToInvoice
}: DevisViewProps) {
  const { user } = useAuth();
  const isMagasinier = user?.role === 'magasinier';
  // UI-only state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<Quote | null>(null);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  // Conversion wizard state
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement'>('Espèces');
  const [convertAmountPaid, setConvertAmountPaid] = useState<number>(0);
  const [convertOperator, setConvertOperator] = useState('Abdou');

  // Quote form logic via hook
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    filteredQuotes,
    customerId, setCustomerId,
    quoteDate, setQuoteDate,
    expiryDate, setExpiryDate,
    lines: quoteLines,
    tempItemId, setTempItemId,
    tempQty, setTempQty,
    tempPrice, setTempPrice,
    discount, setDiscount,
    notes, setNotes,
    totals,
    handleTempProductChange,
    handleAddLine,
    removeLine,
    fieldErrors,
    handleSaveQuote: hookSaveQuote,
  } = useQuoteForm(quotes, items, customers, onAddQuote, onUpdateQuoteStatus, onConvertQuoteToInvoice);

  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, filterByMonth } = useTemporalFilter<Quote>();
  const [{ settings }] = useStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters: date range + amount range (additive on top of form search/status)
  const advancedSearch = useAdvancedSearch(filteredQuotes, {
    dateField: 'date',
    amountField: 'total',
  });

  const displayedQuotes = useMemo(() => {
    return filterByMonth(advancedSearch.filtered);
  }, [advancedSearch.filtered, filterByMonth]);

  const handleSaveQuote = async (status: Quote['status']) => {
    if (await hookSaveQuote(status)) {
      setIsCreateOpen(false);
    }
  };

  // Trigger conversion
  const handleOpenConvert = (quote: Quote) => {
    setQuoteToConvert(quote);
    setConvertAmountPaid(quote.total); // prefill with full amount
    setIsConvertOpen(true);
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteToConvert) return;
    onConvertQuoteToInvoice(
      quoteToConvert,
      convertPaymentMethod,
      Number(convertAmountPaid),
      convertOperator
    );
    setIsConvertOpen(false);
    setQuoteToConvert(null);
  };

  const printQuote = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (displayedQuotes.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const data = displayedQuotes.map(q => ({
      'N° Dévis': q.number,
      'Date': q.date,
      'Client': q.customerName,
      'Expire le': q.expiryDate,
      'Total Net (FCFA)': q.total,
      'Statut': q.status,
    }));
    exportToCSV(data, 'devis');
  };

  const handleExportPDF = () => {
    if (displayedQuotes.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    exportToPDFQuotes(displayedQuotes, 'devis-export.pdf', settings.storeName);
  };

  // Table column definitions and data
  const quotesColumns = [
    { key: 'number', label: 'N° Dévis' },
    { key: 'date', label: 'Date Émission' },
    { key: 'customer', label: 'Client' },
    { key: 'articleCount', label: 'Articles', className: 'text-right' },
    { key: 'total', label: 'Total Net (FCFA)', className: 'text-right' },
    { key: 'status', label: 'Statut', className: 'text-center' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ];

  const quotesData = displayedQuotes.map((q) => {
    const totalItemsCount = q.items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      number: <span className="font-mono font-black text-foreground">{q.number}</span>,
      date: <span className="text-muted font-bold">{q.date}</span>,
      customer: (
        <>
          <div className="font-bold text-foreground">{q.customerName}</div>
          <div className="text-[10px] text-muted font-semibold mt-0.5">Valide jusqu'au {q.expiryDate}</div>
        </>
      ),
      articleCount: <span className="text-muted font-mono font-black">{totalItemsCount}</span>,
      total: <span className="font-mono font-black text-foreground">{formatFCFA(q.total)}</span>,
      status: (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
          q.status === 'Accepté' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' :
          q.status === 'Envoyé' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300' :
          q.status === 'Brouillon' ? 'bg-neutral-100 dark:bg-neutral-200 text-foreground' :
          'bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
        }`}>
          {q.status}
        </span>
      ),
      actions: (
        <div className="flex items-center justify-end space-x-2">
          {!isMagasinier && q.status === 'Envoyé' && (
            <Button
              variant="icon"
              onClick={() => onUpdateQuoteStatus(q.id, 'Accepté')}
              title="Marquer comme Accepté"
              className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Check className="h-4.5 w-4.5 stroke-[2.5]" />
            </Button>
          )}
          {!isMagasinier && q.status === 'Accepté' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleOpenConvert(q)}
              className="font-black text-[9px] uppercase tracking-wider shadow-sm"
            >
              <ArrowRight className="h-3 w-3 stroke-[3]" />
              <span>Facturer</span>
            </Button>
          )}
          <Button
            variant="icon"
            onClick={() => setSelectedQuoteForPrint(q)}
            title="Imprimer / Devis Proforma"
          >
            <Printer className="h-4.5 w-4.5 stroke-[2]" />
          </Button>
          {!isMagasinier && (
            <Button
              variant="icon"
              onClick={() => setQuoteToDelete(q)}
              className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2]" />
            </Button>
          )}
        </div>
      ),
    };
  });

  const lineItemColumns = [
    { key: 'itemName', label: 'Désignation' },
    { key: 'unit', label: 'Unité', className: 'text-center' },
    { key: 'quantity', label: 'Quantité', className: 'text-center' },
    { key: 'price', label: 'Prix Unitaire (FCFA)', className: 'text-right' },
    { key: 'total', label: 'Total HT (FCFA)', className: 'text-right' },
    { key: 'delete', label: '', className: 'text-right' },
  ];

  const lineItemData = quoteLines.map((line, idx) => ({
    itemName: <span className="font-bold text-foreground">{line.itemName}</span>,
    unit: <span className="text-muted font-semibold">{line.unit}</span>,
    quantity: (
      <div>
        <span className="font-mono font-black text-foreground bg-neutral-50/30 px-2 py-0.5 rounded">{line.quantity}</span>
        {fieldErrors[`items.${idx}.quantity`] && (
          <p className="text-danger text-[9px] font-bold mt-0.5">{fieldErrors[`items.${idx}.quantity`]}</p>
        )}
      </div>
    ),
    price: (
      <div>
        <span className="font-mono text-muted font-bold">{formatFCFA(line.price)}</span>
        {fieldErrors[`items.${idx}.price`] && (
          <p className="text-danger text-[9px] font-bold mt-0.5">{fieldErrors[`items.${idx}.price`]}</p>
        )}
      </div>
    ),
    total: <span className="font-mono font-black text-foreground">{formatFCFA(line.total)}</span>,
    delete: (
      <Button
        variant="icon"
        type="button"
        onClick={() => removeLine(idx)}
        className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-4.5 w-4.5" />
      </Button>
    ),
  }));

  const printColumns = [
    { key: 'itemName', label: 'Réf / Article' },
    { key: 'unit', label: 'Unité', className: 'text-center' },
    { key: 'quantity', label: 'Qté', className: 'text-center' },
    { key: 'price', label: 'P.U. (FCFA)', className: 'text-right' },
    { key: 'total', label: 'Total (FCFA)', className: 'text-right' },
  ];

  const printData = selectedQuoteForPrint ? selectedQuoteForPrint.items.map((line) => ({
    itemName: <span className="font-bold text-foreground">{line.itemName}</span>,
    unit: <span className="text-muted font-semibold">{line.unit}</span>,
    quantity: <span className="font-mono font-black text-foreground">{line.quantity}</span>,
    price: <span className="font-mono font-bold text-muted">{formatFCFA(line.price)}</span>,
    total: <span className="font-mono font-black text-foreground">{formatFCFA(line.total)}</span>,
  })) : [];

  return (
    <div id="devis-view-root" className="space-y-6">
      {/* Printable Area - Hidden on standard web layout via print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Main View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-border pb-5">
        <div>
          <h2 className="text-xl font-black font-display text-foreground uppercase tracking-wide">Dévis & Proformas</h2>
          <p className="text-xs text-muted mt-1 font-semibold">Créez des propositions tarifaires détaillées et convertissez-les en factures de vente d'un clic</p>
        </div>
        {!isMagasinier && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 mt-4 sm:mt-0 self-start uppercase tracking-wider font-display font-black"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Faire un Dévis</span>
          </Button>
        )}
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-surface p-5 rounded-[2rem] border-2 border-border shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted stroke-[2.5]" />
          <input
            type="text"
            placeholder="Rechercher par N° de dévis ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50"
          />
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-[10px] text-muted font-black uppercase tracking-wider font-mono">Statut:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-3 pl-3 pr-8 border border-border rounded-xl text-xs font-bold bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Envoyé">Envoyé</option>
            <option value="Accepté">Accepté</option>
            <option value="Expiré">Expiré</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-muted font-black uppercase tracking-wider font-mono">Mois:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="py-3 pl-3 pr-8 border border-border rounded-xl text-xs font-bold bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            <option value={0}>Tous</option>
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
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-muted font-black uppercase tracking-wider font-mono">Année:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="py-3 pl-3 pr-8 border border-border rounded-xl text-xs font-bold bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            <option value={0}>Tous</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${
            showAdvanced || advancedSearch.activeFilterCount > 0
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border text-muted hover:bg-neutral-50 dark:hover:bg-neutral-200/50'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filtres</span>
          {advancedSearch.activeFilterCount > 0 && (
            <span className="bg-primary text-white dark:text-neutral-900 text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center">
              {advancedSearch.activeFilterCount}
            </span>
          )}
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Advanced filter panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface p-4 rounded-[2rem] border-2 border-primary/20 shadow-xs text-xs -mt-1">
              <div className="flex flex-wrap items-end gap-4">
                {/* Date range */}
                <div>
                  <label className="block text-[10px] text-muted font-black uppercase tracking-wider mb-1">Date début</label>
                  <input
                    type="date"
                    value={advancedSearch.filters.dateFrom || ''}
                    onChange={(e) => advancedSearch.setFilter('dateFrom', e.target.value)}
                    className="py-2.5 px-3 border border-border rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-100 dark:text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted font-black uppercase tracking-wider mb-1">Date fin</label>
                  <input
                    type="date"
                    value={advancedSearch.filters.dateTo || ''}
                    onChange={(e) => advancedSearch.setFilter('dateTo', e.target.value)}
                    className="py-2.5 px-3 border border-border rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 dark:bg-neutral-100 dark:text-neutral-800"
                  />
                </div>
                {/* Amount range */}
                <div>
                  <label className="block text-[10px] text-muted font-black uppercase tracking-wider mb-1">Montant min (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={advancedSearch.filters.amountMin ?? ''}
                    onChange={(e) => advancedSearch.setFilter('amountMin', e.target.value ? Number(e.target.value) : undefined)}
                    className="py-2.5 px-3 w-32 border border-border rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted font-black uppercase tracking-wider mb-1">Montant max (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="∞"
                    value={advancedSearch.filters.amountMax ?? ''}
                    onChange={(e) => advancedSearch.setFilter('amountMax', e.target.value ? Number(e.target.value) : undefined)}
                    className="py-2.5 px-3 w-32 border border-border rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50"
                  />
                </div>
                {/* Reset */}
                <div>
                  <button
                    onClick={() => advancedSearch.resetFilters()}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-200/50 text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Réinitialiser</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExportPDF}>
          <Download className="w-4 h-4" />
          <span>Exporter PDF</span>
        </Button>
      </div>

      {/* Devis List Table - Desktop */}
      <div className="hidden md:block bg-surface rounded-[2rem] border-2 border-border shadow-xs overflow-hidden">
        <Table
          columns={quotesColumns}
          data={quotesData}
          emptyMessage="Aucun devis enregistré ou correspondant à la recherche."
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {displayedQuotes.map((q) => {
          const totalItemsCount = q.items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <div key={q.id} className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground font-mono">{q.number}</p>
                  <p className="text-xs text-muted">{q.date}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  q.status === 'Accepté' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' :
                  q.status === 'Envoyé' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300' :
                  q.status === 'Brouillon' ? 'bg-neutral-100 dark:bg-neutral-200 text-foreground' :
                  'bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                }`}>
                  {q.status}
                </span>
              </div>
              <div className="mt-2">
                <p className="font-bold text-foreground text-sm">{q.customerName}</p>
                <p className="text-xs text-muted">Valide jusqu'au {q.expiryDate}</p>
              </div>
              <div className="mt-3 flex justify-between items-center pt-3 border-t border-border">
                <div>
                  <span className="text-[10px] text-muted font-semibold">{totalItemsCount} article(s)</span>
                  <p className="font-mono font-bold text-foreground">{formatFCFA(q.total)}</p>
                </div>
                <div className="flex gap-1.5">
                  {!isMagasinier && q.status === 'Envoyé' && (
                    <Button
                      variant="icon"
                      onClick={() => onUpdateQuoteStatus(q.id, 'Accepté')}
                      title="Marquer comme Accepté"
                      className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                    </Button>
                  )}
                  {!isMagasinier && q.status === 'Accepté' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleOpenConvert(q)}
                      className="font-black text-[9px] uppercase tracking-wider shadow-sm"
                    >
                      <ArrowRight className="h-3 w-3 stroke-[3]" />
                      <span>Facturer</span>
                    </Button>
                  )}
                  <Button
                    variant="icon"
                    onClick={() => setSelectedQuoteForPrint(q)}
                    title="Imprimer / Devis Proforma"
                  >
                    <Printer className="h-4.5 w-4.5 stroke-[2]" />
                  </Button>
                  {!isMagasinier && (
                    <Button
                      variant="icon"
                      onClick={() => setQuoteToDelete(q)}
                      className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-4.5 w-4.5 stroke-[2]" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {displayedQuotes.length === 0 && (
          <div className="py-16 text-center text-muted font-mono italic bg-surface rounded-xl border border-dashed border-border">
            Aucun devis enregistré ou correspondant à la recherche.
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE DEVIS PROFORMA */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouveau Devis"
        icon={FileText}
        size="4xl"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted font-bold italic">Saisie enregistrée localement</span>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Fermer
              </Button>
              <Button variant="secondary" onClick={() => handleSaveQuote('Brouillon')}>
                Brouillon
              </Button>
              <Button variant="primary" onClick={() => handleSaveQuote('Envoyé')}>
                Valider & Envoyer
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 text-xs bg-neutral-50/30 dark:bg-neutral-100/30 -m-6 p-6">
          {/* Customer and dates selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Sélectionner Client *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
              >
                <option value="">-- Choisir un client sénégalais --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} — {c.phone}
                  </option>
                ))}
              </select>
              {fieldErrors.customerId && (
                <p className="text-danger text-xs mt-1 font-bold">{fieldErrors.customerId}</p>
              )}
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Date Émission</label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden dark:bg-neutral-100 dark:text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Date d'Expiration</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden dark:bg-neutral-100 dark:text-neutral-800"
              />
            </div>
          </div>

          {/* Line Item Creator Grid */}
          <div className="bg-surface p-5 rounded-3xl border-2 border-border shadow-sm space-y-3">
            <span className="font-black text-foreground block text-xs uppercase tracking-wider">Ajouter des articles du catalogue</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Désignation du produit</label>
                <select
                  value={tempItemId}
                  onChange={(e) => handleTempProductChange(e.target.value)}
                  className="w-full border border-border p-2.5 rounded-xl bg-neutral-50/50 focus:ring-2 focus:ring-primary focus:outline-hidden text-xs font-bold"
                >
                  <option value="">-- Choisir un article en stock --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id} disabled={item.stockCount <= 0}>
                      {item.name} [{item.ref}] — En stock: {item.stockCount} {item.unit}s ({formatFCFA(item.sellingPrice)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={tempQty}
                  onChange={(e) => setTempQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>
              <div>
                <Button
                  variant="dark"
                  onClick={handleAddLine}
                  disabled={!tempItemId}
                  className="w-full disabled:bg-neutral-100 dark:disabled:bg-neutral-200 disabled:text-muted flex items-center justify-center space-x-1.5"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Ajouter la ligne</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Added lines list */}
          <div>
            <span className="font-black text-foreground block mb-2.5 uppercase tracking-wider">Articles dans la proposition</span>
            {quoteLines.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-[2rem] p-8 text-center text-muted italic font-mono bg-surface">
                Aucun article ajouté pour le moment.
              </div>
            ) : (
              <div className="border-2 border-border rounded-[2rem] overflow-hidden bg-surface shadow-xs">
                <Table
                  columns={lineItemColumns}
                  data={lineItemData}
                />
              </div>
            )}
            {fieldErrors.items && (
              <p className="text-danger text-xs mt-1 font-bold">{fieldErrors.items}</p>
            )}
          </div>

          {/* Subtotal, discount & notes section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-border pt-5">
            <div>
              <label className="block text-muted font-bold mb-1">Notes internes / Conditions de livraison</label>
              <textarea
                placeholder="e.g. Camion de livraison à la charge du client. Prix bloqué pendant 15 jours..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-border p-3 rounded-2xl h-24 focus:ring-2 focus:ring-primary focus:outline-hidden font-medium text-xs"
              />
            </div>
            <div className="bg-neutral-50/50 dark:bg-neutral-100/50 p-5 rounded-[2rem] border-2 border-border flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-muted font-semibold">
                  <span>Sous-total HT :</span>
                  <span className="font-mono font-bold">{formatFCFA(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted font-semibold">
                  <div className="flex items-center space-x-1 shrink-0">
                    <span>Remise globale (FCFA) :</span>
                  </div>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-28 border border-border p-1.5 rounded-xl font-mono font-black text-right focus:ring-2 focus:ring-primary focus:outline-hidden bg-surface"
                  />
                </div>
                <div className="flex items-center justify-between text-muted font-semibold">
                  <span>TVA (18%) :</span>
                  <span className="font-mono font-bold">{formatFCFA(totals.tax)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t-2 border-border/50 pt-3 mt-3">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">NET À PAYER :</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{formatFCFA(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: PRINT PREVIEW POPUP (kept inline for print styling) */}
      <AnimatePresence>
        {selectedQuoteForPrint && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-border max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Controls header */}
              <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-4 shrink-0 flex items-center justify-between border-b-2 border-neutral-800 dark:border-neutral-300">
                <span className="font-black text-xs font-mono uppercase tracking-wider text-muted">Modèle de Devis Proforma</span>
                <div className="flex space-x-3 items-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={printQuote}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-neutral-900 flex items-center space-x-1.5 hover:scale-[1.02]"
                  >
                    <Printer className="h-4 w-4 stroke-[2.5]" />
                    <span>Imprimer</span>
                  </Button>
                  <Button
                    variant="icon"
                    onClick={() => setSelectedQuoteForPrint(null)}
                    className="text-muted dark:text-neutral-600 hover:text-white dark:hover:text-neutral-900"
                  >
                    <X className="h-5 w-5 stroke-[2.5]" />
                  </Button>
                </div>
              </div>

              {/* Printable Body */}
              <div id="print-area" className="p-8 overflow-y-auto bg-surface text-[11px] leading-relaxed text-foreground flex-1 font-sans">
                {/* Store Header Info */}
                <div className="flex justify-between items-start border-b-2 border-border pb-6 mb-6">
                  <div>
                    <h2 className="text-base font-black font-display text-indigo-900 tracking-wider uppercase">QUINCAILLERIE EL HADJI BASSIROU & FILS</h2>
                    <p className="text-[10px] text-muted mt-1.5 max-w-sm font-semibold">
                      Avenue Cheikh Anta Diop, Dakar, Sénégal • Tél: +221 33 824 50 50<br/>
                      NINEA: 006548921-2G3 • RC: SN-DKR-2024-B-8542
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider inline-block border-2 border-red-100 dark:border-red-800 mb-2">
                      DEVIS PROFORMA
                    </div>
                    <p className="font-mono font-black text-foreground text-xs">{selectedQuoteForPrint.number}</p>
                    <p className="text-muted font-mono text-[9px] font-bold">Émis le {selectedQuoteForPrint.date}</p>
                  </div>
                </div>

                {/* Relational details */}
                <div className="grid grid-cols-2 gap-8 mb-6 bg-neutral-50 dark:bg-neutral-100 p-4 rounded-2xl border-2 border-border/50">
                  <div>
                    <span className="text-[9px] text-muted block font-black uppercase tracking-wider font-mono">DESTINATAIRE</span>
                    <span className="font-black text-foreground text-xs block mt-1">{selectedQuoteForPrint.customerName}</span>
                    {/* Retrieve customer data if available */}
                    {(() => {
                      const cust = customers.find(c => c.id === selectedQuoteForPrint.customerId);
                      if (cust) {
                        return (
                          <div className="text-muted mt-1.5 space-y-0.5 font-semibold">
                            {cust.company && <p className="font-black text-foreground">{cust.company}</p>}
                            {cust.phone && <p>Tél: {cust.phone}</p>}
                            {cust.address && <p>{cust.address}</p>}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="text-right font-semibold">
                    <span className="text-[9px] text-muted block font-black uppercase tracking-wider font-mono">DÉTAILS</span>
                    <div className="text-foreground mt-1.5 space-y-1">
                      <p><span className="font-bold text-muted">Durée de Validité:</span> 30 Jours</p>
                      <p><span className="font-bold text-muted">Date d'Expiration:</span> {selectedQuoteForPrint.expiryDate}</p>
                      <p><span className="font-bold text-muted">Devise:</span> Franc CFA (XOF)</p>
                    </div>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="mb-6">
                  <Table
                    columns={printColumns}
                    data={printData}
                  />
                </div>

                {/* Financial math block */}
                <div className="flex justify-between items-start border-t-2 border-border pt-5">
                  <div className="max-w-xs text-[10px] text-muted font-semibold leading-relaxed">
                    {selectedQuoteForPrint.notes && (
                      <div className="text-muted font-medium not-italic mt-2 p-3 bg-neutral-50 dark:bg-neutral-100 rounded-2xl border-2 border-border">
                        <span className="font-black text-foreground block mb-1 uppercase tracking-wider text-[9px]">Notes:</span>
                        {selectedQuoteForPrint.notes}
                      </div>
                    )}
                    <p className="mt-4">Ce document est un devis proforma, il ne constitue pas une facture définitive. Les marchandises restent la propriété du vendeur jusqu'au paiement intégral.</p>
                  </div>
                  <div className="w-64 space-y-2 text-right">
                    <div className="flex justify-between text-muted font-semibold">
                      <span>Sous-total HT:</span>
                      <span className="font-mono font-bold">{formatFCFA(selectedQuoteForPrint.subtotal)}</span>
                    </div>
                    {selectedQuoteForPrint.discount > 0 && (
                      <div className="flex justify-between text-muted font-semibold">
                        <span>Remise:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-{formatFCFA(selectedQuoteForPrint.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted font-semibold">
                      <span>TVA (18%):</span>
                      <span className="font-mono font-bold">{formatFCFA(selectedQuoteForPrint.tax)}</span>
                    </div>
                    <div className="flex justify-between text-foreground font-black border-t-2 border-border pt-2 text-xs">
                      <span>NET À PAYER:</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">{formatFCFA(selectedQuoteForPrint.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Signature boxes */}
                <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t-2 border-dashed border-border text-center text-[10px]">
                  <div>
                    <p className="text-muted font-black font-mono uppercase tracking-wider text-[9px]">LE CLIENT (Pour accord)</p>
                    <div className="h-16 mt-2 border-2 border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-neutral-100/30"></div>
                    <p className="text-muted mt-1.5 italic font-semibold">Signature précédée de la mention "Lu et approuvé"</p>
                  </div>
                  <div>
                    <p className="text-muted font-black font-mono uppercase tracking-wider text-[9px]">LA DIRECTION (Quincaillerie)</p>
                    <div className="h-16 mt-2 border-2 border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-neutral-100/30"></div>
                    <p className="text-muted mt-1.5 italic font-semibold">Cachet et signature du gérant</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CONVERT DEVIS TO INVOICE POPUP */}
      <Modal
        isOpen={isConvertOpen}
        onClose={() => { setIsConvertOpen(false); setQuoteToConvert(null); }}
        title="Convertir en Facture"
        icon={DollarSign}
        size="md"
      >
        <form onSubmit={handleConvertSubmit} className="space-y-4 text-xs -m-6 p-6 bg-neutral-50/30 dark:bg-neutral-100/30">
          {quoteToConvert && (
            <>
              <div className="bg-surface p-4 rounded-2xl border-2 border-border space-y-1.5">
                <div className="flex justify-between font-mono font-bold text-muted text-[10px]">
                  <span>SOURCE: {quoteToConvert.number}</span>
                  <span>DATE: {quoteToConvert.date}</span>
                </div>
                <p className="font-black text-foreground">Client: {quoteToConvert.customerName}</p>
                <div className="flex justify-between border-t-2 border-border pt-2.5 mt-2">
                  <span className="font-bold text-muted uppercase tracking-wider text-[9px]">Net à Facturer:</span>
                  <span className="font-black text-emerald-600 text-sm font-mono">{formatFCFA(quoteToConvert.total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">Mode de Paiement de la facture *</label>
                <select
                  value={convertPaymentMethod}
                  onChange={(e) => setConvertPaymentMethod(e.target.value as 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement')}
                  className="w-full border border-border p-2.5 rounded-xl bg-surface font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="Espèces">Espèces (Comptoir)</option>
                  <option value="Wave">Wave (Sénégal • 1%)</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="Chèque">Chèque bancaire</option>
                  <option value="Virement">Virement bancaire (CBAO/SGBS)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-bold mb-1">Montant Encaissé *</label>
                  <input
                    type="number"
                    max={quoteToConvert.total}
                    value={convertAmountPaid}
                    onChange={(e) => setConvertAmountPaid(Math.max(0, Math.min(quoteToConvert.total, Number(e.target.value))))}
                    className="w-full border border-border p-2.5 rounded-xl font-mono font-black focus:ring-2 focus:ring-primary focus:outline-hidden text-xs bg-neutral-50/50"
                    required
                  />
                  <div className="text-[9px] mt-1.5 leading-normal">
                    {convertAmountPaid < quoteToConvert.total ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">Reste: {formatFCFA(quoteToConvert.total - convertAmountPaid)} (Enregistré en crédit)</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">Soldé en intégralité</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1">Opérateur de vente *</label>
                  <input
                    type="text"
                    value={convertOperator}
                    onChange={(e) => setConvertOperator(e.target.value)}
                    className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-surface text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="border-t-2 border-border pt-4 flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setIsConvertOpen(false); setQuoteToConvert(null); }}
                >
                  Annuler
                </Button>
                <Button variant="success" type="submit">
                  Générer la facture
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!quoteToDelete}
        onClose={() => setQuoteToDelete(null)}
        title="Confirmer la suppression"
        icon={AlertTriangle}
        size="sm"
        variant="danger"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setQuoteToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (quoteToDelete) {
                  onDeleteQuote(quoteToDelete.id);
                  toast.success("Dévis supprimé avec succès");
                  setQuoteToDelete(null);
                }
              }}
            >
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          Êtes-vous sûr de vouloir supprimer le dévis <strong>{quoteToDelete?.number}</strong> ? Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
