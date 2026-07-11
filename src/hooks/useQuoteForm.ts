import { useState, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Item, Customer, Quote, LineItem } from '../types';
import { quoteSchema } from '../schemas/quote';
import { computeInvoiceTotals } from '../lib/calc';
import { TAX_RATE } from '../utils/vat';

const quoteFormSchema = quoteSchema.omit({
  id: true,
  number: true,
  customerName: true,
  subtotal: true,
  tax: true,
  total: true,
  status: true,
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export interface UseQuoteFormReturn {
  search: string;
  setSearch: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (f: string) => void;
  filteredQuotes: Quote[];

  customerId: string;
  setCustomerId: (id: string) => void;
  quoteDate: string;
  setQuoteDate: (date: string) => void;
  expiryDate: string;
  setExpiryDate: (date: string) => void;

  lines: LineItem[];
  tempItemId: string;
  setTempItemId: (id: string) => void;
  tempQty: number;
  setTempQty: (qty: number) => void;
  tempPrice: number;
  setTempPrice: (price: number) => void;
  discount: number;
  setDiscount: (d: number) => void;
  notes: string;
  setNotes: (n: string) => void;
  totals: { subtotal: number; tax: number; total: number };

  fieldErrors: Record<string, string>;

  handleTempProductChange: (itemId: string) => void;
  handleAddLine: () => boolean;
  removeLine: (index: number) => void;
  handleSaveQuote: (status: Quote['status']) => Promise<boolean>;
  resetForm: () => void;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}
function in30Days(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

const defaultFormValues: QuoteFormValues = {
  date: today(),
  expiryDate: in30Days(),
  customerId: '',
  items: [],
  discount: 0,
  notes: '',
};

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
  const {
    control,
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onBlur',
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  const [tempItemId, setTempItemId] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);

  const customerId = watch('customerId') ?? '';
  const quoteDate = watch('date') ?? '';
  const expiryDate = watch('expiryDate') ?? '';
  const discount = watch('discount') ?? 0;
  const notes = watch('notes') ?? '';

  const setCustomerId = useCallback(
    (id: string) => setValue('customerId', id, { shouldValidate: true }),
    [setValue],
  );
  const setQuoteDate = useCallback(
    (date: string) => setValue('date', date, { shouldValidate: true }),
    [setValue],
  );
  const setExpiryDate = useCallback(
    (date: string) => setValue('expiryDate', date, { shouldValidate: true }),
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

  const fieldErrors = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    const fe = errors;

    if (fe.customerId?.message) map.customerId = fe.customerId.message;

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

    if (fe.discount?.message) map.discount = fe.discount.message;
    if (fe.date?.message) map.date = fe.date.message;
    if (fe.expiryDate?.message) map.expiryDate = fe.expiryDate.message;

    return map;
  }, [errors]);

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

    const price = tempPrice || item.sellingPrice;

    const currentItems: LineItem[] = getValues('items') ?? [];
    const existingIdx = currentItems.findIndex(
      (l) => l.itemId === tempItemId,
    );

    if (existingIdx > -1) {
      const newQty = currentItems[existingIdx].quantity + tempQty;
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
      remove(index);
    },
    [remove],
  );

  const resetForm = useCallback(() => {
    reset(defaultFormValues);
    setTempItemId('');
    setTempQty(1);
    setTempPrice(0);
  }, [reset]);

  const handleSaveQuote = useCallback(
    async (status: Quote['status']): Promise<boolean> => {
      const isValid = await trigger();
      if (!isValid) return false;

      const values = getValues();
      const customerObj = customers.find(
        (c) => c.id === values.customerId,
      );
      if (!customerObj) return false;

      const totalResult = computeInvoiceTotals(
        values.items,
        values.discount,
        TAX_RATE,
      );

      onAddQuote({
        date: values.date,
        expiryDate: values.expiryDate,
        customerId: customerObj.id,
        customerName: customerObj.name,
        items: values.items,
        subtotal: totalResult.subtotal,
        discount: values.discount,
        tax: totalResult.tax,
        total: totalResult.total,
        status,
        notes: values.notes,
      });

      resetForm();
      return true;
    },
    [customers, onAddQuote, trigger, getValues, resetForm],
  );

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredQuotes,

    customerId,
    setCustomerId,
    quoteDate,
    setQuoteDate,
    expiryDate,
    setExpiryDate,

    lines,
    tempItemId,
    setTempItemId,
    tempQty,
    setTempQty,
    tempPrice,
    setTempPrice,
    discount,
    setDiscount,
    notes,
    setNotes,

    totals,

    fieldErrors,

    handleTempProductChange,
    handleAddLine,
    removeLine,
    handleSaveQuote,
    resetForm,
  };
}
