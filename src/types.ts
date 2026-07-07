export type Category = 'Ciment & Matériaux' | 'Fer & Métaux' | 'Peinture & Finition' | 'Plomberie & Sanitaire' | 'Électricité & Éclairage' | 'Outillage & Sécurité' | 'Divers';

export interface Item {
  id: string;
  name: string;
  ref: string; // SKU code
  category: Category;
  unit: string; // e.g., 'Sac', 'Barre', 'Litre', 'Unité', 'Paquet', 'Tonne'
  minStock: number; // Minimum security stock alert limit
  stockCount: number; // Current physical stock
  buyingPrice: number; // In FCFA
  sellingPrice: number; // In FCFA
  description?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'ENTREE' | 'SORTIE';
  quantity: number;
  reason: 'Achat Fournisseur' | 'Vente Client' | 'Ajustement Inventaire' | 'Perte / Casse' | 'Retour Client';
  date: string;
  referenceCode: string; // e.g. Facture ID, Devis ID, Bon de Livraison
  operator: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  outstandingBalance: number; // FCFA
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number; // FCFA
}

export interface LineItem {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  price: number; // Selling price per unit
  total: number; // quantity * price
}

export interface Quote {
  id: string;
  number: string; // e.g., DEV-2026-001
  date: string;
  expiryDate: string;
  customerId: string;
  customerName: string;
  items: LineItem[];
  subtotal: number;
  discount: number; // in FCFA
  tax: number; // standard VAT
  total: number;
  status: 'Brouillon' | 'Envoyé' | 'Accepté' | 'Expiré';
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string; // e.g., FAC-2026-001
  date: string;
  customerId: string;
  customerName: string;
  items: LineItem[];
  subtotal: number;
  discount: number; // in FCFA
  tax: number;
  total: number;
  amountPaid: number;
  paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Virement';
  status: 'Payé' | 'Partiel' | 'Non Payé';
  notes?: string;
  quoteId?: string; // Reference to source quotation if applicable
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  ninea: string; // Numéro d'Identification Nationale des Entreprises et des Associations
  rc: string; // Registre du Commerce
  tvaRate: number; // percentage (e.g. 18 for standard Senegal VAT)
  currency: string; // 'FCFA'
}
