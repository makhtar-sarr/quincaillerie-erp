import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingBag,
  Users,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Item, StockMovement, Customer, Supplier, Quote, Invoice, StoreSettings } from './types';

const DashboardView = lazy(() => import('./components/DashboardView'));
const ItemsView = lazy(() => import('./components/ItemsView'));
const DevisView = lazy(() => import('./components/DevisView'));
const InvoicesView = lazy(() => import('./components/InvoicesView'));
const ContactsView = lazy(() => import('./components/ContactsView'));
const SettingsView = lazy(() => import('./components/SettingsView'));

export interface SidebarItem {
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
}

export const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', name: 'Tableau de Bord', path: '/dashboard', icon: LayoutDashboard },
  { id: 'items', name: 'Catalogue & Stocks', path: '/items', icon: Package },
  { id: 'quotes', name: 'Devis & Proformas', path: '/quotes', icon: FileText },
  { id: 'invoices', name: 'Ventes & Factures', path: '/invoices', icon: ShoppingBag },
  { id: 'contacts', name: 'Clients & Fournisseurs', path: '/contacts', icon: Users },
  { id: 'settings', name: 'Paramètres', path: '/settings', icon: Settings },
];

interface AppRoutesProps {
  items: Item[];
  movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  quotes: Quote[];
  invoices: Invoice[];
  settings: StoreSettings;
  onNavigate: (view: string) => void;
  onAddItem: (itemData: Omit<Item, 'id' | 'stockCount'>, initialQty: number, operator: string) => void;
  onUpdateItem: (updatedItem: Item) => void;
  onDeleteItem: (id: string) => void;
  onAdjustStock: (
    itemId: string,
    qty: number,
    type: 'ENTREE' | 'SORTIE',
    reason: StockMovement['reason'],
    operator: string,
    ref: string
  ) => void;
  onQuickRestock: (itemId: string, qty: number) => void;
  onAddQuote: (quoteData: Omit<Quote, 'id' | 'number'>) => void;
  onUpdateQuoteStatus: (id: string, status: Quote['status']) => void;
  onDeleteQuote: (id: string) => void;
  onConvertQuoteToInvoice: (
    quote: Quote,
    paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement',
    amountPaid: number,
    operator: string
  ) => void;
  onAddInvoice: (invoiceData: Omit<Invoice, 'id' | 'number'>, operator: string) => void;
  onDeleteInvoice: (id: string) => void;
  onAddCustomer: (cData: Omit<Customer, 'id' | 'outstandingBalance'>) => void;
  onUpdateCustomer: (cUpdated: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onPayCustomerDebt: (customerId: string, amount: number) => void;
  onAddSupplier: (sData: Omit<Supplier, 'id' | 'balance'>) => void;
  onUpdateSupplier: (sUpdated: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onRestoreAllData: (restoredData: {
    settings: StoreSettings;
    items: Item[];
    movements: StockMovement[];
    customers: Customer[];
    suppliers: Supplier[];
    quotes: Quote[];
    invoices: Invoice[];
  }) => void;
}

export default function AppRoutes({
  items,
  movements,
  customers,
  suppliers,
  quotes,
  invoices,
  settings,
  onNavigate,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAdjustStock,
  onQuickRestock,
  onAddQuote,
  onUpdateQuoteStatus,
  onDeleteQuote,
  onConvertQuoteToInvoice,
  onAddInvoice,
  onDeleteInvoice,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onPayCustomerDebt,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onUpdateSettings,
  onRestoreAllData,
}: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <DashboardView
            items={items}
            invoices={invoices}
            quotes={quotes}
            customers={customers}
            movements={movements}
            onNavigate={onNavigate}
            onQuickRestock={onQuickRestock}
          />
        }
      />
      <Route
        path="/items"
        element={
          <ItemsView
            items={items}
            movements={movements}
            onAddItem={onAddItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onAdjustStock={onAdjustStock}
          />
        }
      />
      <Route
        path="/quotes"
        element={
          <DevisView
            quotes={quotes}
            items={items}
            customers={customers}
            onAddQuote={onAddQuote}
            onUpdateQuoteStatus={onUpdateQuoteStatus}
            onDeleteQuote={onDeleteQuote}
            onConvertQuoteToInvoice={onConvertQuoteToInvoice}
          />
        }
      />
      <Route
        path="/invoices"
        element={
          <InvoicesView
            invoices={invoices}
            items={items}
            customers={customers}
            onAddInvoice={onAddInvoice}
            onDeleteInvoice={onDeleteInvoice}
          />
        }
      />
      <Route
        path="/contacts"
        element={
          <ContactsView
            customers={customers}
            suppliers={suppliers}
            onAddCustomer={onAddCustomer}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteCustomer={onDeleteCustomer}
            onPayCustomerDebt={onPayCustomerDebt}
            onAddSupplier={onAddSupplier}
            onUpdateSupplier={onUpdateSupplier}
            onDeleteSupplier={onDeleteSupplier}
          />
        }
      />
      <Route
        path="/settings"
        element={
          <SettingsView
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            items={items}
            movements={movements}
            customers={customers}
            suppliers={suppliers}
            quotes={quotes}
            invoices={invoices}
            onRestoreAllData={onRestoreAllData}
          />
        }
      />
    </Routes>
  );
}
