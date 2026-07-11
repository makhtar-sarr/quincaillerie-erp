import { invoke } from '@tauri-apps/api/core';
import type {
  StoreSettings,
  Item,
  StockMovement,
  Customer,
  Supplier,
  Quote,
  Invoice,
  AuditEntry,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/utils/data';
import { formatNumber } from '@/lib/numbering';

/**
 * Unified storage adapter.
 *
 * Provides a single async API consumed by StoreContext (T19), App.tsx handlers
 * (T20), import.ts (T23) and useCloudBackups.ts (T24). Every function branches
 * on `isTauri()`:
 *   - Tauri mode  → delegates to a Rust command via `invoke()`
 *   - Web mode    → reads/writes `localStorage` (the legacy persistence layer)
 *
 * The localStorage keys are centralized here so other modules (StoreContext)
 * can import them instead of re-declaring magic strings.
 */

export const LS_KEYS = {
  settings: 'erp_settings',
  items: 'erp_items',
  movements: 'erp_movements',
  customers: 'erp_customers',
  suppliers: 'erp_suppliers',
  quotes: 'erp_quotes',
  invoices: 'erp_invoices',
  audit: 'erp_audit',
} as const;

export interface StoreState {
  settings: StoreSettings;
  items: Item[];
  movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  quotes: Quote[];
  invoices: Invoice[];
}

/** Detect whether the app runs inside a Tauri webview. */
export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Small delay so web-mode writes behave like real async I/O. */
const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Read every localStorage key and parse JSON, falling back to defaults. */
export function readLocalStorage(): StoreState {
  if (!hasLocalStorage()) {
    return {
      settings: DEFAULT_SETTINGS,
      items: [],
      movements: [],
      customers: [],
      suppliers: [],
      quotes: [],
      invoices: [],
    };
  }

  const raw = {
    settings: window.localStorage.getItem(LS_KEYS.settings),
    items: window.localStorage.getItem(LS_KEYS.items),
    movements: window.localStorage.getItem(LS_KEYS.movements),
    customers: window.localStorage.getItem(LS_KEYS.customers),
    suppliers: window.localStorage.getItem(LS_KEYS.suppliers),
    quotes: window.localStorage.getItem(LS_KEYS.quotes),
    invoices: window.localStorage.getItem(LS_KEYS.invoices),
  };

  return {
    settings: raw.settings ? JSON.parse(raw.settings) : DEFAULT_SETTINGS,
    items: raw.items ? JSON.parse(raw.items) : [],
    movements: raw.movements ? JSON.parse(raw.movements) : [],
    customers: raw.customers ? JSON.parse(raw.customers) : [],
    suppliers: raw.suppliers ? JSON.parse(raw.suppliers) : [],
    quotes: raw.quotes ? JSON.parse(raw.quotes) : [],
    invoices: raw.invoices ? JSON.parse(raw.invoices) : [],
  };
}

/** Serialize `data` to JSON and write it under `key`. */
export function writeLocalStorage(key: string, data: unknown): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

export async function loadAll(): Promise<StoreState> {
  if (isTauri()) {
    const [settings, items, movements, customers, suppliers, quotes, invoices] =
      await Promise.all([
        invoke<StoreSettings>('get_settings'),
        invoke<Item[]>('get_items'),
        invoke<StockMovement[]>('get_movements'),
        invoke<Customer[]>('get_customers'),
        invoke<Supplier[]>('get_suppliers'),
        invoke<Quote[]>('get_quotes'),
        invoke<Invoice[]>('get_invoices'),
      ]);
    return { settings, items, movements, customers, suppliers, quotes, invoices };
  }
  return readLocalStorage();
}

export async function restoreAll(data: StoreState): Promise<void> {
  if (isTauri()) {
    await invoke('restore_all', { data });
    return;
  }
  writeLocalStorage(LS_KEYS.settings, data.settings);
  writeLocalStorage(LS_KEYS.items, data.items);
  writeLocalStorage(LS_KEYS.movements, data.movements);
  writeLocalStorage(LS_KEYS.customers, data.customers);
  writeLocalStorage(LS_KEYS.suppliers, data.suppliers);
  writeLocalStorage(LS_KEYS.quotes, data.quotes);
  writeLocalStorage(LS_KEYS.invoices, data.invoices);
}

export async function migrateFromLocalStorage(payload: StoreState): Promise<boolean> {
  if (isTauri()) {
    return invoke<boolean>('migrate_local_storage', { payload });
  }
  // In web mode the data already lives in localStorage; nothing to migrate.
  await nextTick();
  return true;
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  if (isTauri()) {
    await invoke('update_settings', { settings });
    return;
  }
  writeLocalStorage(LS_KEYS.settings, settings);
}

export async function addItem(item: Item): Promise<Item> {
  if (isTauri()) {
    return invoke<Item>('add_item', { item });
  }
  const state = readLocalStorage();
  state.items = [...state.items, item];
  writeLocalStorage(LS_KEYS.items, state.items);
  return item;
}

export async function updateItem(item: Item): Promise<Item> {
  if (isTauri()) {
    return invoke<Item>('update_item', { item });
  }
  const state = readLocalStorage();
  state.items = state.items.map((i) => (i.id === item.id ? item : i));
  writeLocalStorage(LS_KEYS.items, state.items);
  return item;
}

export async function deleteItem(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_item', { id });
    return;
  }
  const state = readLocalStorage();
  state.items = state.items.filter((i) => i.id !== id);
  writeLocalStorage(LS_KEYS.items, state.items);
}

