import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z.string().min(1, 'Nom du client requis'),
  phone: z.string().min(1, 'Téléphone requis'),
  email: z.string().email('Email invalide').optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  outstandingBalance: z.number().min(0, 'Solde doit être >= 0'),
});

export type CustomerInput = z.infer<typeof customerSchema>;
