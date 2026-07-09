import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  FileText,
  Plus, 
  Search, 
  Printer, 
  CheckCircle, 
  Trash2, 
  Calendar, 
  X, 
  ShoppingBag,
  CreditCard,
  User,
  TrendingUp,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Invoice, Item, Customer } from '../types';
import { formatFCFA } from '../utils/data';
import { useInvoiceForm } from '../hooks/useInvoiceForm';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Table } from './ui/Table';

interface InvoicesViewProps {
  invoices: Invoice[];
  items: Item[];
  customers: Customer[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'number'>, operator: string) => void;
  onDeleteInvoice: (id: string) => void;
}

const invoicesListColumns = [
  { key: 'number', label: 'N° Facture', className: 'font-mono font-bold text-foreground' },
  { key: 'date', label: 'Date', className: 'text-muted font-semibold' },
  { key: 'customerName', label: 'Client', className: 'font-bold text-foreground' },
  { key: 'paymentMethod', label: 'Mode', className: 'text-center' },
  { key: 'total', label: 'Net Facturé', className: 'text-right font-mono font-bold text-foreground' },
  { key: 'amountPaid', label: 'Encaissé', className: 'text-right font-mono font-bold text-emerald-700' },
  { key: 'status', label: 'Paiement', className: 'text-center' },
  { key: 'actions', label: 'Actions', className: 'text-right' },
];

const lineItemsColumns = [
  { key: 'itemName', label: 'Désignation', className: 'font-bold text-foreground' },
  { key: 'unit', label: 'Unité', className: 'text-center text-muted font-semibold' },
  { key: 'quantity', label: 'Quantité', className: 'text-center font-mono font-black text-foreground' },
  { key: 'price', label: 'Prix Unitaire (FCFA)', className: 'text-right font-mono text-muted font-bold' },
  { key: 'total', label: 'Total HT (FCFA)', className: 'text-right font-mono font-black text-foreground' },
  { key: 'actions', label: '', className: 'text-right' },
];

const printColumns = [
  { key: 'itemName', label: 'Désignation de l\'Article', className: 'font-bold text-foreground' },
  { key: 'unit', label: 'Unité', className: 'text-center text-muted font-semibold' },
  { key: 'quantity', label: 'Qté', className: 'text-center font-mono font-black text-foreground' },
  { key: 'price', label: 'P.U. (FCFA)', className: 'text-right font-mono font-bold text-muted' },
  { key: 'total', label: 'Total (FCFA)', className: 'text-right font-mono font-black text-foreground' },
];

