import { useState, useEffect, useCallback } from 'react';
import { Item, Customer, Invoice, LineItem } from '../types';
import { useLineItems } from './useLineItems';

export interface UseInvoiceFormReturn {
  /** Line items in the invoice */
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
  /** Invoice notes */
  notes: string;
  /** Computed totals (subtotal, tax, total) */
  totals: { subtotal: number; tax: number; total: number };

  /** Selected customer ID */
  customerId: string;
  /** Invoice date string (YYYY-MM-DD) */
  invoiceDate: string;
  /** Payment method */
  paymentMethod: Invoice['paymentMethod'];
  /** Amount paid by customer (FCFA) */
  amountPaid: number;

  // Setters
  setCustomerId: (id: string) => void;
  setInvoiceDate: (date: string) => void;
  setPaymentMethod: (method: Invoice['paymentMethod']) => void;
  setAmountPaid: (amount: number) => void;
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
  handleSaveInvoice: () => boolean;
  resetForm: () => void;
}

/**
 * Hook that manages invoice creation wizard form state.
 *
 * Composes `useLineItems(items, { validateStock: true })` for line item
 * management and adds invoice-specific fields (customerId, date, payment,
 * amountPaid). Handles validation, status determination, and the final
 * `onAddInvoice` call.
 */
export function useInvoiceForm(
  items: Item[],
  customers: Customer[],
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'number'>, operator: string) => void,
): UseInvoiceFormReturn {
  const {
    lines,
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
  } = useLineItems(items, { validateStock: true });

  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [paymentMethod, setPaymentMethod] =
    useState<Invoice['paymentMethod']>('Espèces');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Automatically keep amountPaid in sync with the computed total
  // (cashiers can still override if needed).
  useEffect(() => {
    setAmountPaid(totals.total);
  }, [totals.total]);

  const handleSaveInvoice = useCallback((): boolean => {
    if (!customerId) {
      alert('Veuillez choisir un client.');
      return false;
    }
    if (lines.length === 0) {
      alert('Veuillez ajouter des articles avant de valider la vente.');
      return false;
    }

    const customerObj = customers.find((c) => c.id === customerId);
    if (!customerObj) return false;

    let invoiceStatus: Invoice['status'] = 'Payé';
    if (amountPaid === 0) {
      invoiceStatus = 'Non Payé';
    } else if (amountPaid < totals.total) {
      invoiceStatus = 'Partiel';
    }

    onAddInvoice(
      {
        date: invoiceDate,
        customerId: customerObj.id,
        customerName: customerObj.name,
        items: [...lines],
        subtotal: totals.subtotal,
        discount,
        tax: totals.tax,
        total: totals.total,
        amountPaid,
        paymentMethod,
        status: invoiceStatus,
        notes,
      },
      operator,
    );

    return true;
  }, [
    customerId,
    lines,
    customers,
    amountPaid,
    totals,
    invoiceDate,
    discount,
    paymentMethod,
    notes,
    operator,
    onAddInvoice,
  ]);

  const resetForm = useCallback(() => {
    setCustomerId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Espèces');
    setAmountPaid(0);
    resetLineItems();
  }, [resetLineItems]);

  return {
    lines,
    tempItemId,
    tempQty,
    tempPrice,
    discount,
    operator,
    notes,
    totals,
    customerId,
    invoiceDate,
    paymentMethod,
    amountPaid,
    setCustomerId,
    setInvoiceDate,
    setPaymentMethod,
    setAmountPaid,
    setTempItemId,
    setTempQty,
    setTempPrice,
    setDiscount,
    setOperator,
    setNotes,
    handleTempProductChange,
    handleAddLine,
    removeLine,
    handleSaveInvoice,
    resetForm,
  };
}
