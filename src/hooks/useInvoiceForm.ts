import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Item, Customer, Invoice, LineItem } from '../types';
import { invoiceSchema } from '../schemas/invoice';
import { computeInvoiceTotals } from '../lib/calc';
import { TAX_RATE } from '../utils/vat';
import { toast } from 'sonner';

/** Form schema: drop fields that are computed or not present in the form UI. */
const invoiceFormSchema = invoiceSchema.omit({
  id: true,
  number: true,
  customerName: true,
  subtotal: true,
  tax: true,
  total: true,
  status: true,
  quoteId: true,
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

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

  /** Field-level validation errors from Zod */
  fieldErrors: Record<string, string>;

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
  handleSaveInvoice: () => Promise<boolean>;
  resetForm: () => void;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

const defaultFormValues: InvoiceFormValues = {
  date: today(),
  customerId: '',
  items: [],
  discount: 0,
  amountPaid: 0,
  paymentMethod: 'Espèces',
  notes: '',
};

/**
 * Hook that manages invoice creation wizard form state.
 *
 * Uses React Hook Form + Zod (via `zodResolver`) for validation and
 * `useFieldArray` for line item management. Keeps `operator`, `tempItemId`,
 * `tempQty`, and `tempPrice` as local `useState` since they aren't part of
 * the `Invoice` domain model / form schema.
 */
export function useInvoiceForm(
  items: Item[],
  customers: Customer[],
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'number'>, operator: string) => void,
): UseInvoiceFormReturn {
  const {
    control,
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onBlur',
  });

  const { fields, append, update, remove: removeField } = useFieldArray({
    control,
    name: 'items',
  });

  const [tempItemId, setTempItemId] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [operator, setOperator] = useState('');

  const customerId = watch('customerId') ?? '';
  const invoiceDate = watch('date') ?? '';
  const paymentMethod = watch('paymentMethod') ?? 'Espèces';
  const amountPaid = watch('amountPaid') ?? 0;
  const discount = watch('discount') ?? 0;
  const notes = watch('notes') ?? '';

  const setCustomerId = useCallback(
    (id: string) => setValue('customerId', id, { shouldValidate: true }),
    [setValue],
  );
  const setInvoiceDate = useCallback(
    (date: string) => setValue('date', date, { shouldValidate: true }),
    [setValue],
  );
  const setPaymentMethod = useCallback(
    (method: Invoice['paymentMethod']) =>
      setValue('paymentMethod', method, { shouldValidate: true }),
    [setValue],
  );
  const setAmountPaid = useCallback(
    (val: number) =>
      setValue('amountPaid', isNaN(val) ? 0 : Math.max(0, val), {
        shouldValidate: true,
      }),
    [setValue],
  );
  const setDiscount = useCallback(
    (val: number) =>
      setValue('discount', isNaN(val) ? 0 : Math.max(0, val), {
        shouldValidate: true,
      }),
    [setValue],
  );
  const setNotes = useCallback(
    (val: string) => setValue('notes', val, { shouldValidate: true }),
    [setValue],
  );

  const lines = useMemo(
    () =>
      fields.map((f) => ({
        itemId: f.itemId,
        itemName: f.itemName,
        unit: f.unit,
        quantity: f.quantity,
        price: f.price,
        total: f.total,
      })) as LineItem[],
    [fields],
  );

  const watchedItems = watch('items') ?? [];
  const watchedDiscount = watch('discount') ?? 0;

  const totals = useMemo(
    () => computeInvoiceTotals(watchedItems, watchedDiscount, TAX_RATE),
    [watchedItems, watchedDiscount],
  );

  useEffect(() => {
    setValue('amountPaid', totals.total);
  }, [totals.total, setValue]);

  const fieldErrors = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    const fe = errors;

    if (fe.customerId?.message) map.customerId = fe.customerId.message;
    if (fe.paymentMethod?.message) map.paymentMethod = fe.paymentMethod.message;
    if (fe.amountPaid?.message) map.amountPaid = fe.amountPaid.message;
    if (fe.discount?.message) map.discount = fe.discount.message;
    if (fe.date?.message) map.date = fe.date.message;

    if (fe.items) {
      if (!Array.isArray(fe.items)) {
        if (fe.items.message) map.items = fe.items.message;
      } else {
        fe.items.forEach((itemErr: any, idx: number) => {
          if (itemErr?.quantity?.message)
            map[`items.${idx}.quantity`] = itemErr.quantity.message;
          if (itemErr?.price?.message)
            map[`items.${idx}.price`] = itemErr.price.message;
        });
      }
    }

    return map;
  }, [errors]);

  const handleTempProductChange = useCallback(
    (itemId: string) => {
      setTempItemId(itemId);
      const item = items.find((i) => i.id === itemId);
      if (item) {
        setTempPrice(item.sellingPrice);
      }
    },
    [items],
  );

  const handleAddLine = useCallback((): boolean => {
    if (!tempItemId) return false;
    const item = items.find((i) => i.id === tempItemId);
    if (!item) return false;

    if (tempQty > item.stockCount) {
      toast.error(`Stock insuffisant ! Stock disponible : ${item.stockCount} ${item.unit}s.`);
      return false;
    }

    const price = tempPrice || item.sellingPrice;

    const currentItems: LineItem[] = getValues('items') ?? [];
    const existingIdx = currentItems.findIndex(
      (l) => l.itemId === tempItemId,
    );

    if (existingIdx > -1) {
      const newQty = currentItems[existingIdx].quantity + tempQty;
      if (newQty > item.stockCount) {
        toast.error(`Stock insuffisant en cumulant ! Stock disponible : ${item.stockCount} ${item.unit}s.`);
        return false;
      }
      update(existingIdx, {
        ...currentItems[existingIdx],
        quantity: newQty,
        total: newQty * price,
      });
    } else {
      append({
        itemId: tempItemId,
        itemName: item.name,
        unit: item.unit,
        quantity: tempQty,
        price,
        total: tempQty * price,
      });
    }

    setTempItemId('');
    setTempQty(1);
    setTempPrice(0);
    return true;
  }, [tempItemId, tempQty, tempPrice, items, append, update, getValues]);

  const removeLine = useCallback(
    (index: number) => {
      removeField(index);
    },
    [removeField],
  );

  const resetForm = useCallback(() => {
    reset(defaultFormValues);
    setTempItemId('');
    setTempQty(1);
    setTempPrice(0);
    setOperator('');
  }, [reset]);

  const handleSaveInvoice = useCallback(async (): Promise<boolean> => {
    const isValid = await trigger();
    if (!isValid) return false;

    const values = getValues();
    const customerObj = customers.find((c) => c.id === values.customerId);
    if (!customerObj) return false;

    let invoiceStatus: Invoice['status'] = 'Payé';
    if (values.amountPaid === 0) {
      invoiceStatus = 'Non Payé';
    } else if (values.amountPaid < totals.total) {
      invoiceStatus = 'Partiel';
    }

    onAddInvoice(
      {
        date: values.date,
        customerId: customerObj.id,
        customerName: customerObj.name,
        items: [...lines],
        subtotal: totals.subtotal,
        discount: values.discount,
        tax: totals.tax,
        total: totals.total,
        amountPaid: values.amountPaid,
        paymentMethod: values.paymentMethod,
        status: invoiceStatus,
        notes: values.notes,
      },
      operator,
    );

    return true;
  }, [customers, lines, totals, operator, onAddInvoice, trigger, getValues]);

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
    fieldErrors,

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
