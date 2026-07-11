import { z } from 'zod';

export const settingsSchema = z.object({
  storeName: z.string().min(1, 'Nom du magasin requis'),
  address: z.string().min(1, 'Adresse requise'),
  phone: z.string().min(1, 'Téléphone requis'),
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  ninea: z.string().min(1, 'Ninea requis'),
  rc: z.string().min(1, 'RC requis'),
  tvaRate: z.number().min(0, 'Taux TVA doit être >= 0'),
  currency: z.literal('FCFA'),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
