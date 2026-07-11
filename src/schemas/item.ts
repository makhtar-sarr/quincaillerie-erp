import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z.string().min(1, 'Nom de l\'article requis'),
  ref: z.string().min(1, 'Référence requise'),
  category: z.string(),
  unit: z.string().min(1, 'Unité requise'),
  minStock: z.number().min(0, 'Stock minimum doit être >= 0'),
  stockCount: z.number().min(0, 'Stock actuel doit être >= 0'),
  buyingPrice: z.number().positive('Prix d\'achat doit être > 0'),
  sellingPrice: z.number().positive('Prix de vente doit être > 0'),
  description: z.string().optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;
