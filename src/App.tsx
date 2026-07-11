import { BrowserRouter, useNavigate } from 'react-router-dom';

import { Item, StockMovement, Customer, Supplier, Quote, Invoice, StoreSettings } from './types';

import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider } from '@/context/AuthContext';
import { useIdGenerator } from './hooks/useIdGenerator';
import { applyDebtPayment } from '@/lib/calc';
import Layout from './components/Layout';
import AppRoutes from './routes';
import { Toaster } from './components/ui/Toast';

import {
  addItem,
  updateItem,
  deleteItem,
  addMovement,
  addInvoice,
  deleteInvoice,
  convertQuote,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  addQuote,
  updateQuoteStatus,
  deleteQuote,
  saveSettings,
  restoreAll,
  getNextNumber,
} from './lib/storageAdapter';

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </StoreProvider>
  );
}

function AppContent() {
  const [state, dispatch] = useStore();
  const { settings, items, movements, customers, suppliers, quotes, invoices } = state;
  const generateId = useIdGenerator();

  const navigate = useNavigate();
  const onNavigate = (view: string) => {
    const pathMap: Record<string, string> = {
      dashboard: '/dashboard',
      items: '/items',
      quotes: '/quotes',
      invoices: '/invoices',
      contacts: '/contacts',
      settings: '/settings',
    };
    navigate(pathMap[view] || '/dashboard');
  };

  const handleAddItem = async (itemData: Omit<Item, 'id' | 'stockCount'>, initialQty: number, operator: string) => {
    const newId = generateId('prod');
    const newItem: Item = {
      ...itemData,
      id: newId,
      stockCount: initialQty
    };

    const saved = await addItem(newItem);
    dispatch({ type: 'SET_ITEMS', payload: [...items, saved] });

    if (initialQty > 0) {
      const newMovement: StockMovement = {
        id: generateId('mov'),
        itemId: newId,
        itemName: newItem.name,
        type: 'ENTREE',
        quantity: initialQty,
        reason: 'Ajustement Inventaire',
        date: new Date().toISOString().split('T')[0],
        referenceCode: 'INIT-INVENTAIRE',
        operator
      };
      const savedMovement = await addMovement(newMovement);
      dispatch({ type: 'SET_MOVEMENTS', payload: [savedMovement, ...movements] });
    }
  };

  const handleUpdateItem = async (updatedItem: Item) => {
    const saved = await updateItem(updatedItem);
    dispatch({ type: 'SET_ITEMS', payload: items.map(i => i.id === saved.id ? saved : i) });
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    dispatch({ type: 'SET_ITEMS', payload: items.filter(i => i.id !== id) });
    dispatch({ type: 'SET_MOVEMENTS', payload: movements.filter(m => m.itemId !== id) });
  };

  const handleAdjustStock = async (
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
    const updatedItem: Item = { ...itemObj, stockCount: newStockCount };

    const savedItem = await updateItem(updatedItem);
    dispatch({ type: 'SET_ITEMS', payload: items.map(i => i.id === itemId ? savedItem : i) });

    const newMovement: StockMovement = {
      id: generateId('mov'),
      itemId,
      itemName: itemObj.name,
      type,
      quantity: qty,
      reason,
      date: new Date().toISOString().split('T')[0],
      referenceCode: ref || "AJUST-MANUEL",
      operator
    };
    const savedMovement = await addMovement(newMovement);
    dispatch({ type: 'SET_MOVEMENTS', payload: [savedMovement, ...movements] });
  };

  const handleQuickRestock = (itemId: string, qty: number) => {
    handleAdjustStock(itemId, qty, 'ENTREE', 'Achat Fournisseur', 'Système (Auto)', 'REAPPRO-RAPIDE');
  };

  const handleAddQuote = async (quoteData: Omit<Quote, 'id' | 'number'>) => {
    const year = new Date(quoteData.date).getFullYear();
    const nextNumber = await getNextNumber('DEV', year);
    const newQuote: Quote = {
      ...quoteData,
      id: generateId('q'),
      number: nextNumber
    };
    const saved = await addQuote(newQuote, 'Système');
    dispatch({ type: 'SET_QUOTES', payload: [saved, ...quotes] });
  };

  const handleUpdateQuoteStatus = async (id: string, status: Quote['status']) => {
    const saved = await updateQuoteStatus(id, status);
    if (saved) {
      dispatch({ type: 'SET_QUOTES', payload: quotes.map(q => q.id === id ? saved : q) });
    } else {
      dispatch({ type: 'SET_QUOTES', payload: quotes.map(q => q.id === id ? { ...q, status } : q) });
    }
  };

  const handleDeleteQuote = async (id: string) => {
    await deleteQuote(id);
    dispatch({ type: 'SET_QUOTES', payload: quotes.filter(q => q.id !== id) });
  };

  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id' | 'number'>, operator: string) => {
    const year = new Date(invoiceData.date).getFullYear();
    const nextNumber = await getNextNumber('FAC', year);
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId('fac'),
      number: nextNumber
    };

    // Stock decrement, SORTIE movements and customer balance are handled
    // atomically by the Rust `add_invoice` command (Tauri) / adapter.
    const saved = await addInvoice(newInvoice, operator);
    dispatch({ type: 'SET_INVOICES', payload: [saved, ...invoices] });
  };

  const handleDeleteInvoice = async (id: string) => {
    // Stock restoration, movement removal and balance reversal are handled
    // atomically by the Rust `delete_invoice` command (Tauri) / adapter.
    await deleteInvoice(id);
    dispatch({ type: 'SET_INVOICES', payload: invoices.filter(inv => inv.id !== id) });
  };

  const handleConvertQuoteToInvoice = async (
    quote: Quote,
    paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement',
    amountPaid: number,
    operator: string
  ) => {
    const savedInvoice = await convertQuote(quote.id, paymentMethod, amountPaid, operator);
    dispatch({ type: 'SET_INVOICES', payload: [savedInvoice, ...invoices] });

    const savedQuote = await updateQuoteStatus(quote.id, 'Accepté');
    if (savedQuote) {
      dispatch({ type: 'SET_QUOTES', payload: quotes.map(q => q.id === quote.id ? savedQuote : q) });
    } else {
      dispatch({ type: 'SET_QUOTES', payload: quotes.map(q => q.id === quote.id ? { ...q, status: 'Accepté' as Quote['status'] } : q) });
    }
  };

  const handleAddCustomer = async (cData: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    const newCustomer: Customer = {
      ...cData,
      id: generateId('cust'),
      outstandingBalance: 0
    };
    const saved = await addCustomer(newCustomer);
    dispatch({ type: 'SET_CUSTOMERS', payload: [...customers, saved] });
  };

  const handleUpdateCustomer = async (cUpdated: Customer) => {
    const saved = await updateCustomer(cUpdated);
    dispatch({ type: 'SET_CUSTOMERS', payload: customers.map(c => c.id === saved.id ? saved : c) });
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    dispatch({ type: 'SET_CUSTOMERS', payload: customers.filter(c => c.id !== id) });
  };

  const handlePayCustomerDebt = async (customerId: string, amount: number) => {
    const customerObj = customers.find(c => c.id === customerId);
    if (!customerObj) return;

    const today = new Date().toISOString().split('T')[0];
    const nextNumber = `REC-${crypto.randomUUID().slice(0, 8)}`;
    const newReceiptInvoice: Invoice = {
      id: generateId('fac'),
      number: nextNumber,
      date: today,
      customerId,
      customerName: customerObj.name,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: amount,
      amountPaid: amount,
      paymentMethod: 'Espèces',
      status: 'Payé',
      notes: `Recouvrement de créance client (Paiement crédit)`
    };
    await addInvoice(newReceiptInvoice, 'Système');
    dispatch({ type: 'SET_INVOICES', payload: [newReceiptInvoice, ...invoices] });

    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          outstandingBalance: applyDebtPayment(c.outstandingBalance, amount)
        };
      }
      return c;
    });
    const updatedCustomer = updatedCustomers.find(c => c.id === customerId);
    if (updatedCustomer) {
      await updateCustomer(updatedCustomer);
    }
    dispatch({ type: 'SET_CUSTOMERS', payload: updatedCustomers });
  };

  const handleAddSupplier = async (sData: Omit<Supplier, 'id' | 'balance'>) => {
    const newSupplier: Supplier = {
      ...sData,
      id: generateId('supp'),
      balance: 0
    };
    const saved = await addSupplier(newSupplier);
    dispatch({ type: 'SET_SUPPLIERS', payload: [...suppliers, saved] });
  };

  const handleUpdateSupplier = async (sUpdated: Supplier) => {
    const saved = await updateSupplier(sUpdated);
    dispatch({ type: 'SET_SUPPLIERS', payload: suppliers.map(s => s.id === saved.id ? saved : s) });
  };

  const handleDeleteSupplier = async (id: string) => {
    await deleteSupplier(id);
    dispatch({ type: 'SET_SUPPLIERS', payload: suppliers.filter(s => s.id !== id) });
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    await saveSettings(newSettings);
    dispatch({ type: 'SET_SETTINGS', payload: newSettings });
  };

  const handleRestoreAllData = async (restoredData: {
    settings: StoreSettings;
    items: Item[];
    movements: StockMovement[];
    customers: Customer[];
    suppliers: Supplier[];
    quotes: Quote[];
    invoices: Invoice[];
  }) => {
    await restoreAll(restoredData);
    dispatch({ type: 'RESTORE_ALL_DATA', payload: restoredData });
  };

  return (
    <Layout settings={settings}>
      <AppRoutes
        items={items}
        movements={movements}
        customers={customers}
        suppliers={suppliers}
        quotes={quotes}
        invoices={invoices}
        settings={settings}
        onNavigate={onNavigate}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onAdjustStock={handleAdjustStock}
        onQuickRestock={handleQuickRestock}
        onAddQuote={handleAddQuote}
        onUpdateQuoteStatus={handleUpdateQuoteStatus}
        onDeleteQuote={handleDeleteQuote}
        onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
        onAddInvoice={handleAddInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        onAddCustomer={handleAddCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onPayCustomerDebt={handlePayCustomerDebt}
        onAddSupplier={handleAddSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        onUpdateSettings={handleUpdateSettings}
        onRestoreAllData={handleRestoreAllData}
      />
    </Layout>
  );
}
