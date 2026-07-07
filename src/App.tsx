import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ShoppingBag, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  MapPin,
  Clock,
  Coins
} from 'lucide-react';

import { Item, StockMovement, Customer, Supplier, Quote, Invoice, StoreSettings } from './types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_ITEMS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  INITIAL_QUOTES, 
  INITIAL_INVOICES, 
  INITIAL_STOCK_MOVEMENTS,
  formatFCFA 
} from './utils/data';

// Modular Views
import DashboardView from './components/DashboardView';
import ItemsView from './components/ItemsView';
import DevisView from './components/DevisView';
import InvoicesView from './components/InvoicesView';
import ContactsView from './components/ContactsView';
import SettingsView from './components/SettingsView';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Persistent States
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<Item[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // 1. Load initial states from LocalStorage or seed data
  useEffect(() => {
    const savedSettings = localStorage.getItem('erp_settings');
    const savedItems = localStorage.getItem('erp_items');
    const savedMovements = localStorage.getItem('erp_movements');
    const savedCustomers = localStorage.getItem('erp_customers');
    const savedSuppliers = localStorage.getItem('erp_suppliers');
    const savedQuotes = localStorage.getItem('erp_quotes');
    const savedInvoices = localStorage.getItem('erp_invoices');

    if (savedSettings) setSettings(JSON.parse(savedSettings));
    setItems(savedItems ? JSON.parse(savedItems) : INITIAL_ITEMS);
    setMovements(savedMovements ? JSON.parse(savedMovements) : INITIAL_STOCK_MOVEMENTS);
    setCustomers(savedCustomers ? JSON.parse(savedCustomers) : INITIAL_CUSTOMERS);
    setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : INITIAL_SUPPLIERS);
    setQuotes(savedQuotes ? JSON.parse(savedQuotes) : INITIAL_QUOTES);
    setInvoices(savedInvoices ? JSON.parse(savedInvoices) : INITIAL_INVOICES);
  }, []);

  // 2. Synchronize states with LocalStorage
  const syncAndSetItems = (newItems: Item[]) => {
    setItems(newItems);
    localStorage.setItem('erp_items', JSON.stringify(newItems));
  };

  const syncAndSetMovements = (newMovements: StockMovement[]) => {
    setMovements(newMovements);
    localStorage.setItem('erp_movements', JSON.stringify(newMovements));
  };

  const syncAndSetCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem('erp_customers', JSON.stringify(newCustomers));
  };

  const syncAndSetSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    localStorage.setItem('erp_suppliers', JSON.stringify(newSuppliers));
  };

  const syncAndSetQuotes = (newQuotes: Quote[]) => {
    setQuotes(newQuotes);
    localStorage.setItem('erp_quotes', JSON.stringify(newQuotes));
  };

  const syncAndSetInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('erp_invoices', JSON.stringify(newInvoices));
  };

  const syncAndSetSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    localStorage.setItem('erp_settings', JSON.stringify(newSettings));
  };

  // CALLBACKS: CATALOGUE & STOCK
  const handleAddItem = (itemData: Omit<Item, 'id' | 'stockCount'>, initialQty: number, operator: string) => {
    const newId = `prod-${Date.now()}`;
    const newItem: Item = {
      ...itemData,
      id: newId,
      stockCount: initialQty
    };

    syncAndSetItems([...items, newItem]);

    if (initialQty > 0) {
      // Create initial stock movement
      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        itemId: newId,
        itemName: newItem.name,
        type: 'ENTREE',
        quantity: initialQty,
        reason: 'Ajustement Inventaire',
        date: new Date().toISOString().split('T')[0],
        referenceCode: 'INIT-INVENTAIRE',
        operator
      };
      syncAndSetMovements([newMovement, ...movements]);
    }
  };

  const handleUpdateItem = (updatedItem: Item) => {
    syncAndSetItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const handleDeleteItem = (id: string) => {
    syncAndSetItems(items.filter(i => i.id !== id));
    // clean related movements
    syncAndSetMovements(movements.filter(m => m.itemId !== id));
  };

  const handleAdjustStock = (
    itemId: string, 
    qty: number, 
    type: 'ENTREE' | 'SORTIE', 
    reason: StockMovement['reason'], 
    operator: string, 
    ref: string
  ) => {
    const itemObj = items.find(i => i.id === itemId);
    if (!itemObj) return;

    const newStockCount = type === 'ENTREE' ? itemObj.stockCount + qty : Math.max(0, itemObj.stockCount - qty);
    
    // Update item stock count
    syncAndSetItems(items.map(i => i.id === itemId ? { ...i, stockCount: newStockCount } : i));

    // Log movement
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId,
      itemName: itemObj.name,
      type,
      quantity: qty,
      reason,
      date: new Date().toISOString().split('T')[0],
      referenceCode: ref || "AJUST-MANUEL",
      operator
    };
    syncAndSetMovements([newMovement, ...movements]);
  };

  // Quick action from dashboard to restock low stock item
  const handleQuickRestock = (itemId: string, qty: number) => {
    handleAdjustStock(itemId, qty, 'ENTREE', 'Achat Fournisseur', 'Système (Auto)', 'REAPPRO-RAPIDE');
  };

  // CALLBACKS: QUOTATIONS / DEVIS
  const handleAddQuote = (quoteData: Omit<Quote, 'id' | 'number'>) => {
    const nextNumber = `DEV-2026-${String(quotes.length + 1).padStart(3, '0')}`;
    const newQuote: Quote = {
      ...quoteData,
      id: `q-${Date.now()}`,
      number: nextNumber
    };
    syncAndSetQuotes([newQuote, ...quotes]);
  };

  const handleUpdateQuoteStatus = (id: string, status: Quote['status']) => {
    syncAndSetQuotes(quotes.map(q => q.id === id ? { ...q, status } : q));
  };

  const handleDeleteQuote = (id: string) => {
    syncAndSetQuotes(quotes.filter(q => q.id !== id));
  };

  // CALLBACKS: INVOICES & SALES
  const handleAddInvoice = (invoiceData: Omit<Invoice, 'id' | 'number'>, operator: string) => {
    const nextNumber = `FAC-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `fac-${Date.now()}`,
      number: nextNumber
    };

    // 1. Add the invoice
    syncAndSetInvoices([newInvoice, ...invoices]);

    // 2. Reduce products stock count automatically
    const updatedItems = items.map(item => {
      const line = invoiceData.items.find(l => l.itemId === item.id);
      if (line) {
        return {
          ...item,
          stockCount: Math.max(0, item.stockCount - line.quantity)
        };
      }
      return item;
    });
    syncAndSetItems(updatedItems);

    // 3. Log stock movements
    const newMovements: StockMovement[] = invoiceData.items.map((line, idx) => ({
      id: `mov-${Date.now()}-${idx}`,
      itemId: line.itemId,
      itemName: line.itemName,
      type: 'SORTIE',
      quantity: line.quantity,
      reason: 'Vente Client',
      date: invoiceData.date,
      referenceCode: nextNumber,
      operator
    }));
    syncAndSetMovements([...newMovements, ...movements]);

    // 4. Update customer outstanding balance if partial payment
    const unpaidAmount = invoiceData.total - invoiceData.amountPaid;
    if (unpaidAmount > 0) {
      const updatedCustomers = customers.map(c => {
        if (c.id === invoiceData.customerId) {
          return {
            ...c,
            outstandingBalance: c.outstandingBalance + unpaidAmount
          };
        }
        return c;
      });
      syncAndSetCustomers(updatedCustomers);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const invoiceObj = invoices.find(inv => inv.id === id);
    if (!invoiceObj) return;

    // 1. Delete invoice
    syncAndSetInvoices(invoices.filter(inv => inv.id !== id));

    // 2. RESTORE stocks
    const restoredItems = items.map(item => {
      const line = invoiceObj.items.find(l => l.itemId === item.id);
      if (line) {
        return {
          ...item,
          stockCount: item.stockCount + line.quantity
        };
      }
      return item;
    });
    syncAndSetItems(restoredItems);

    // 3. Remove stock movements
    syncAndSetMovements(movements.filter(m => m.referenceCode !== invoiceObj.number));

    // 4. Restore customer balance if it was credit
    const unpaid = invoiceObj.total - invoiceObj.amountPaid;
    if (unpaid > 0) {
      const restoredCustomers = customers.map(c => {
        if (c.id === invoiceObj.customerId) {
          return {
            ...c,
            outstandingBalance: Math.max(0, c.outstandingBalance - unpaid)
          };
        }
        return c;
      });
      syncAndSetCustomers(restoredCustomers);
    }
  };

  // Convert Quote directly to Sales Invoice
  const handleConvertQuoteToInvoice = (
    quote: Quote, 
    paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement', 
    amountPaid: number, 
    operator: string
  ) => {
    // Standard sales invoice generation
    handleAddInvoice({
      date: new Date().toISOString().split('T')[0],
      customerId: quote.customerId,
      customerName: quote.customerName,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
      amountPaid,
      paymentMethod,
      status: amountPaid === quote.total ? 'Payé' : amountPaid === 0 ? 'Non Payé' : 'Partiel',
      notes: `Facturé depuis le dévis ${quote.number}`,
      quoteId: quote.id
    }, operator);

    // Change quote status to Accepted
    handleUpdateQuoteStatus(quote.id, 'Accepté');
  };

  // CALLBACKS: CUSTOMERS & SUPPLIERS
  const handleAddCustomer = (cData: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    const newCustomer: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      outstandingBalance: 0
    };
    syncAndSetCustomers([...customers, newCustomer]);
  };

  const handleUpdateCustomer = (cUpdated: Customer) => {
    syncAndSetCustomers(customers.map(c => c.id === cUpdated.id ? cUpdated : c));
  };

  const handleDeleteCustomer = (id: string) => {
    syncAndSetCustomers(customers.filter(c => c.id !== id));
  };

  // Let customer pay outstanding credit debt
  const handlePayCustomerDebt = (customerId: string, amount: number) => {
    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          outstandingBalance: Math.max(0, c.outstandingBalance - amount)
        };
      }
      return c;
    });
    syncAndSetCustomers(updatedCustomers);

    // Log as a special cashier invoice with no items just to track cash receipt
    const customerObj = customers.find(c => c.id === customerId);
    if (!customerObj) return;

    const nextNumber = `REC-${Date.now().toString().slice(-6)}`;
    const newReceiptInvoice: Invoice = {
      id: `fac-${Date.now()}`,
      number: nextNumber,
      date: new Date().toISOString().split('T')[0],
      customerId,
      customerName: customerObj.name,
      items: [], // no physical items
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: amount,
      amountPaid: amount,
      paymentMethod: 'Espèces',
      status: 'Payé',
      notes: `Recouvrement de créance client (Paiement crédit)`
    };
    syncAndSetInvoices([newReceiptInvoice, ...invoices]);
  };

  // SUPPLIERS CALLBACKS
  const handleAddSupplier = (sData: Omit<Supplier, 'id' | 'balance'>) => {
    const newSupplier: Supplier = {
      ...sData,
      id: `supp-${Date.now()}`,
      balance: 0
    };
    syncAndSetSuppliers([...suppliers, newSupplier]);
  };

  const handleUpdateSupplier = (sUpdated: Supplier) => {
    syncAndSetSuppliers(suppliers.map(s => s.id === sUpdated.id ? sUpdated : s));
  };

  const handleDeleteSupplier = (id: string) => {
    syncAndSetSuppliers(suppliers.filter(s => s.id !== id));
  };

  // CALLBACKS: SETTINGS
  const handleUpdateSettings = (newSettings: StoreSettings) => {
    syncAndSetSettings(newSettings);
  };

  const handleRestoreAllData = (restoredData: {
    settings: StoreSettings;
    items: Item[];
    movements: StockMovement[];
    customers: Customer[];
    suppliers: Supplier[];
    quotes: Quote[];
    invoices: Invoice[];
  }) => {
    syncAndSetSettings(restoredData.settings);
    syncAndSetItems(restoredData.items);
    syncAndSetMovements(restoredData.movements);
    syncAndSetCustomers(restoredData.customers);
    syncAndSetSuppliers(restoredData.suppliers);
    syncAndSetQuotes(restoredData.quotes);
    syncAndSetInvoices(restoredData.invoices);
  };

  // Render correct panel
  const renderPanel = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            items={items}
            invoices={invoices}
            quotes={quotes}
            customers={customers}
            movements={movements}
            onNavigate={(view) => setCurrentView(view)}
            onQuickRestock={handleQuickRestock}
          />
        );
      case 'items':
        return (
          <ItemsView
            items={items}
            movements={movements}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAdjustStock={handleAdjustStock}
          />
        );
      case 'quotes':
        return (
          <DevisView
            quotes={quotes}
            items={items}
            customers={customers}
            onAddQuote={handleAddQuote}
            onUpdateQuoteStatus={handleUpdateQuoteStatus}
            onDeleteQuote={handleDeleteQuote}
            onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
          />
        );
      case 'invoices':
        return (
          <InvoicesView
            invoices={invoices}
            items={items}
            customers={customers}
            onAddInvoice={handleAddInvoice}
            onDeleteInvoice={handleDeleteInvoice}
          />
        );
      case 'contacts':
        return (
          <ContactsView
            customers={customers}
            suppliers={suppliers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onPayCustomerDebt={handlePayCustomerDebt}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            items={items}
            movements={movements}
            customers={customers}
            suppliers={suppliers}
            quotes={quotes}
            invoices={invoices}
            onRestoreAllData={handleRestoreAllData}
          />
        );
      default:
        return <div className="p-8 text-center text-gray-500 font-mono">Vue introuvable</div>;
    }
  };

  const sidebarItems = [
    { id: 'dashboard', name: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'items', name: 'Catalogue & Stocks', icon: Package },
    { id: 'quotes', name: 'Devis & Proformas', icon: FileText },
    { id: 'invoices', name: 'Ventes & Factures', icon: ShoppingBag },
    { id: 'contacts', name: 'Clients & Fournisseurs', icon: Users },
    { id: 'settings', name: 'Paramètres', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* 1. Mobile Top Navbar - Sticky */}
      <div className="sticky top-0 z-40 bg-slate-900 text-white p-4 flex items-center justify-between shadow-md md:hidden shrink-0 border-b border-amber-500/20">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 p-1 rounded-lg text-slate-950 font-bold text-xs">S</div>
          <span className="font-extrabold text-sm tracking-tight font-display text-white">SUNU QUINCAILLERIE</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 2. Responsive Side Navigation Bar */}
      <aside className={`fixed md:sticky top-[56px] md:top-0 left-0 h-[calc(100vh-56px)] md:h-screen w-64 bg-slate-900 text-white shrink-0 z-30 transform transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } flex flex-col justify-between border-r border-slate-800`}>
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            {/* Store title for desktop */}
            <div className="hidden md:flex items-center space-x-2.5 pb-6 border-b border-slate-800 mb-6">
              <div className="bg-amber-500 p-1.5 rounded-xl text-slate-950 font-black text-sm shadow-xs shrink-0">
                SQ
              </div>
              <div>
                <h2 className="font-black text-sm tracking-wide font-display text-white">SUNU QUINCAILLERIE</h2>
                <span className="text-[10px] text-amber-400 font-mono block">Dakar, Sénégal</span>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const IconComp = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold transform scale-[1.02]' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <IconComp className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar bottom business identity block */}
          <div className="border-t border-slate-800 pt-4 mt-6">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-[10px]">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold font-display">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                <span className="truncate">{settings.storeName}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>GMT Dakar</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