export async function addCustomer(customer: Customer): Promise<Customer> {
  if (isTauri()) {
    return invoke<Customer>('add_customer', { customer });
  }
  const state = readLocalStorage();
  state.customers = [...state.customers, customer];
  writeLocalStorage(LS_KEYS.customers, state.customers);
  return customer;
}

export async function updateCustomer(customer: Customer): Promise<Customer> {
  if (isTauri()) {
    return invoke<Customer>('update_customer', { customer });
  }
  const state = readLocalStorage();
  state.customers = state.customers.map((c) => (c.id === customer.id ? customer : c));
  writeLocalStorage(LS_KEYS.customers, state.customers);
  return customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_customer', { id });
    return;
  }
  const state = readLocalStorage();
  state.customers = state.customers.filter((c) => c.id !== id);
  writeLocalStorage(LS_KEYS.customers, state.customers);
}

export async function addSupplier(supplier: Supplier): Promise<Supplier> {
  if (isTauri()) {
    return invoke<Supplier>('add_supplier', { supplier });
  }
  const state = readLocalStorage();
  state.suppliers = [...state.suppliers, supplier];
  writeLocalStorage(LS_KEYS.suppliers, state.suppliers);
  return supplier;
}

export async function updateSupplier(supplier: Supplier): Promise<Supplier> {
  if (isTauri()) {
    return invoke<Supplier>('update_supplier', { supplier });
  }
  const state = readLocalStorage();
  state.suppliers = state.suppliers.map((s) => (s.id === supplier.id ? supplier : s));
  writeLocalStorage(LS_KEYS.suppliers, state.suppliers);
  return supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_supplier', { id });
    return;
  }
  const state = readLocalStorage();
  state.suppliers = state.suppliers.filter((s) => s.id !== id);
  writeLocalStorage(LS_KEYS.suppliers, state.suppliers);
}

export async function addMovement(movement: StockMovement): Promise<StockMovement> {
  if (isTauri()) {
    return invoke<StockMovement>('add_movement', { movement });
  }
  const state = readLocalStorage();
  state.movements = [...state.movements, movement];
  writeLocalStorage(LS_KEYS.movements, state.movements);
  return movement;
}

export async function addQuote(quote: Quote, operator: string): Promise<Quote> {
  if (isTauri()) {
    return invoke<Quote>('add_quote', { quote });
  }
  const state = readLocalStorage();
  state.quotes = [...state.quotes, quote];
  writeLocalStorage(LS_KEYS.quotes, state.quotes);
  return quote;
}

export async function updateQuoteStatus(id: string, status: string): Promise<Quote | void> {
  if (isTauri()) {
    await invoke('update_quote_status', { quote_id: id, status });
    return;
  }
  const state = readLocalStorage();
  state.quotes = state.quotes.map((q) =>
    q.id === id ? ({ ...q, status: status as Quote['status'] }) : q
  );
  writeLocalStorage(LS_KEYS.quotes, state.quotes);
  return state.quotes.find((q) => q.id === id) as Quote;
}

export async function deleteQuote(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_quote', { quote_id: id });
    return;
  }
  const state = readLocalStorage();
  state.quotes = state.quotes.filter((q) => q.id !== id);
  writeLocalStorage(LS_KEYS.quotes, state.quotes);
}

export async function addInvoice(
  invoice: Invoice,
  operator: string,
  kind?: string
): Promise<Invoice> {
  if (isTauri()) {
    return invoke<Invoice>('add_invoice', { invoice });
  }
  const state = readLocalStorage();
  state.invoices = [...state.invoices, invoice];
  writeLocalStorage(LS_KEYS.invoices, state.invoices);
  return invoice;
}

export interface DeleteInvoiceResult {
  restoredItems: Item[];
  removedMovements: StockMovement[];
  restoredCustomer: Customer;
}