export default function InvoicesView({
  invoices,
  items,
  customers,
  onAddInvoice,
  onDeleteInvoice
}: InvoicesViewProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('Tous');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Invoice form logic via hook
  const {
    customerId, setCustomerId,
    invoiceDate, setInvoiceDate,
    paymentMethod, setPaymentMethod,
    amountPaid, setAmountPaid,
    lines: invoiceLines,
    discount, setDiscount,
    operator, setOperator,
    notes, setNotes,
    tempItemId, setTempItemId,
    tempQty, setTempQty,
    tempPrice, setTempPrice,
    totals,
    handleTempProductChange,
    handleAddLine,
    removeLine,
    handleSaveInvoice: hookSaveInvoice,
  } = useInvoiceForm(items, customers, onAddInvoice);

  const handleFormSubmit = () => {
    if (hookSaveInvoice()) {
      setIsCreateOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteInvoice(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filter invoices list
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(search.toLowerCase());
      const matchMethod = methodFilter === 'Tous' || inv.paymentMethod === methodFilter;
      const matchStatus = statusFilter === 'Tous' || inv.status === statusFilter;
      return matchSearch && matchMethod && matchStatus;
    }).sort((a, b) => b.number.localeCompare(a.number));
  }, [invoices, search, methodFilter, statusFilter]);

  const printInvoice = () => {
    window.print();
  };

  // Quick statistics
  const invoiceStats = useMemo(() => {
    const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);
    const totalCash = invoices.filter(inv => inv.paymentMethod === 'Espèces').reduce((acc, inv) => acc + inv.total, 0);
    const totalWave = invoices.filter(inv => inv.paymentMethod === 'Wave').reduce((acc, inv) => acc + inv.total, 0);
    const totalOM = invoices.filter(inv => inv.paymentMethod === 'Orange Money').reduce((acc, inv) => acc + inv.total, 0);
    
    return { totalSales, totalCash, totalWave, totalOM };
  }, [invoices]);

  const invoicesListData = filteredInvoices.map(inv => {
    const unpaid = inv.total - inv.amountPaid;
    return {
      number: inv.number,
      date: inv.date,
      customerName: inv.customerName,
      paymentMethod: (
        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
          inv.paymentMethod === 'Wave' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
          inv.paymentMethod === 'Orange Money' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' :
          'bg-neutral-100 dark:bg-neutral-200 text-neutral-600 dark:text-neutral-400'
        }`}>
          {inv.paymentMethod}
        </span>
      ),
      total: formatFCFA(inv.total),
      amountPaid: formatFCFA(inv.amountPaid),
      status: (
        <>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            inv.status === 'Payé' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' :
            inv.status === 'Partiel' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 animate-pulse' :
            'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
          }`}>
            {inv.status}
          </span>
          {unpaid > 0 && (
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black font-mono block mt-1">-{formatFCFA(unpaid)}</span>
          )}
        </>
      ),
      actions: (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="icon"
            onClick={() => setSelectedInvoiceForPrint(inv)}
            title="Imprimer la Facture / Reçu"
            className="p-1.5"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            onClick={() => setDeleteTarget(inv)}
            title="Supprimer la facture"
            className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    };
  });

  const lineItemsData = invoiceLines.map((line, idx) => ({
    itemName: line.itemName,
    unit: line.unit,
    quantity: line.quantity,
    price: formatFCFA(line.price),
    total: formatFCFA(line.total),
    actions: (
      <Button
        variant="icon"
        onClick={() => removeLine(idx)}
        className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ),
  }));

  const printData = selectedInvoiceForPrint
    ? selectedInvoiceForPrint.items.map(line => ({
        itemName: line.itemName,
        unit: line.unit,
        quantity: line.quantity,
        price: formatFCFA(line.price),
        total: formatFCFA(line.total),
      }))
    : [];

  return (
    <div id="invoices-view-root" className="space-y-6">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Header with quick creation action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-border pb-5">
        <div>
          <h2 className="text-xl font-black font-display text-foreground uppercase tracking-wider">Ventes & Factures</h2>
          <p className="text-xs text-muted mt-1.5 font-medium">Enregistrez des ventes au comptoir, encaissez par Wave, Orange Money ou Espèces et générez des factures acquittées</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="mt-4 sm:mt-0 self-start"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Nouvelle Vente</span>
        </Button>
      </div>

      {/* Quick Cashier Stats Box */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-surface p-5 rounded-[2rem] border-2 border-border border-b-4 border-b-primary shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center">
          <span className="text-[10px] text-muted font-black uppercase tracking-wider font-display block">Chiffre d'Affaires</span>
          <span className="font-black text-foreground text-base mt-2 block font-display">{formatFCFA(invoiceStats.totalSales)}</span>
        </div>
        <div className="bg-surface p-5 rounded-[2rem] border-2 border-border border-b-4 border-b-emerald-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider font-display block">Espèces encaissées</span>
          <span className="font-black text-emerald-700 dark:text-emerald-300 text-base mt-2 block font-display">{formatFCFA(invoiceStats.totalCash)}</span>
        </div>
        <div className="bg-surface p-5 rounded-[2rem] border-2 border-border border-b-4 border-b-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center">
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider font-display block">Paiements Wave</span>
          <span className="font-black text-blue-700 dark:text-blue-300 text-base mt-2 block font-display">{formatFCFA(invoiceStats.totalWave)}</span>
        </div>
        <div className="bg-surface p-5 rounded-[2rem] border-2 border-border border-b-4 border-b-amber-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider font-display block">Orange Money</span>
          <span className="font-black text-amber-700 dark:text-amber-300 text-base mt-2 block font-display">{formatFCFA(invoiceStats.totalOM)}</span>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-surface p-4 rounded-3xl border-2 border-border shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par N° de facture ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full border border-border rounded-2xl text-xs focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50/50 font-semibold"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-muted font-bold uppercase tracking-wider text-[10px]">Règlement:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="py-2 px-3 border border-border rounded-2xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
          >
            <option value="Tous">Tous modes</option>
            <option value="Espèces">Espèces</option>
            <option value="Wave">Wave</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Chèque">Chèque</option>
            <option value="Virement">Virement</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-muted font-bold uppercase tracking-wider text-[10px]">Paiement:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-border rounded-2xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
          >
            <option value="Tous">Tous statuts</option>
            <option value="Payé">Payé</option>
            <option value="Partiel">Partiel (Crédit)</option>
            <option value="Non Payé">Non Payé</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table - Desktop */}
      <div className="hidden md:block bg-surface rounded-3xl border-2 border-border shadow-[0_10px_40px_rgb(0,0,0,0.015)] overflow-hidden">
        <Table
          columns={[
            { key: 'number', label: 'N° Facture', className: 'font-mono font-bold' },
            { key: 'date', label: 'Date', className: 'text-muted font-semibold' },
            { key: 'client', label: 'Client', className: 'font-bold' },
            { key: 'mode', label: 'Mode', className: 'text-center' },
            { key: 'total', label: 'Net Facturé', className: 'text-right font-mono font-bold' },
            { key: 'amountPaid', label: 'Encaissé', className: 'text-right font-mono font-bold text-emerald-700' },
            { key: 'status', label: 'Paiement', className: 'text-center' },
            { key: 'actions', label: 'Actions', className: 'text-right' },
          ]}
          data={filteredInvoices.map((inv) => {
            const unpaid = inv.total - inv.amountPaid;
            return {
              number: inv.number,
              date: inv.date,
              client: inv.customerName,
              mode: (
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  inv.paymentMethod === 'Wave' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                  inv.paymentMethod === 'Orange Money' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' :
                  'bg-neutral-100 dark:bg-neutral-200 text-neutral-600 dark:text-neutral-400'
                }`}>
                  {inv.paymentMethod}
                </span>
              ),
              total: formatFCFA(inv.total),
              amountPaid: formatFCFA(inv.amountPaid),
              status: (
                <>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    inv.status === 'Payé' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' :
                    inv.status === 'Partiel' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                    'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                  }`}>
                    {inv.status}
                  </span>
                  {unpaid > 0 && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black font-mono block mt-1">-{formatFCFA(unpaid)}</span>
                  )}
                </>
              ),
              actions: (
                <div className="flex items-center justify-end space-x-1">
                  <Button
                    variant="icon"
                    onClick={() => setSelectedInvoiceForPrint(inv)}
                    title="Imprimer la Facture / Reçu"
                    className="p-1.5"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="icon"
                    onClick={() => setDeleteTarget(inv)}
                    title="Supprimer la facture"
                    className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            };
          })}
          emptyMessage="Aucune facture enregistrée ou correspondante à la recherche."
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.map((inv) => {
          const unpaid = inv.total - inv.amountPaid;

          return (
            <div key={inv.id} className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground font-mono">{inv.number}</p>
                  <p className="text-xs text-muted">{inv.date}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  inv.status === 'Payé' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' :
                  inv.status === 'Partiel' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 animate-pulse' :
                  'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                }`}>
                  {inv.status}
                </span>
              </div>
              <div className="mt-2">
                <p className="font-bold text-foreground text-sm">{inv.customerName}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  inv.paymentMethod === 'Wave' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                  inv.paymentMethod === 'Orange Money' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' :
                  'bg-neutral-100 dark:bg-neutral-200 text-neutral-600 dark:text-neutral-400'
                }`}>
                  {inv.paymentMethod}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border">
                <div>
                  <span className="text-muted font-semibold">Net Facturé</span>
                  <p className="font-mono font-bold text-foreground">{formatFCFA(inv.total)}</p>
                </div>
                <div>
                  <span className="text-muted font-semibold">Encaissé</span>
                  <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatFCFA(inv.amountPaid)}</p>
                </div>
              </div>
              {unpaid > 0 && (
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-black font-mono mt-1 text-right">Reste: -{formatFCFA(unpaid)}</div>
              )}
              <div className="mt-2 flex justify-end gap-1.5 pt-2 border-t border-border">
                <Button
                  variant="icon"
                  onClick={() => setSelectedInvoiceForPrint(inv)}
                  title="Imprimer la Facture / Reçu"
                  className="p-1.5"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="icon"
                  onClick={() => setDeleteTarget(inv)}
                  title="Supprimer la facture"
                  className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {filteredInvoices.length === 0 && (
          <div className="py-12 text-center text-muted font-mono italic bg-surface rounded-xl border border-dashed border-border">
            Aucune facture enregistrée ou correspondante à la recherche.
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE NEW SALES INVOICE */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle Facture"
        icon={FileText}
        size="4xl"
        footer={
          <div className="flex items-center justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleFormSubmit}>
              <CheckCircle className="h-4 w-4 stroke-[2.5]" />
              <span>Enregistrer la vente</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-xs">
          {/* Customer, Date & Operator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Sélectionner Client *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden font-bold"
                required
              >
                <option value="">-- Choisir le client acheteur --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} — Tél: {c.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Date Facturation</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden dark:bg-neutral-100 dark:text-neutral-800"
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Caissier / Gérant de Vente *</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden font-bold text-foreground"
                required
              />
            </div>
          </div>

          {/* Product Picker */}
          <div className="bg-surface p-5 rounded-3xl border-2 border-border shadow-sm space-y-3">
            <span className="font-black text-foreground block text-xs uppercase tracking-wider">Vendre des articles physiques</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Désignation du produit</label>
                <select
                  value={tempItemId}
                  onChange={(e) => handleTempProductChange(e.target.value)}
                  className="w-full border border-border p-2.5 rounded-xl bg-neutral-50/50 focus:ring-2 focus:ring-primary focus:outline-hidden text-xs font-bold"
                >
                  <option value="">-- Choisir un produit du stock --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id} disabled={item.stockCount <= 0}>
                      {item.name} [{item.ref}] — Stock: {item.stockCount} {item.unit}s ({formatFCFA(item.sellingPrice)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Quantité à vendre</label>
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
                  className="w-full disabled:bg-neutral-100 dark:disabled:bg-neutral-200 disabled:text-muted"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Ajouter la ligne</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Selected items table */}
          <div>
            <span className="font-black text-foreground block mb-2.5 uppercase tracking-wider">Panier de la vente</span>
            {invoiceLines.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-[2rem] p-8 text-center text-muted italic font-mono bg-surface">
                Aucun article dans le panier.
              </div>
            ) : (
              <div className="border-2 border-border rounded-[2rem] overflow-hidden bg-surface shadow-xs">
                <Table
                  columns={[
                    { key: 'designation', label: 'Désignation', className: 'font-bold' },
                    { key: 'unit', label: 'Unité', className: 'text-center text-muted font-semibold' },
                    { key: 'quantity', label: 'Quantité', className: 'text-center font-mono font-black' },
                    { key: 'price', label: 'Prix Unitaire (FCFA)', className: 'text-right font-mono text-muted font-bold' },
                    { key: 'totalHT', label: 'Total HT (FCFA)', className: 'text-right font-mono font-black' },
                    { key: 'delete', label: '', className: 'text-right' },
                  ]}
                  data={invoiceLines.map((line, idx) => ({
                    designation: line.itemName,
                    unit: line.unit,
                    quantity: line.quantity,
                    price: formatFCFA(line.price),
                    totalHT: formatFCFA(line.total),
                    delete: (
                      <Button
                        variant="icon"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ),
                  }))}
                />
              </div>
            )}
          </div>

          {/* Payment controls and financial math */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-border pt-5">
            {/* Payment methods section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted font-bold mb-1">Mode de règlement *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-border p-2.5 rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:outline-hidden text-xs font-bold"
                  >
                    <option value="Espèces">Espèces (Cash)</option>
                    <option value="Wave">Wave (Sénégal • 1%)</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Virement">Virement bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted font-bold mb-1">Montant Reçu (Encaissé) *</label>
                  <input
                    type="number"
                    max={totals.total}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Math.max(0, Math.min(totals.total, Number(e.target.value))))}
                    className="w-full border border-border p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-primary focus:outline-hidden text-xs font-black bg-neutral-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                {amountPaid < totals.total ? (
                  <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 p-4 rounded-2xl border-2 border-rose-100 dark:border-rose-800 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-black block text-[10px] uppercase tracking-wider">Paiement Partiel (Vente à Crédit)</span>
                      <span className="block text-[9px] mt-1 font-medium leading-relaxed">Le reliquat de <b className="font-black text-rose-700">{formatFCFA(totals.total - amountPaid)}</b> sera automatiquement inscrit au passif de la fiche du client.</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800 flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-[10px] uppercase tracking-wider">Facture soldée à 100% (Aucun crédit généré)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-muted font-bold mb-1">Commentaires de facturation</label>
                <input
                  type="text"
                  placeholder="e.g. Livraison immédiate au comptoir, sac d'enduit offert..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-border p-2.5 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Financial total breakdowns */}
            <div className="bg-neutral-50/50 dark:bg-neutral-100/50 p-5 rounded-[2rem] border-2 border-border flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-muted font-semibold">
                  <span>Sous-total de la vente HT :</span>
                  <span className="font-mono font-bold">{formatFCFA(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted font-semibold">
                  <span>Remise comptoir (FCFA) :</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-28 border border-border p-1.5 rounded-xl font-mono font-black text-right focus:ring-2 focus:ring-primary focus:outline-hidden bg-surface"
                  />
                </div>
                <div className="flex items-center justify-between text-muted font-semibold">
                  <span>TVA sénégalaise (18%) :</span>
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

      {/* MODAL 2: DELETE CONFIRMATION */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
        icon={Trash2}
        size="sm"
        variant="danger"
        footer={
          <div className="flex items-center justify-end space-x-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              <Trash2 className="h-4 w-4 stroke-[2.5]" />
              <span>Supprimer</span>
            </Button>
          </div>
        }
      >
        <div className="text-xs space-y-3">
          <p className="text-muted">
            Voulez-vous annuler et supprimer la facture{' '}
            <b className="text-foreground font-mono">{deleteTarget?.number}</b> ?
          </p>
          <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 p-3 rounded-xl border-2 border-rose-100 dark:border-rose-800 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="text-[10px] font-bold leading-relaxed">
              Le stock sera réajusté et les mouvements de sortie seront annulés.
            </span>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: FACTURE PRINT VIEW PREVIEW */}
      <AnimatePresence>
        {selectedInvoiceForPrint && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-border max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Controls header */}
              <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-4 shrink-0 flex items-center justify-between border-2 border-neutral-800 dark:border-neutral-300">
                <span className="font-black text-xs font-mono uppercase tracking-wider text-muted">Facture acquittée / Crédit</span>
                <div className="flex space-x-3 items-center">
                  <Button variant="primary" onClick={printInvoice}>
                    <Printer className="h-4 w-4 stroke-[2.5]" />
                    <span>Imprimer la Facture</span>
                  </Button>
                  <Button variant="icon" onClick={() => setSelectedInvoiceForPrint(null)}>
                    <X className="h-5 w-5 stroke-[2.5]" />
                  </Button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="print-invoice-area" className="p-8 overflow-y-auto bg-surface text-[11px] leading-relaxed text-foreground flex-1 font-sans">
                {/* Store details header */}
                <div className="flex justify-between items-start border-b-2 border-border pb-6 mb-6">
                  <div>
                    <h2 className="text-base font-black font-display text-indigo-900 tracking-wider uppercase">QUINCAILLERIE EL HADJI BASSIROU & FILS</h2>
                    <p className="text-[10px] text-muted mt-1.5 max-w-sm font-semibold">
                      Avenue Cheikh Anta Diop, Dakar, Sénégal • Tél: +221 33 824 50 50<br/>
                      NINEA: 006548921-2G3 • RC: SN-DKR-2024-B-8542
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider inline-block border-2 border-emerald-100 dark:border-emerald-800 mb-2">
                      FACTURE FINALE
                    </div>
                    <p className="font-mono font-black text-foreground text-xs">{selectedInvoiceForPrint.number}</p>
                    <p className="text-muted font-mono text-[9px] font-bold">Émise le {selectedInvoiceForPrint.date}</p>
                  </div>
                </div>

                {/* Transaction metadata */}
                <div className="grid grid-cols-2 gap-8 mb-6 bg-neutral-50 dark:bg-neutral-100 p-4 rounded-2xl border-2 border-border/50">
                  <div>
                    <span className="text-[9px] text-muted block font-black uppercase tracking-wider font-mono">ACHETEUR / CLIENT</span>
                    <span className="font-black text-foreground text-xs block mt-1">{selectedInvoiceForPrint.customerName}</span>
                    {(() => {
                      const cust = customers.find(c => c.id === selectedInvoiceForPrint.customerId);
                      if (cust) {
                        return (
                          <div className="text-muted mt-1.5 space-y-0.5 font-semibold">
                            {cust.company && <p className="font-black text-muted">{cust.company}</p>}
                            {cust.phone && <p>Tél: {cust.phone}</p>}
                            {cust.address && <p>{cust.address}</p>}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="text-right font-semibold">
                    <span className="text-[9px] text-muted block font-black uppercase tracking-wider font-mono">RÈGLEMENT</span>
                    <div className="text-muted mt-1.5 space-y-1">
                      <p><span className="font-bold text-muted">Mode de paiement:</span> {selectedInvoiceForPrint.paymentMethod}</p>
                      <p><span className="font-bold text-muted">Statut de paiement:</span> <span className="font-black text-emerald-700 uppercase">{selectedInvoiceForPrint.status}</span></p>
                      <p><span className="font-bold text-muted">Devise:</span> Franc CFA (XOF)</p>
                    </div>
                  </div>
                </div>

                {/* Wave QR Code simulation if Wave or OM is chosen to look incredibly authentic! */}
                {(selectedInvoiceForPrint.paymentMethod === 'Wave' || selectedInvoiceForPrint.paymentMethod === 'Orange Money') && (
                  <div className="mb-6 p-4 border-2 border-blue-100 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl flex items-center space-x-4">
                    <div className="bg-surface dark:bg-neutral-100 p-1.5 rounded-xl border-2 border-blue-100 dark:border-blue-800 shadow-xs shrink-0">
                      <QrCode className="h-10 w-10 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="font-black text-blue-900 dark:text-blue-200 text-xs flex items-center uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 mr-2 animate-pulse"></span>
                        Encaissement digital validé par {selectedInvoiceForPrint.paymentMethod}
                      </span>
                      <p className="text-[10px] text-muted mt-1 font-semibold">Transaction enregistrée sous les registres d'opérateurs Wave/Orange Money.</p>
                    </div>
                  </div>
                )}

                {/* Line Items table */}
                <div className="mb-6">
                  <Table
                    columns={[
                      { key: 'designation', label: "Désignation de l'Article", className: 'font-bold' },
                      { key: 'unit', label: 'Unité', className: 'text-center text-muted font-semibold' },
                      { key: 'quantity', label: 'Qté', className: 'text-center font-mono font-black' },
                      { key: 'price', label: 'P.U. (FCFA)', className: 'text-right font-mono font-bold text-muted' },
                      { key: 'total', label: 'Total (FCFA)', className: 'text-right font-mono font-black' },
                    ]}
                    data={selectedInvoiceForPrint.items.map((line) => ({
                      designation: line.itemName,
                      unit: line.unit,
                      quantity: line.quantity,
                      price: formatFCFA(line.price),
                      total: formatFCFA(line.total),
                    }))}
                  />
                </div>

                {/* Invoice calculations summary */}
                <div className="flex justify-between items-start border-t-2 border-border pt-5">
                  <div className="max-w-xs text-[10px] text-muted font-semibold leading-relaxed">
                    {selectedInvoiceForPrint.notes && (
                      <div className="text-muted font-medium not-italic mt-2 p-3 bg-neutral-50 dark:bg-neutral-100 rounded-2xl border-2 border-border">
                        <span className="font-black text-foreground block mb-1 uppercase tracking-wider text-[9px]">Commentaires:</span>
                        {selectedInvoiceForPrint.notes}
                      </div>
                    )}
                    <p className="mt-4">Facture établie conformément à la législation fiscale sénégalaise en vigueur. En cas de réclamation, veuillez présenter cette facture sous 72 heures.</p>
                  </div>
                  <div className="w-64 space-y-2 text-right">
                    <div className="flex justify-between text-muted font-semibold">
                      <span>Sous-total HT:</span>
                      <span className="font-mono font-bold">{formatFCFA(selectedInvoiceForPrint.subtotal)}</span>
                    </div>
                    {selectedInvoiceForPrint.discount > 0 && (
                      <div className="flex justify-between text-muted font-semibold">
                        <span>Remise accordée:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">-{formatFCFA(selectedInvoiceForPrint.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted font-semibold">
                      <span>TVA (18%):</span>
                      <span className="font-mono font-bold">{formatFCFA(selectedInvoiceForPrint.tax)}</span>
                    </div>
                    <div className="flex justify-between text-foreground font-black border-t-2 border-border pt-2 text-xs">
                      <span>NET À PAYER:</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">{formatFCFA(selectedInvoiceForPrint.total)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 dark:text-emerald-200 font-black bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border-2 border-emerald-100/80 dark:border-emerald-800/80">
                      <span>MONTANT ENCAISSÉ:</span>
                      <span className="font-mono text-xs">{formatFCFA(selectedInvoiceForPrint.amountPaid)}</span>
                    </div>
                    {selectedInvoiceForPrint.total - selectedInvoiceForPrint.amountPaid > 0 && (
                      <div className="flex justify-between text-rose-800 dark:text-rose-200 font-black bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-xl border-2 border-rose-100/80 dark:border-rose-800/80">
                        <span>RESTE À ENCAISSER:</span>
                        <span className="font-mono text-xs text-rose-600 dark:text-rose-400">-{formatFCFA(selectedInvoiceForPrint.total - selectedInvoiceForPrint.amountPaid)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature boxes */}
                <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t-2 border-dashed border-border text-center text-[10px]">
                  <div>
                    <p className="text-muted font-black font-mono uppercase tracking-wider text-[9px]">SIGNATURE CLIENT (Accusé réception)</p>
                    <div className="h-16 mt-2 border-2 border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-neutral-100/30"></div>
                  </div>
                  <div>
                    <p className="text-muted font-black font-mono uppercase tracking-wider text-[9px]">LA CAISSE (Quincaillerie)</p>
                    <div className="h-16 mt-2 border-2 border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-neutral-100/30"></div>
                    <p className="text-muted mt-1.5 italic font-semibold">Facture acquittée sous réserve de provision</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
