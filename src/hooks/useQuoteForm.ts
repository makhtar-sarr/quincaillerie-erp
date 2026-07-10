import { useState, useMemo, useCallback } from 'react';
import { Item, Customer, Quote, LineItem } from '../types';
import { useLineItems } from './useLineItems';
import { toast } from 'sonner';

export interface UseQuoteFormReturn {
  /** Search query for filtering quotes */
  search: string;
  /** Set search query */
  setSearch: (q: string) => void;
  /** Status filter value ('Tous' or a quote status) */
  statusFilter: string;
  /** Set status filter */
  setStatusFilter: (f: string) => void;
  /** Filtered list of quotes (by search + status, sorted desc by number) */
  filteredQuotes: Quote[];

  /** Selected customer ID */
  customerId: string;
  /** Set selected customer ID */
  setCustomerId: (id: string) => void;
  /** Quote date (YYYY-MM-DD) */
  quoteDate: string;
  /** Set quote date */
  setQuoteDate: (date: string) => void;
  /** Quote expiry date (YYYY-MM-DD) */
  expiryDate: string;
  /** Set expiry date */
  setExpiryDate: (date: string) => void;

  /** Line items in the quote */
  lines: LineItem[];
  /** Temporary item ID for picker */
  tempItemId: string;
  /** Temporary quantity for picker */
  tempQty: number;
  /** Temporary price for picker */
  tempPrice: number;
  /** Discount amount in FCFA */
  discount: number;
  /** Operator name */
  operator: string;
  /** Quote notes */
  notes: string;
  /** Computed totals (subtotal, tax, total) */
  totals: { subtotal: number; tax: number; total: number };

  // Setters
  setLines: (lines: LineItem[]) => void;
  setTempItemId: (id: string) => void;
  setTempQty: (qty: number) => void;
  setTempPrice: (price: number) => void;
  setDiscount: (discount: number) => void;
  setOperator: (op: string) => void;
  setNotes: (notes: string) => void;

  // Actions
  handleTempProductChange: (itemId: string) => void;
  handleAddLine: () => boolean;
  removeLine: (index: number) => void;
  handleSaveQuote: (status: Quote['status']) => boolean;
  resetForm: () => void;
}

/**
 * Hook that manages quote creation wizard form state and filtering.
 *
 * Composes `useLineItems(items, { validateStock: false })` for line item
 * management and adds quote-specific fields (customerId, quoteDate, expiryDate)
 * along with search/status filtering logic.
 */
export function useQuoteForm(
  quotes: Quote[],
  items: Item[],
  customers: Customer[],
  onAddQuote: (quote: Omit<Quote, 'id' | 'number'>) => void,
  onUpdateQuoteStatus: (id: string, status: Quote['status']) => void,
  onConvertQuoteToInvoice: (
    quote: Quote,
    paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement',
    amountPaid: number,
    operator: string,
  ) => void,
): UseQuoteFormReturn {
  // --- filter state ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  // --- form state ---
  const [customerId, setCustomerId] = useState('');
  const [quoteDate, setQuoteDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [expiryDate, setExpiryDate] = useState(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );

  // --- line-item management (no stock validation for quotes) ---
  const {
    lines,
    setLines,
    tempItemId,
    setTempItemId,
    tempQty,
    setTempQty,
    tempPrice,
    setTempPrice,
    discount,
    setDiscount,
    operator,
    setOperator,
    notes,
    setNotes,
    handleTempProductChange,
    handleAddLine,
    removeLine,
    reset: resetLineItems,
    totals,
  } = useLineItems(items, { validateStock: false });

  // --- derived data ---

  const filteredQuotes = useMemo(() => {
    return quotes
      .filter((q) => {
        const matchSearch =
          q.number.toLowerCase().includes(search.toLowerCase()) ||
          q.customerName.toLowerCase().includes(search.toLowerCase());
        const matchStatus =
          statusFilter === 'Tous' || q.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => b.number.localeCompare(a.number));
  }, [quotes, search, statusFilter]);

  // --- actions ---

  const resetForm = useCallback(() => {
    setCustomerId('');
    setQuoteDate(new Date().toISOString().split('T')[0]);
    setExpiryDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    );
    resetLineItems();
  }, [resetLineItems]);

  const handleSaveQuote = useCallback(
    (status: Quote['status']): boolean => {
      if (!customerId) {
        toast.error('Veuillez sélectionner un client.');
        return false;
      }
      if (lines.length === 0) {
        toast.error("Veuillez ajouter au moins un article.");
        return false;
      }

      const customerObj = customers.find((c) => c.id === customerId);
      if (!customerObj) return false;

      onAddQuote({
        date: quoteDate,
        expiryDate,
        customerId: customerObj.id,
        customerName: customerObj.name,
        items: [...lines],
        subtotal: totals.subtotal,
        discount,
        tax: totals.tax,
        total: totals.total,
        status,
        notes,
      });

      resetForm();
      return true;
    },
    [
      customerId,
      lines,
      customers,
      quoteDate,
      expiryDate,
      discount,
      notes,
      totals,
      onAddQuote,
      resetForm,
    ],
  );

  return {
    // filter
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredQuotes,

    // form state
    customerId,
    setCustomerId,
    quoteDate,
    setQuoteDate,
    expiryDate,
    setExpiryDate,

    // line items
    lines,
    setLines,
    tempItemId,
    setTempItemId,
    tempQty,
    setTempQty,
    tempPrice,
    setTempPrice,
    discount,
    setDiscount,
    operator,
    setOperator,
    notes,
    setNotes,
    totals,

    // actions
    handleTempProductChange,
    handleAddLine,
    removeLine,
    handleSaveQuote,
    resetForm,
  };
}
