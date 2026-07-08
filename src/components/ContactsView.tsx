import React, { useState, useMemo } from 'react';
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
  CreditCard,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { Customer, Supplier } from '../types';
import { formatFCFA } from '../utils/data';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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

  // Delete confirmation state
  const [deletingContact, setDeletingContact] = useState<{ id: string; name: string; type: 'customer' | 'supplier' } | null>(null);

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

  const handleConfirmDelete = () => {
    if (!deletingContact) return;
    if (deletingContact.type === 'customer') {
      onDeleteCustomer(deletingContact.id);
    } else {
      onDeleteSupplier(deletingContact.id);
    }
    setDeletingContact(null);
  };

  return (
    <div id="contacts-view-root" className="space-y-6">
      {/* Header and top tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-border pb-5">
        <div>
          <h2 className="text-xl font-black font-display text-foreground uppercase tracking-wide">Annuaires Tiers</h2>
          <p className="text-xs text-muted mt-1 font-semibold">Gérez vos clients fidèles, entrepreneurs locaux, conducteurs de travaux et vos fournisseurs grossistes</p>
        </div>
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl mt-4 sm:mt-0 self-start sm:self-center text-xs border border-border">
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer ${activeTab === 'customers' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'}`}
          >
            <Users className="h-4 w-4 stroke-[2.5]" />
            <span>Clients ({customers.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('suppliers'); setSearch(''); }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer ${activeTab === 'suppliers' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'}`}
          >
            <Truck className="h-4 w-4 stroke-[2.5]" />
            <span>Fournisseurs ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Search & quick addition bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-5 rounded-[2rem] border-2 border-border shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted stroke-[2.5]" />
          <input
            type="text"
            placeholder={activeTab === 'customers' ? 'Rechercher nom client, téléphone, entreprise...' : 'Rechercher fournisseur par nom ou téléphone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 w-full border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-hidden bg-neutral-50"
          />
        </div>
        {activeTab === 'customers' ? (
          <Button
            variant="primary"
            onClick={() => setIsAddCustOpen(true)}
            className="flex items-center space-x-2 shrink-0 font-display uppercase tracking-wider"
          >
            <UserPlus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Nouveau Client</span>
          </Button>
        ) : (
          <Button
            variant="dark"
            onClick={() => setIsAddSuppOpen(true)}
            className="flex items-center space-x-2 shrink-0 font-display uppercase tracking-wider"
          >
            <UserPlus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>Nouveau Fournisseur</span>
          </Button>
        )}
      </div>

      {/* Main Directory List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeTab === 'customers' ? (
          filteredCustomers.map((cust) => (
            <div key={cust.id} className="bg-surface p-6 rounded-[2rem] border-2 border-border shadow-xs hover:shadow-md transition-all hover:scale-[1.01] duration-300 flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-foreground text-sm font-display tracking-tight leading-snug">{cust.name}</h3>
                    {cust.company && (
                      <span className="text-[9px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-black uppercase tracking-wider mt-1.5 inline-flex items-center border border-amber-200/50 dark:border-amber-800/50">
                        <Building2 className="h-3 w-3 mr-1 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                        {cust.company}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <Button
                      variant="icon"
                      onClick={() => setEditingCust(cust)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="icon"
                      onClick={() => setDeletingContact({ id: cust.id, name: cust.name, type: 'customer' })}
                      className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-muted pt-3 border-t-2 border-neutral-50 dark:border-neutral-700 font-semibold">
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted shrink-0" /> {cust.phone}</p>
                  {cust.email && <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted shrink-0" /> {cust.email}</p>}
                  {cust.address && <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted shrink-0" /> {cust.address}</p>}
                </div>
              </div>

              {/* Outstanding debt display and quick repayment */}
              <div className="border-t-2 border-border pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-muted font-black block uppercase tracking-wider font-mono">Créances Crédit (Dû)</span>
                  <span className={`font-black font-mono text-sm block mt-0.5 ${cust.outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatFCFA(cust.outstandingBalance)}
                  </span>
                </div>
                {cust.outstandingBalance > 0 && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleOpenPayDebt(cust)}
                    className="font-black text-[9px] uppercase tracking-wider flex items-center space-x-1.5 shadow-sm"
                  >
                    <CreditCard className="h-4 w-4 stroke-[2.5]" />
                    <span>Encaisser</span>
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          filteredSuppliers.map((supp) => (
            <div key={supp.id} className="bg-surface p-6 rounded-[2rem] border-2 border-border shadow-xs hover:shadow-md transition-all hover:scale-[1.01] duration-300 flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-black text-foreground text-sm font-display tracking-tight leading-snug">{supp.name}</h3>
                  <div className="flex space-x-1 shrink-0">
                    <Button
                      variant="icon"
                      onClick={() => setEditingSupp(supp)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="icon"
                      onClick={() => setDeletingContact({ id: supp.id, name: supp.name, type: 'supplier' })}
                      className="hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-muted pt-3 border-t-2 border-neutral-50 dark:border-neutral-700 font-semibold">
                  <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted shrink-0" /> {supp.phone}</p>
                  {supp.email && <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted shrink-0" /> {supp.email}</p>}
                  {supp.address && <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted shrink-0" /> {supp.address}</p>}
                </div>
              </div>

              <div className="border-t-2 border-border pt-4">
                <span className="text-[9px] text-muted font-black block uppercase tracking-wider font-mono">Balance Achats (Notre dette)</span>
                <span className={`font-black font-mono text-sm block mt-0.5 ${supp.balance < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                  {formatFCFA(Math.abs(supp.balance))} {supp.balance < 0 ? 'à leur régler' : ''}
                </span>
              </div>
            </div>
          ))
        )}
        {((activeTab === 'customers' && filteredCustomers.length === 0) || 
          (activeTab === 'suppliers' && filteredSuppliers.length === 0)) && (
          <div className="col-span-full py-16 text-center text-muted italic font-mono bg-surface rounded-[2rem] border-2 border-dashed border-border">
            Aucun tiers correspondant à la recherche.
          </div>
        )}
      </div>

      {/* MODAL: ADD CUSTOMER */}
      <Modal
        isOpen={isAddCustOpen}
        onClose={() => setIsAddCustOpen(false)}
        title="Nouveau Client"
        icon={UserPlus}
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={() => setIsAddCustOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="add-cust-form">
              Enregistrer Client
            </Button>
          </div>
        }
      >
        <form id="add-cust-form" onSubmit={handleAddCustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted font-bold mb-1">Prénom & Nom du Client *</label>
            <input
              type="text"
              placeholder="e.g. El Hadji Malick Sall"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Téléphone *</label>
              <input
                type="text"
                placeholder="e.g. +221 77 600 00 00"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Email (Optionnel)</label>
              <input
                type="email"
                placeholder="e.g. sarr@gmail.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted font-bold mb-1">Société / Chantier BTP</label>
            <input
              type="text"
              placeholder="e.g. Horizon Construction S.U.A.R.L."
              value={custCompany}
              onChange={(e) => setCustCompany(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-muted font-bold mb-1">Adresse (Dakar / Quartier)</label>
            <input
              type="text"
              placeholder="e.g. Liberté 6 Extension, Dakar"
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD SUPPLIER */}
      <Modal
        isOpen={isAddSuppOpen}
        onClose={() => setIsAddSuppOpen(false)}
        title="Nouveau Fournisseur"
        icon={UserPlus}
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={() => setIsAddSuppOpen(false)}>
              Annuler
            </Button>
            <Button variant="dark" type="submit" form="add-supp-form">
              Enregistrer Fournisseur
            </Button>
          </div>
        }
      >
        <form id="add-supp-form" onSubmit={handleAddSuppSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted font-bold mb-1">Raison Sociale / Nom *</label>
            <input
              type="text"
              placeholder="e.g. Peintures Astral Sénégal SA"
              value={suppName}
              onChange={(e) => setSuppName(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-muted font-bold mb-1">Téléphone *</label>
              <input
                type="text"
                placeholder="e.g. +221 33 800 00 00"
                value={suppPhone}
                onChange={(e) => setSuppPhone(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-muted font-bold mb-1">Email</label>
              <input
                type="email"
                placeholder="e.g. contact@astral.sn"
                value={suppEmail}
                onChange={(e) => setSuppEmail(e.target.value)}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted font-bold mb-1">Adresse (Usine / Dépôt)</label>
            <input
              type="text"
              placeholder="e.g. Zone Industrielle de Dakar-Yarakh"
              value={suppAddress}
              onChange={(e) => setSuppAddress(e.target.value)}
              className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: REPAY CLIENT OUTSTANDING CREDIT DEBT */}
      <Modal
        isOpen={isPayDebtOpen && !!selectedCustForDebt}
        onClose={() => { setIsPayDebtOpen(false); setSelectedCustForDebt(null); }}
        title="Recouvrement de Crédit"
        icon={CreditCard}
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={() => { setIsPayDebtOpen(false); setSelectedCustForDebt(null); }}>
              Annuler
            </Button>
            <Button variant="success" type="submit" form="pay-debt-form">
              Confirmer
            </Button>
          </div>
        }
      >
        {selectedCustForDebt && (
          <form id="pay-debt-form" onSubmit={handleDebtPaySubmit} className="space-y-4 text-xs">
            <div className="bg-surface p-4 rounded-2xl border-2 border-border space-y-1.5">
              <span className="text-[9px] text-muted block font-black uppercase tracking-wider font-mono">Fiche Client Dossier</span>
              <span className="font-black text-foreground text-xs block">{selectedCustForDebt.name}</span>
              <div className="border-t-2 border-neutral-50 pt-2 mt-2">
                <span className="text-rose-600 dark:text-rose-400 font-black block text-sm font-mono">
                  Solde Dû Actuel: {formatFCFA(selectedCustForDebt.outstandingBalance)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-muted font-bold mb-1">Montant Versement Comptant (FCFA) *</label>
              <input
                type="number"
                max={selectedCustForDebt.outstandingBalance}
                min="1"
                value={debtPayAmount}
                onChange={(e) => setDebtPayAmount(Math.max(1, Math.min(selectedCustForDebt.outstandingBalance, Number(e.target.value))))}
                className="w-full border border-border p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-primary focus:outline-hidden text-base font-black text-emerald-600 bg-surface"
                required
              />
              <div className="text-[10px] text-muted mt-2 font-semibold">
                Nouveau solde crédit client après paiement : <b className="text-foreground">{formatFCFA(selectedCustForDebt.outstandingBalance - debtPayAmount)}</b>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: EDIT CUSTOMER */}
      <Modal
        isOpen={!!editingCust}
        onClose={() => setEditingCust(null)}
        title="Modifier fiche client"
        icon={Edit}
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={() => setEditingCust(null)}>
              Annuler
            </Button>
            <Button variant="dark" type="submit" form="edit-cust-form">
              Sauvegarder
            </Button>
          </div>
        }
      >
        {editingCust && (
          <form id="edit-cust-form" onSubmit={(e) => { e.preventDefault(); if (editingCust) onUpdateCustomer(editingCust); setEditingCust(null); }} className="space-y-4 text-xs">
            <div>
              <label className="block text-muted font-bold mb-1">Nom Complet *</label>
              <input
                type="text"
                value={editingCust.name}
                onChange={(e) => setEditingCust({ ...editingCust, name: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-muted font-bold mb-1">Téléphone *</label>
                <input
                  type="text"
                  value={editingCust.phone}
                  onChange={(e) => setEditingCust({ ...editingCust, phone: e.target.value })}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block text-muted font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={editingCust.email || ''}
                  onChange={(e) => setEditingCust({ ...editingCust, email: e.target.value })}
                  className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted font-bold mb-1">Société / Chantier</label>
              <input
                type="text"
                value={editingCust.company || ''}
                onChange={(e) => setEditingCust({ ...editingCust, company: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-muted font-bold mb-1">Adresse</label>
              <input
                type="text"
                value={editingCust.address || ''}
                onChange={(e) => setEditingCust({ ...editingCust, address: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: EDIT SUPPLIER */}
      <Modal
        isOpen={!!editingSupp}
        onClose={() => setEditingSupp(null)}
        title="Modifier fournisseur"
        icon={Edit}
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={() => setEditingSupp(null)}>
              Annuler
            </Button>
            <Button variant="dark" type="submit" form="edit-supp-form">
              Sauvegarder
            </Button>
          </div>
        }
      >
        {editingSupp && (
          <form id="edit-supp-form" onSubmit={(e) => { e.preventDefault(); if (editingSupp) onUpdateSupplier(editingSupp); setEditingSupp(null); }} className="space-y-4 text-xs">
            <div>
              <label className="block text-muted font-bold mb-1">Raison Sociale / Nom *</label>
              <input
                type="text"
                value={editingSupp.name}
                onChange={(e) => setEditingSupp({ ...editingSupp, name: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-muted font-bold mb-1">Téléphone *</label>
                <input
                  type="text"
                  value={editingSupp.phone}
                  onChange={(e) => setEditingSupp({ ...editingSupp, phone: e.target.value })}
                  className="w-full border border-border p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block text-muted font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={editingSupp.email || ''}
                  onChange={(e) => setEditingSupp({ ...editingSupp, email: e.target.value })}
                  className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted font-bold mb-1">Adresse Usine / Bureau</label>
              <input
                type="text"
                value={editingSupp.address || ''}
                onChange={(e) => setEditingSupp({ ...editingSupp, address: e.target.value })}
                className="w-full border border-border p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: DELETE CONFIRMATION */}
      <Modal
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        title="Confirmer la suppression"
        icon={AlertTriangle}
        size="sm"
        variant="danger"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" type="button" onClick={() => setDeletingContact(null)}>
              Annuler
            </Button>
            <Button variant="danger" type="button" onClick={handleConfirmDelete}>
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          {deletingContact?.type === 'customer'
            ? `Supprimer la fiche client de ${deletingContact?.name} ? Cette action est irréversible.`
            : `Supprimer le fournisseur ${deletingContact?.name} ? Cette action est irréversible.`
          }
        </p>
      </Modal>
    </div>
  );
}
