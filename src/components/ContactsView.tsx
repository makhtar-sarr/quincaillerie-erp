import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit, 
  Phone, 
  MapPin, 
  Building2, 
  Mail, 
  DollarSign, 
  X,
  CreditCard,
  PlusCircle,
  Truck,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Customer, Supplier } from '../types';
import { formatFCFA } from '../utils/data';

interface ContactsViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'outstandingBalance'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onPayCustomerDebt: (customerId: string, amount: number) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'balance'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export default function ContactsView({
  customers,
  suppliers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onPayCustomerDebt,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier
}: ContactsViewProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [isAddSuppOpen, setIsAddSuppOpen] = useState(false);
  const [isPayDebtOpen, setIsPayDebtOpen] = useState(false);
  const [selectedCustForDebt, setSelectedCustForDebt] = useState<Customer | null>(null);
  const [debtPayAmount, setDebtPayAmount] = useState(1000);

  // Edit states
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [editingSupp, setEditingSupp] = useState<Supplier | null>(null);

  // Forms states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCompany, setCustCompany] = useState('');

  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppAddress, setSuppAddress] = useState('');

  // Filter lists
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || 
             c.phone.toLowerCase().includes(s) || 
             (c.company && c.company.toLowerCase().includes(s));
    });
  }, [customers, search]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const searchStr = search.toLowerCase();
      return s.name.toLowerCase().includes(searchStr) || 
             s.phone.toLowerCase().includes(searchStr);
    });
  }, [suppliers, search]);

  const handleAddCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) {
      alert("Veuillez renseigner le nom et le téléphone.");
      return;
    }
    onAddCustomer({
      name: custName,
      phone: custPhone,
      email: custEmail || undefined,
      address: custAddress || undefined,
      company: custCompany || undefined
    });
    // reset
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
    setCustCompany('');
    setIsAddCustOpen(false);
  };

  const handleAddSuppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName || !suppPhone) {
      alert("Veuillez renseigner le nom et le téléphone du fournisseur.");
      return;
    }
    onAddSupplier({
      name: suppName,
      phone: suppPhone,
      email: suppEmail || undefined,
      address: suppAddress || undefined
    });
    setSuppName('');
    setSuppPhone('');
    setSuppEmail('');
    setSuppAddress('');
    setIsAddSuppOpen(false);
  };

  const handleDebtPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForDebt) return;
    onPayCustomerDebt(selectedCustForDebt.id, Number(debtPayAmount));
    setIsPayDebtOpen(false);
    setSelectedCustForDebt(null);
  };

  const handleOpenPayDebt = (cust: Customer) => {
    setSelectedCustForDebt(cust);
    setDebtPayAmount(cust.outstandingBalance); // prefill with full balance
    setIsPayDebtOpen(true);
  };

  return (
    <div id="contacts-view-root" className="space-y-6">
      {/* Header and top tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black font-display text-slate-900 uppercase tracking-wide">Annuaires Tiers</h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Gérez vos clients fidèles, entrepreneurs locaux, conducteurs de travaux et vos fournisseurs grossistes</p>
        </div>
        <div className="flex bg-slate-100/85 p-1 rounded-2xl mt-4 sm:mt-0 self-start sm:self-center text-xs border border-slate-200">
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer ${activeTab === 'customers' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Users className="h-4 w-4 stroke-[2.5]" />
            <span>Clients ({customers.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('suppliers'); setSearch(''); }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer ${activeTab === 'suppliers' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Truck className="h-4 w-4 stroke-[2.5]" />
            <span>Fournisseurs ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Search & quick addition bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 stroke-[2.5]" />
          <input
            type="text"
            placeholder={activeTab === 'customers' ? 'Rechercher nom client, téléphone, entreprise...' : 'Rechercher fournisseur par nom ou téléphone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>
        {activeTab === 'customers' ? (
          <button
            onClick={() => setIsAddCustOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-3 rounded-2xl text-xs font-black flex items-center space-x-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0 font-display uppercase tracking-wider"
          >
            <UserPlus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Nouveau Client</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAddSuppOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center space-x-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0 font-display uppercase tracking-wider"
          >
            <UserPlus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>Nouveau Fournisseur</span>
          </button>
        )}
      </div>

      {/* Main Directory List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeTab === 'customers' ? (
          filteredCustomers.map((cust) => (
            <div key={cust.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] duration-300 flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm font-display tracking-tight leading-snug">{cust.name}</h3>
                    {cust.company && (
                      <span className="text-[9px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-black uppercase tracking-wider mt-1.5 inline-flex items-center border border-amber-200/50">
                        <Building2 className="h-3 w-3 mr-1 text-amber-600 stroke-[2.5]" />
                        {cust.company}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <button
                      onClick={() => setEditingCust(cust)}
                      className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la fiche client de ${cust.name} ?`)) {
                          onDeleteCustomer(cust.id);
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-slate-500 pt-3 border-t-2 border-slate-50 font-semibold">
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-slate-400 shrink-0" /> {cust.phone}</p>
                  {cust.email && <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-slate-400 shrink-0" /> {cust.email}</p>}
                  {cust.address && <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0" /> {cust.address}</p>}
                </div>
              </div>

              {/* Outstanding debt display and quick repayment */}
              <div className="border-t-2 border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider font-mono">Créances Crédit (Dû)</span>
                  <span className={`font-black font-mono text-sm block mt-0.5 ${cust.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatFCFA(cust.outstandingBalance)}
                  </span>
                </div>
                {cust.outstandingBalance > 0 && (
                  <button
                    onClick={() => handleOpenPayDebt(cust)}
                    className="bg-emerald-550 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider px-3 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
                  >
                    <CreditCard className="h-4 w-4 stroke-[2.5]" />
                    <span>Encaisser</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          filteredSuppliers.map((supp) => (
            <div key={supp.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-xs hover:shadow-md transition-all hover:scale-[1.01] duration-300 flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-black text-slate-900 text-sm font-display tracking-tight leading-snug">{supp.name}</h3>
                  <div className="flex space-x-1 shrink-0">
                    <button
                      onClick={() => setEditingSupp(supp)}
                      className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le fournisseur ${supp.name} ?`)) {
                          onDeleteSupplier(supp.id);
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-slate-500 pt-3 border-t-2 border-slate-50 font-semibold">
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-slate-400 shrink-0" /> {supp.phone}</p>
                  {supp.email && <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-slate-400 shrink-0" /> {supp.email}</p>}
                  {supp.address && <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0" /> {supp.address}</p>}
                </div>
              </div>

              <div className="border-t-2 border-slate-100 pt-4">
                <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider font-mono">Balance Achats (Notre dette)</span>
                <span className={`font-black font-mono text-sm block mt-0.5 ${supp.balance < 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {formatFCFA(Math.abs(supp.balance))} {supp.balance < 0 ? 'à leur régler' : ''}
                </span>
              </div>
            </div>
          ))
        )}
        {((activeTab === 'customers' && filteredCustomers.length === 0) || 
          (activeTab === 'suppliers' && filteredSuppliers.length === 0)) && (
          <div className="col-span-full py-16 text-center text-slate-400 italic font-mono bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            Aucun tiers correspondant à la recherche.
          </div>
        )}
      </div>

      {/* MODAL 1: ADD CUSTOMER */}
      <AnimatePresence>
        {isAddCustOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-slate-100 max-w-md w-full overflow-hidden text-xs"
            >
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-6 py-5 border-b-2 border-amber-500 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 stroke-[2.5]" />
                  <h3 className="font-black font-display uppercase tracking-wider">Nouveau Client</h3>
                </div>
                <button onClick={() => setIsAddCustOpen(false)} className="text-slate-950 hover:text-white cursor-pointer transition-colors p-1">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleAddCustSubmit} className="p-6 space-y-4 bg-slate-50/30">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Prénom & Nom du Client *</label>
                  <input
                    type="text"
                    placeholder="e.g. El Hadji Malick Sall"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Téléphone *</label>
                    <input
                      type="text"
                      placeholder="e.g. +221 77 600 00 00"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email (Optionnel)</label>
                    <input
                      type="email"
                      placeholder="e.g. sarr@gmail.com"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Société / Chantier BTP</label>
                  <input
                    type="text"
                    placeholder="e.g. Horizon Construction S.U.A.R.L."
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Adresse (Dakar / Quartier)</label>
                  <input
                    type="text"
                    placeholder="e.g. Liberté 6 Extension, Dakar"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="border-t-2 border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCustOpen(false)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Enregistrer Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD SUPPLIER */}
      <AnimatePresence>
        {isAddSuppOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-slate-100 max-w-md w-full overflow-hidden text-xs"
            >
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-2 border-slate-800">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 stroke-[2.5]" />
                  <h3 className="font-black font-display uppercase tracking-wider">Nouveau Fournisseur</h3>
                </div>
                <button onClick={() => setIsAddSuppOpen(false)} className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleAddSuppSubmit} className="p-6 space-y-4 bg-slate-50/30">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Raison Sociale / Nom *</label>
                  <input
                    type="text"
                    placeholder="e.g. Peintures Astral Sénégal SA"
                    value={suppName}
                    onChange={(e) => setSuppName(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Téléphone *</label>
                    <input
                      type="text"
                      placeholder="e.g. +221 33 800 00 00"
                      value={suppPhone}
                      onChange={(e) => setSuppPhone(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. contact@astral.sn"
                      value={suppEmail}
                      onChange={(e) => setSuppEmail(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Adresse (Usine / Dépôt)</label>
                  <input
                    type="text"
                    placeholder="e.g. Zone Industrielle de Dakar-Yarakh"
                    value={suppAddress}
                    onChange={(e) => setSuppAddress(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="border-t-2 border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSuppOpen(false)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Enregistrer Fournisseur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REPAY CLIENT OUTSTANDING CREDIT DEBT */}
      <AnimatePresence>
        {isPayDebtOpen && selectedCustForDebt && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-slate-100 max-w-sm w-full overflow-hidden text-xs"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 flex items-center justify-between border-b-2 border-emerald-600">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4.5 w-4.5 stroke-[2.5]" />
                  <h3 className="font-black font-display uppercase tracking-wider text-xs">Recouvrement de Crédit</h3>
                </div>
                <button onClick={() => { setIsPayDebtOpen(false); setSelectedCustForDebt(null); }} className="text-white hover:text-slate-100 cursor-pointer transition-colors p-1">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleDebtPaySubmit} className="p-6 space-y-4 bg-slate-50/30">
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 space-y-1.5">
                  <span className="text-[9px] text-slate-400 block font-black uppercase tracking-wider font-mono">Fiche Client Dossier</span>
                  <span className="font-black text-slate-900 text-xs block">{selectedCustForDebt.name}</span>
                  <div className="border-t-2 border-slate-50 pt-2 mt-2">
                    <span className="text-rose-600 font-black block text-sm font-mono">
                      Solde Dû Actuel: {formatFCFA(selectedCustForDebt.outstandingBalance)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Montant Versement Comptant (FCFA) *</label>
                  <input
                    type="number"
                    max={selectedCustForDebt.outstandingBalance}
                    min="1"
                    value={debtPayAmount}
                    onChange={(e) => setDebtPayAmount(Math.max(1, Math.min(selectedCustForDebt.outstandingBalance, Number(e.target.value))))}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-base font-black text-emerald-600 bg-white"
                    required
                  />
                  <div className="text-[10px] text-slate-400 mt-2 font-semibold">
                    Nouveau solde crédit client après paiement : <b className="text-slate-700">{formatFCFA(selectedCustForDebt.outstandingBalance - debtPayAmount)}</b>
                  </div>
                </div>

                <div className="border-t-2 border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => { setIsPayDebtOpen(false); setSelectedCustForDebt(null); }}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Confirmer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDITING CLIENT MODAL */}
      <AnimatePresence>
        {editingCust && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-slate-100 max-w-md w-full overflow-hidden text-xs"
            >
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-2 border-slate-800">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 stroke-[2.5]" />
                  <h3 className="font-black font-display uppercase tracking-wider">Modifier fiche client</h3>
                </div>
                <button onClick={() => setEditingCust(null)} className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (editingCust) onUpdateCustomer(editingCust); setEditingCust(null); }} className="p-6 space-y-4 bg-slate-50/30">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Nom Complet *</label>
                  <input
                    type="text"
                    value={editingCust.name}
                    onChange={(e) => setEditingCust({ ...editingCust, name: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Téléphone *</label>
                    <input
                      type="text"
                      value={editingCust.phone}
                      onChange={(e) => setEditingCust({ ...editingCust, phone: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={editingCust.email || ''}
                      onChange={(e) => setEditingCust({ ...editingCust, email: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Société / Chantier</label>
                  <input
                    type="text"
                    value={editingCust.company || ''}
                    onChange={(e) => setEditingCust({ ...editingCust, company: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Adresse</label>
                  <input
                    type="text"
                    value={editingCust.address || ''}
                    onChange={(e) => setEditingCust({ ...editingCust, address: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="border-t-2 border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingCust(null)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDITING SUPPLIER MODAL */}
      <AnimatePresence>
        {editingSupp && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] border-2 border-slate-100 max-w-md w-full overflow-hidden text-xs"
            >
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-2 border-slate-800">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 stroke-[2.5]" />
                  <h3 className="font-black font-display uppercase tracking-wider">Modifier fournisseur</h3>
                </div>
                <button onClick={() => setEditingSupp(null)} className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1">
                  <X className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (editingSupp) onUpdateSupplier(editingSupp); setEditingSupp(null); }} className="p-6 space-y-4 bg-slate-50/30">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Raison Sociale / Nom *</label>
                  <input
                    type="text"
                    value={editingSupp.name}
                    onChange={(e) => setEditingSupp({ ...editingSupp, name: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Téléphone *</label>
                    <input
                      type="text"
                      value={editingSupp.phone}
                      onChange={(e) => setEditingSupp({ ...editingSupp, phone: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={editingSupp.email || ''}
                      onChange={(e) => setEditingSupp({ ...editingSupp, email: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Adresse Usine / Bureau</label>
                  <input
                    type="text"
                    value={editingSupp.address || ''}
                    onChange={(e) => setEditingSupp({ ...editingSupp, address: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="border-t-2 border-slate-100 pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingSupp(null)}
                    className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
