import { z } from 'zod';

export const quoteSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  number: z.string().min(1, 'Numéro requis'),
  date: z.string().min(1, 'Date requise'),
  expiryDate: z.string().min(1, 'Date d\'expiration requise'),
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
  status: z.enum(['Brouillon', 'Envoyé', 'Accepté', 'Expiré']),
  notes: z.string().optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
