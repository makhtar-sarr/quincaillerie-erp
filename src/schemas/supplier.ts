import { z } from 'zod';

export const supplierSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z.string().min(1, 'Nom du fournisseur requis'),
  phone: z.string().min(1, 'Téléphone requis'),
  email: z.string().email('Email invalide').optional(),
  address: z.string().optional(),
  balance: z.number().min(0, 'Solde doit être >= 0'),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
