import { BrowserRouter, useNavigate } from 'react-router-dom';

import { Item, StockMovement, Customer, Supplier, Quote, Invoice, StoreSettings } from './types';

import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider } from '@/context/AuthContext';
import { useIdGenerator } from './hooks/useIdGenerator';
import Layout from './components/Layout';
import AppRoutes from './routes';
import { Toaster } from './components/ui/Toast';

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

  const handleAddItem = (itemData: Omit<Item, 'id' | 'stockCount'>, initialQty: number, operator: string) => {
    const newId = generateId('prod');
    const newItem: Item = {
      ...itemData,
      id: newId,
      stockCount: initialQty
    };

    dispatch({ type: 'SET_ITEMS', payload: [...items, newItem] });

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
      dispatch({ type: 'SET_MOVEMENTS', payload: [newMovement, ...movements] });
    }
  };

  const handleUpdateItem = (updatedItem: Item) => {
    dispatch({ type: 'SET_ITEMS', payload: items.map(i => i.id === updatedItem.id ? updatedItem : i) });
  };

  const handleDeleteItem = (id: string) => {
    dispatch({ type: 'SET_ITEMS', payload: items.filter(i => i.id !== id) });
    dispatch({ type: 'SET_MOVEMENTS', payload: movements.filter(m => m.itemId !== id) });
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

    dispatch({ type: 'SET_ITEMS', payload: items.map(i => i.id === itemId ? { ...i, stockCount: newStockCount } : i) });

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
    dispatch({ type: 'SET_MOVEMENTS', payload: [newMovement, ...movements] });
  };

  const handleQuickRestock = (itemId: string, qty: number) => {
    handleAdjustStock(itemId, qty, 'ENTREE', 'Achat Fournisseur', 'Système (Auto)', 'REAPPRO-RAPIDE');
  };

  const handleAddQuote = (quoteData: Omit<Quote, 'id' | 'number'>) => {
    const nextNumber = `DEV-2026-${String(quotes.length + 1).padStart(3, '0')}`;
    const newQuote: Quote = {
      ...quoteData,
      id: generateId('q'),
      number: nextNumber
    };
    dispatch({ type: 'SET_QUOTES', payload: [newQuote, ...quotes] });
  };

  const handleUpdateQuoteStatus = (id: string, status: Quote['status']) => {
    dispatch({ type: 'SET_QUOTES', payload: quotes.map(q => q.id === id ? { ...q, status } : q) });
  };

  const handleDeleteQuote = (id: string) => {
    dispatch({ type: 'SET_QUOTES', payload: quotes.filter(q => q.id !== id) });
  };

  const handleAddInvoice = (invoiceData: Omit<Invoice, 'id' | 'number'>, operator: string) => {
    const nextNumber = `FAC-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId('fac'),
      number: nextNumber
    };

    dispatch({ type: 'SET_INVOICES', payload: [newInvoice, ...invoices] });

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
    dispatch({ type: 'SET_ITEMS', payload: updatedItems });

    const newMovements: StockMovement[] = invoiceData.items.map((line, idx) => ({
      id: `${generateId('mov')}-${idx}`,
      itemId: line.itemId,
      itemName: line.itemName,
      type: 'SORTIE',
      quantity: line.quantity,
      reason: 'Vente Client',
      date: invoiceData.date,
      referenceCode: nextNumber,
      operator
    }));
    dispatch({ type: 'SET_MOVEMENTS', payload: [...newMovements, ...movements] });

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
      dispatch({ type: 'SET_CUSTOMERS', payload: updatedCustomers });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const invoiceObj = invoices.find(inv => inv.id === id);
    if (!invoiceObj) return;

    dispatch({ type: 'SET_INVOICES', payload: invoices.filter(inv => inv.id !== id) });

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
    dispatch({ type: 'SET_ITEMS', payload: restoredItems });

    dispatch({ type: 'SET_MOVEMENTS', payload: movements.filter(m => m.referenceCode !== invoiceObj.number) });

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
      dispatch({ type: 'SET_CUSTOMERS', payload: restoredCustomers });
    }
  };

  const handleConvertQuoteToInvoice = (
    quote: Quote,
    paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement',
    amountPaid: number,
    operator: string
  ) => {
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

    handleUpdateQuoteStatus(quote.id, 'Accepté');
  };

  const handleAddCustomer = (cData: Omit<Customer, 'id' | 'outstandingBalance'>) => {
    const newCustomer: Customer = {
      ...cData,
      id: generateId('cust'),
      outstandingBalance: 0
    };
    dispatch({ type: 'SET_CUSTOMERS', payload: [...customers, newCustomer] });
  };

  const handleUpdateCustomer = (cUpdated: Customer) => {
    dispatch({ type: 'SET_CUSTOMERS', payload: customers.map(c => c.id === cUpdated.id ? cUpdated : c) });
  };

  const handleDeleteCustomer = (id: string) => {
    dispatch({ type: 'SET_CUSTOMERS', payload: customers.filter(c => c.id !== id) });
  };

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
    dispatch({ type: 'SET_CUSTOMERS', payload: updatedCustomers });

    const customerObj = customers.find(c => c.id === customerId);
    if (!customerObj) return;

    const nextNumber = `REC-${Date.now().toString().slice(-6)}`;
    const newReceiptInvoice: Invoice = {
      id: generateId('fac'),
      number: nextNumber,
      date: new Date().toISOString().split('T')[0],
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
    dispatch({ type: 'SET_INVOICES', payload: [newReceiptInvoice, ...invoices] });
  };

  const handleAddSupplier = (sData: Omit<Supplier, 'id' | 'balance'>) => {
    const newSupplier: Supplier = {
      ...sData,
      id: generateId('supp'),
      balance: 0
    };
    dispatch({ type: 'SET_SUPPLIERS', payload: [...suppliers, newSupplier] });
  };

  const handleUpdateSupplier = (sUpdated: Supplier) => {
    dispatch({ type: 'SET_SUPPLIERS', payload: suppliers.map(s => s.id === sUpdated.id ? sUpdated : s) });
  };

  const handleDeleteSupplier = (id: string) => {
    dispatch({ type: 'SET_SUPPLIERS', payload: suppliers.filter(s => s.id !== id) });
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: newSettings });
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