export async function deleteInvoice(id: string): Promise<DeleteInvoiceResult | void> {
  if (isTauri()) {
    // Rust handles reversal server-side; return void for Tauri mode.
    // The caller re-reads state after delete.
    await invoke('delete_invoice', { invoice_id: id });
    return;
  }

  // Web fallback: compute the reversal from current localStorage state.
  // The caller is responsible for dispatching the resulting state; we only
  // read here and return the reversal payload (no write — StoreContext's
  // effect persists the dispatched state).
  const state = readLocalStorage();
  const invoice = state.invoices.find((inv) => inv.id === id);
  if (!invoice) {
    throw new Error(`Facture introuvable: ${id}`);
  }

  const restoredItems: Item[] = [];
  for (const line of invoice.items) {
    const item = state.items.find((i) => i.id === line.itemId);
    if (item) {
      const updated: Item = { ...item, stockCount: item.stockCount + line.quantity };
      restoredItems.push(updated);
    }
  }

  const removedMovements = state.movements.filter(
    (m) => m.referenceCode === invoice.id || m.referenceCode === invoice.number
  );

  const customer = state.customers.find((c) => c.id === invoice.customerId);
  const outstandingDelta = invoice.total - invoice.amountPaid;
  const restoredCustomer: Customer = customer
    ? { ...customer, outstandingBalance: customer.outstandingBalance - outstandingDelta }
    : ({ id: invoice.customerId, name: invoice.customerName, phone: '', outstandingBalance: -outstandingDelta } as Customer);

  return { restoredItems, removedMovements, restoredCustomer };
}

export async function convertQuote(
  quoteId: string,
  method: string,
  amountPaid: number,
  operator: string
): Promise<Invoice> {
  if (isTauri()) {
    return invoke<Invoice>('convert_quote_to_invoice', { quoteId });
  }

  // Web fallback: build the invoice object from the quote. Stock/customer side
  // effects are applied by the caller via StoreContext dispatch; we return the
  // fully-formed invoice (with a generated number) so the caller can persist it.
  const state = readLocalStorage();
  const quote = state.quotes.find((q) => q.id === quoteId);
  if (!quote) {
    throw new Error(`Devis introuvable: ${quoteId}`);
  }

  const year = new Date(quote.date).getFullYear();
  const number = await getNextNumber('FAC', year);

  const invoice: Invoice = {
    id: `fac-${crypto.randomUUID()}`,
    number,
    date: quote.date,
    customerId: quote.customerId,
    customerName: quote.customerName,
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    amountPaid,
    paymentMethod: method as Invoice['paymentMethod'],
    status: amountPaid >= quote.total ? 'Payé' : amountPaid > 0 ? 'Partiel' : 'Non Payé',
    notes: quote.notes,
    quoteId: quote.id,
  };

  return invoice;
}

export async function getNextNumber(prefix: string, year: number): Promise<string> {
  if (isTauri()) {
    return invoke<string>('get_next_number', { prefix, date: `${year}-01-01` });
  }

  const state = readLocalStorage();
  const pool =
    prefix === 'FAC'
      ? state.invoices.map((i) => i.number)
      : prefix === 'DEV'
        ? state.quotes.map((q) => q.number)
        : [];

  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let max = 0;
  for (const num of pool) {
    const m = pattern.exec(num);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return formatNumber(prefix, year, max + 1);
}

// ---------------------------------------------------------------------------
// Audit trail
//
// NOTE: the localStorage (web) audit log is advisory-only. It is not
// tamper-proof — anyone with devtools access can edit `erp_audit`. The
// authoritative, tamper-resistant trail lives in the SQLite `audit_log` table
// used in Tauri mode. Callers must not rely on the web log for security.
// ---------------------------------------------------------------------------

const MAX_AUDIT_ENTRIES = 1000;

/** Append an audit entry. Tauri → `add_audit_entry`; web → localStorage FIFO. */
export async function addAuditEntry(entry: AuditEntry): Promise<void> {
  if (isTauri()) {
    await invoke('add_audit_entry', { entry });
    return;
  }

  const raw = window.localStorage.getItem(LS_KEYS.audit);
  const arr: AuditEntry[] = raw ? JSON.parse(raw) : [];

  const finalEntry: AuditEntry = {
    ...entry,
    id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: entry.ts || new Date().toISOString(),
  };

  arr.push(finalEntry);

  // FIFO trim: keep only the most recent MAX_AUDIT_ENTRIES entries.
  if (arr.length > MAX_AUDIT_ENTRIES) {
    arr.splice(0, arr.length - MAX_AUDIT_ENTRIES);
  }

  writeLocalStorage(LS_KEYS.audit, arr);
}

/** Return the full audit log, newest first. */
export async function getAuditLog(): Promise<AuditEntry[]> {
  if (isTauri()) {
    return invoke<AuditEntry[]>('get_audit_log');
  }

  const raw = window.localStorage.getItem(LS_KEYS.audit);
  const arr: AuditEntry[] = raw ? JSON.parse(raw) : [];
  return [...arr].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
}
