import { z } from 'zod';

export const invoiceSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  number: z.string().min(1, 'Numéro requis'),
  date: z.string().min(1, 'Date requise'),
  customerId: z.string().min(1, 'ID client requis'),
  customerName: z.string().min(1, 'Nom du client requis'),
  items: z.array(z.object({
    itemId: z.string().min(1, 'ID d\'article requis'),
    itemName: z.string().min(1, 'Nom d\'article requis'),
    unit: z.string().min(1, 'Unité requise'),
    quantity: z.number().positive('Quantité doit être > 0'),
    price: z.number().positive('Prix doit être > 0'),
    total: z.number().min(0, 'Total doit être >= 0'),
  })).min(1, 'Au moins un article requis'),
  subtotal: z.number().min(0, 'Sous-total doit être >= 0'),
  discount: z.number().min(0, 'Remise doit être >= 0'),
  tax: z.number().min(0, 'Taxe doit être >= 0'),
  total: z.number().min(0, 'Total doit être >= 0'),
  amountPaid: z.number().min(0, 'Montant payé doit être >= 0'),
  paymentMethod: z.enum(['Espèces', 'Wave', 'Orange Money', 'Chèque', 'Virement']),
  status: z.enum(['Payé', 'Partiel', 'Non Payé']),
  notes: z.string().optional(),
  quoteId: z.string().optional(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
