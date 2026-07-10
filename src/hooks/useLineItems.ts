import { useState, useMemo, useCallback } from 'react';
import { Item, LineItem } from '../types';
import { calculateVAT } from '../utils/vat';
import { toast } from 'sonner';

interface UseLineItemsOptions {
  validateStock?: boolean;
}

export function useLineItems(items: Item[], options?: UseLineItemsOptions) {
  const validateStock = options?.validateStock ?? false;

  const [lines, setLines] = useState<LineItem[]>([]);
  const [tempItemId, setTempItemId] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');

  const handleTempProductChange = useCallback((itemId: string) => {
    setTempItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setTempPrice(item.sellingPrice);
    }
  }, [items]);

  const handleAddLine = useCallback((): boolean => {
    if (!tempItemId) return false;
    const item = items.find(i => i.id === tempItemId);
    if (!item) return false;

    if (validateStock && tempQty > item.stockCount) {
      toast.error(`Stock insuffisant ! Stock disponible : ${item.stockCount} ${item.unit}s.`);
      return false;
    }

    const price = tempPrice || item.sellingPrice;

    setLines(prev => {
      const existingIdx = prev.findIndex(l => l.itemId === tempItemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + tempQty;
        if (validateStock && newQty > item.stockCount) {
          toast.error(`Stock insuffisant en cumulant ! Stock disponible : ${item.stockCount} ${item.unit}s.`);
          return prev;
        }
        updated[existingIdx].quantity = newQty;
        updated[existingIdx].total = newQty * updated[existingIdx].price;
        return updated;
      }
      return [...prev, {
        itemId: tempItemId,
        itemName: item.name,
        unit: item.unit,
        quantity: tempQty,
        price,
        total: tempQty * price,
      }];
    });

    setTempItemId('');
    setTempQty(1);
    setTempPrice(0);
    return true;
  }, [tempItemId, tempQty, tempPrice, items, validateStock]);

  const removeLine = useCallback((index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => {
    setLines([]);
    setTempItemId('');
    setTempQty(1);
    setTempPrice(0);
    setDiscount(0);
    setOperator('');
    setNotes('');
  }, []);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((acc, line) => acc + line.total, 0);
    const taxedAmount = Math.max(0, subtotal - discount);
    const tax = calculateVAT(taxedAmount);
    const total = taxedAmount + tax;
    return { subtotal, tax, total };
  }, [lines, discount]);

  return {
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
    reset,
    totals,
  };
}
