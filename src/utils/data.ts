import { Item, Customer, Supplier, Quote, Invoice, StockMovement, StoreSettings } from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Quincaillerie El Hadji Bassirou & Fils",
  address: "Avenue Cheikh Anta Diop, en face de l'Université, Dakar, Sénégal",
  phone: "+221 33 824 50 50 / +221 77 645 12 34",
  email: "contact@quincaillerie-bassirou.sn",
  ninea: "006548921-2G3",
  rc: "SN-DKR-2024-B-8542",
  tvaRate: 18,
  currency: "FCFA"
};

export const INITIAL_ITEMS: Item[] = [
  {
    id: "prod-1",
    name: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
    ref: "SOC-CPJ-42.5",
    category: "Ciment & Matériaux",
    unit: "Sac",
    minStock: 100,
    stockCount: 340,
    buyingPrice: 3800,
    sellingPrice: 4300,
    description: "Ciment haute résistance pour bétons armés et travaux courants"
  },
  {
    id: "prod-2",
    name: "Ciment DANGOTE CPJ 32.5 (Sac 50kg)",
    ref: "DAN-CPJ-32.5",
    category: "Ciment & Matériaux",
    unit: "Sac",
    minStock: 150,
    stockCount: 80, // Generates alert!
    buyingPrice: 3500,
    sellingPrice: 3950,
    description: "Idéal pour maçonnerie courante, enduits et mortiers"
  },
  {
    id: "prod-3",
    name: "Fer à béton Haute Adhérence FE500 Ø8 (Barre 12m)",
    ref: "FER-HA-08",
    category: "Fer & Métaux",
    unit: "Barre",
    minStock: 200,
    stockCount: 450,
    buyingPrice: 1600,
    sellingPrice: 1950,
    description: "Rond à béton cranté Ø8mm conforme aux normes locales de construction"
  },
  {
    id: "prod-4",
    name: "Fer à béton Haute Adhérence FE500 Ø10 (Barre 12m)",
    ref: "FER-HA-10",
    category: "Fer & Métaux",
    unit: "Barre",
    minStock: 200,
    stockCount: 180, // Generates alert!
    buyingPrice: 2450,
    sellingPrice: 2950,
    description: "Rond à béton cranté Ø10mm pour fondation et structures porteuses"
  },
  {
    id: "prod-5",
    name: "Peinture Astral Glycéro Satin Blanc (Pot 20L)",
    ref: "AST-GLY-SAT-20",
    category: "Peinture & Finition",
    unit: "Pot",
    minStock: 15,
    stockCount: 22,
    buyingPrice: 34000,
    sellingPrice: 39900,
    description: "Laque alkyde solvantée satinée, lavable et très couvrante"
  },
  {
    id: "prod-6",
    name: "Tuyau PVC Évacuation NF Ø100 (Longueur 4m)",
    ref: "PVC-EVAC-100",
    category: "Plomberie & Sanitaire",
    unit: "Unité",
    minStock: 50,
    stockCount: 110,
    buyingPrice: 3200,
    sellingPrice: 4200,
    description: "Pour canalisations d'évacuation d'eaux usées et pluviales"
  },
  {
    id: "prod-7",
    name: "Brouette Renforcée Altrad 100L",
    ref: "OUT-BROU-100",
    category: "Outillage & Sécurité",
    unit: "Unité",
    minStock: 10,
    stockCount: 8, // Generates alert!
    buyingPrice: 21000,
    sellingPrice: 26500,
    description: "Brouette de chantier de qualité supérieure, roue gonflable et châssis robuste"
  },
  {
    id: "prod-8",
    name: "Câble Électrique HO7V-U rigide 1.5mm² Rouge (100m)",
    ref: "ELEC-CAB-1.5R",
    category: "Électricité & Éclairage",
    unit: "Paquet",
    minStock: 20,
    stockCount: 45,
    buyingPrice: 11000,
    sellingPrice: 14500,
    description: "Fil de câblage pour circuits d'éclairage domestiques"
  },
  {
    id: "prod-9",
    name: "Câble Électrique HO7V-U rigide 2.5mm² Bleu (100m)",
    ref: "ELEC-CAB-2.5B",
    category: "Électricité & Éclairage",
    unit: "Paquet",
    minStock: 20,
    stockCount: 15, // Generates alert!
    buyingPrice: 17500,
    sellingPrice: 22000,
    description: "Fil de câblage pour prises de courant et appareils de cuisson"
  },
  {
    id: "prod-10",
    name: "Pinceau Plat Astral Pro Largeur 80mm",
    ref: "OUT-PIN-80",
    category: "Peinture & Finition",
    unit: "Unité",
    minStock: 30,
    stockCount: 95,
    buyingPrice: 950,
    sellingPrice: 1500,
    description: "Pinceau plat avec soies naturelles pour peintures solvantées"
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Mamadou Diop",
    phone: "+221 77 532 45 67",
    email: "diop.mamadou@gmail.com",
    address: "Ouakam Cité Avion, Dakar",
    company: "Diop BTP & Fils",
    outstandingBalance: 125000 // FCFA unpaid balance
  },
  {
    id: "cust-2",
    name: "Fatou Ndoye",
    phone: "+221 76 612 89 34",
    email: "fatou.ndoye@outlook.sn",
    address: "Parcelles Assainies Unité 12, Dakar",
    company: "Ndoye Immobilier",
    outstandingBalance: 0
  },
  {
    id: "cust-3",
    name: "Amadou Sow (Maçon)",
    phone: "+221 78 123 45 90",
    address: "Grand Yoff, Dakar",
    outstandingBalance: 45000
  },
  {
    id: "cust-4",
    name: "Abdoulaye Diallo",
    phone: "+221 77 410 99 88",
    email: "diallobat@orange.sn",
    address: "Mermoz Pyrotechnie, Dakar",
    company: "Diallo Construction",
    outstandingBalance: 0
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "supp-1",
    name: "Sococim Industries SA",
    phone: "+221 33 839 88 88",
    email: "commercial@sococim.sn",
    address: "Route de Rufisque, Rufisque",
    balance: 0
  },
  {
    id: "supp-2",
    name: "Quincaillerie Dakaroise Sandaga",
    phone: "+221 33 821 30 40",
    address: "Avenue Blaise Diagne, Dakar",
    balance: -350000 // We owe them 350,000 FCFA
  },
  {
    id: "supp-3",
    name: "Astral Sénégal",
    phone: "+221 33 832 11 22",
    email: "service-client@astral.sn",
    address: "Zone Industrielle de Hann, Dakar",
    balance: 0
  }
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: "q-1",
    number: `DEV-${new Date().getFullYear()}-001`,
    date: "2026-06-28",
    expiryDate: "2026-07-28",
    customerId: "cust-1",
    customerName: "Mamadou Diop",
    items: [
      {
        itemId: "prod-1",
        itemName: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
        unit: "Sac",
        quantity: 50,
        price: 4300,
        total: 215000
      },
      {
        itemId: "prod-3",
        itemName: "Fer à béton Haute Adhérence FE500 Ø8 (Barre 12m)",
        unit: "Barre",
        quantity: 40,
        price: 1950,
        total: 78000
      }
    ],
    subtotal: 293000,
    discount: 5000,
    tax: 51840, // 18% of 288000
    total: 339840,
    status: "Accepté",
    notes: "Prix négocié pour le chantier de Ouakam. Livraison par camion de la quincaillerie."
  },
  {
    id: "q-2",
    number: `DEV-${new Date().getFullYear()}-002`,
    date: "2026-07-02",
    expiryDate: "2026-08-02",
    customerId: "cust-3",
    customerName: "Amadou Sow (Maçon)",
    items: [
      {
        itemId: "prod-5",
        itemName: "Peinture Astral Glycéro Satin Blanc (Pot 20L)",
        unit: "Pot",
        quantity: 3,
        price: 39900,
        total: 119700
      },
      {
        itemId: "prod-10",
        itemName: "Pinceau Plat Astral Pro Largeur 80mm",
        unit: "Unité",
        quantity: 5,
        price: 1500,
        total: 7500
      }
    ],
    subtotal: 127200,
    discount: 0,
    tax: 22896,
    total: 150096,
    status: "Envoyé",
    notes: "Devis standard pour enduit et finition"
  },
  {
    id: "q-3",
    number: `DEV-${new Date().getFullYear()}-003`,
    date: "2026-07-05",
    expiryDate: "2026-08-05",
    customerId: "cust-2",
    customerName: "Fatou Ndoye",
    items: [
      {
        itemId: "prod-7",
        itemName: "Brouette Renforcée Altrad 100L",
        unit: "Unité",
        quantity: 2,
        price: 26500,
        total: 53000
      },
      {
        itemId: "prod-6",
        itemName: "Tuyau PVC Évacuation NF Ø100 (Longueur 4m)",
        unit: "Unité",
        quantity: 10,
        price: 4200,
        total: 42000
      }
    ],
    subtotal: 95000,
    discount: 2000,
    tax: 16740,
    total: 109740,
    status: "Brouillon",
    notes: "Matériel pour assainissement villa"
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "fac-1",
    number: `FAC-${new Date().getFullYear()}-001`,
    date: "2026-06-25",
    customerId: "cust-4",
    customerName: "Abdoulaye Diallo",
    items: [
      {
        itemId: "prod-1",
        itemName: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
        unit: "Sac",
        quantity: 100,
        price: 4300,
        total: 430000
      },
      {
        itemId: "prod-4",
        itemName: "Fer à béton Haute Adhérence FE500 Ø10 (Barre 12m)",
        unit: "Barre",
        quantity: 50,
        price: 2950,
        total: 147500
      }
    ],
    subtotal: 577500,
    discount: 10000,
    tax: 102150,
    total: 669650,
    amountPaid: 669650,
    paymentMethod: "Virement",
    status: "Payé",
    notes: "Virement reçu sur CBAO"
  },
  {
    id: "fac-2",
    number: `FAC-${new Date().getFullYear()}-002`,
    date: "2026-06-29",
    customerId: "cust-1",
    customerName: "Mamadou Diop",
    items: [
      {
        itemId: "prod-1",
        itemName: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
        unit: "Sac",
        quantity: 50,
        price: 4300,
        total: 215000
      },
      {
        itemId: "prod-3",
        itemName: "Fer à béton Haute Adhérence FE500 Ø8 (Barre 12m)",
        unit: "Barre",
        quantity: 40,
        price: 1950,
        total: 78000
      }
    ],
    subtotal: 293000,
    discount: 5000,
    tax: 51840,
    total: 339840,
    amountPaid: 214840, // Left 125,000 FCFA unpaid!
    paymentMethod: "Wave",
    status: "Partiel",
    notes: "Acompte payé par Wave. Solde restant de 125.000 FCFA enregistré sur le compte client."
  },
  {
    id: "fac-3",
    number: `FAC-${new Date().getFullYear()}-07-01`,
    date: "2026-07-01",
    customerId: "cust-3",
    customerName: "Amadou Sow (Maçon)",
    items: [
      {
        itemId: "prod-8",
        itemName: "Câble Électrique HO7V-U rigide 1.5mm² Rouge (100m)",
        unit: "Paquet",
        quantity: 2,
        price: 14500,
        total: 29000
      },
      {
        itemId: "prod-9",
        itemName: "Câble Électrique HO7V-U rigide 2.5mm² Bleu (100m)",
        unit: "Paquet",
        quantity: 2,
        price: 22000,
        total: 44000
      }
    ],
    subtotal: 73000,
    discount: 3000,
    tax: 12600,
    total: 82600,
    amountPaid: 82600,
    paymentMethod: "Espèces",
    status: "Payé",
    notes: "Achat direct au comptoir"
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "mov-1",
    itemId: "prod-1",
    itemName: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
    type: "ENTREE",
    quantity: 400,
    reason: "Achat Fournisseur",
    date: "2026-06-20",
    referenceCode: "BL-SOC-954",
    operator: "Abdou"
  },
  {
    id: "mov-2",
    itemId: "prod-1",
    itemName: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
    type: "SORTIE",
    quantity: 100,
    reason: "Vente Client",
    date: "2026-06-25",
    referenceCode: "FAC-2026-001",
    operator: "Abdou"
  },
  {
    id: "mov-3",
    itemId: "prod-4",
    itemName: "Fer à béton Haute Adhérence FE500 Ø10 (Barre 12m)",
    type: "SORTIE",
    quantity: 50,
    reason: "Vente Client",
    date: "2026-06-25",
    referenceCode: "FAC-2026-001",
    operator: "Abdou"
  },
  {
    id: "mov-4",
    itemId: "prod-1",
    itemName: "Ciment SOCOCIM CPJ 42.5 (Sac 50kg)",
    type: "SORTIE",
    quantity: 50,
    reason: "Vente Client",
    date: "2026-06-29",
    referenceCode: "FAC-2026-002",
    operator: "Mariama"
  },
  {
    id: "mov-5",
    itemId: "prod-3",
    itemName: "Fer à béton Haute Adhérence FE500 Ø8 (Barre 12m)",
    type: "SORTIE",
    quantity: 40,
    reason: "Vente Client",
    date: "2026-06-29",
    referenceCode: "FAC-2026-002",
    operator: "Mariama"
  },
  {
    id: "mov-6",
    itemId: "prod-8",
    itemName: "Câble Électrique HO7V-U rigide 1.5mm² Rouge (100m)",
    type: "SORTIE",
    quantity: 2,
    reason: "Vente Client",
    date: "2026-07-01",
    referenceCode: "FAC-2026-07-01",
    operator: "Abdou"
  },
  {
    id: "mov-7",
    itemId: "prod-9",
    itemName: "Câble Électrique HO7V-U rigide 2.5mm² Bleu (100m)",
    type: "SORTIE",
    quantity: 2,
    reason: "Vente Client",
    date: "2026-07-01",
    referenceCode: "FAC-2026-07-01",
    operator: "Abdou"
  },
  {
    id: "mov-8",
    itemId: "prod-2",
    itemName: "Ciment DANGOTE CPJ 32.5 (Sac 50kg)",
    type: "SORTIE",
    quantity: 5,
    reason: "Perte / Casse",
    date: "2026-07-03",
    referenceCode: "PERTE-JUL-03",
    operator: "Mariama"
  }
];

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // XOF is West African Franc (FCFA)
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA');
}
