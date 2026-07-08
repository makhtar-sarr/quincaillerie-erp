import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { StoreSettings, Item, StockMovement, Customer, Supplier, Quote, Invoice } from '../types';
import { DEFAULT_SETTINGS } from '../utils/data';

export interface StoreState {
  settings: StoreSettings;
  items: Item[];
  movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  quotes: Quote[];
  invoices: Invoice[];
}

export type StoreAction =
  | { type: 'SET_SETTINGS'; payload: StoreSettings }
  | { type: 'SET_ITEMS'; payload: Item[] }
  | { type: 'SET_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_QUOTES'; payload: Quote[] }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'RESTORE_ALL_DATA'; payload: StoreState }
  | { type: 'LOAD_INITIAL_DATA'; payload: StoreState };

const initialState: StoreState = {
  settings: DEFAULT_SETTINGS,
  items: [],
  movements: [],
  customers: [],
  suppliers: [],
  quotes: [],
  invoices: [],
};

export function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, movements: action.payload };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_QUOTES':
      return { ...state, quotes: action.payload };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'RESTORE_ALL_DATA':
    case 'LOAD_INITIAL_DATA':
      return { ...action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext<[StoreState, React.Dispatch<StoreAction>] | undefined>(undefined);

const LS_KEYS = {
  settings: 'erp_settings',
  items: 'erp_items',
  movements: 'erp_movements',
  customers: 'erp_customers',
  suppliers: 'erp_suppliers',
  quotes: 'erp_quotes',
  invoices: 'erp_invoices',
} as const;

function readLocalStorage(): StoreState | null {
  const saved = {
    settings: localStorage.getItem(LS_KEYS.settings),
    items: localStorage.getItem(LS_KEYS.items),
    movements: localStorage.getItem(LS_KEYS.movements),
    customers: localStorage.getItem(LS_KEYS.customers),
    suppliers: localStorage.getItem(LS_KEYS.suppliers),
    quotes: localStorage.getItem(LS_KEYS.quotes),
    invoices: localStorage.getItem(LS_KEYS.invoices),
  };

  const hasData = Object.values(saved).some((v) => v !== null);
  if (!hasData) return null;

  return {
    settings: saved.settings ? JSON.parse(saved.settings) : DEFAULT_SETTINGS,
    items: saved.items ? JSON.parse(saved.items) : [],
    movements: saved.movements ? JSON.parse(saved.movements) : [],
    customers: saved.customers ? JSON.parse(saved.customers) : [],
    suppliers: saved.suppliers ? JSON.parse(saved.suppliers) : [],
    quotes: saved.quotes ? JSON.parse(saved.quotes) : [],
    invoices: saved.invoices ? JSON.parse(saved.invoices) : [],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  useEffect(() => {
    const stored = readLocalStorage();
    if (stored) {
      dispatch({ type: 'LOAD_INITIAL_DATA', payload: stored });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.settings, JSON.stringify(state.settings));
    localStorage.setItem(LS_KEYS.items, JSON.stringify(state.items));
    localStorage.setItem(LS_KEYS.movements, JSON.stringify(state.movements));
    localStorage.setItem(LS_KEYS.customers, JSON.stringify(state.customers));
    localStorage.setItem(LS_KEYS.suppliers, JSON.stringify(state.suppliers));
    localStorage.setItem(LS_KEYS.quotes, JSON.stringify(state.quotes));
    localStorage.setItem(LS_KEYS.invoices, JSON.stringify(state.invoices));
  }, [state]);

  return (
    <StoreContext.Provider value={[state, dispatch]}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): [StoreState, React.Dispatch<StoreAction>] {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
