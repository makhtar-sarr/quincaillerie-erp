import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Percent, 
  Save, 
  CheckCircle,
  FileText,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Trash2,
  Calendar,
  User,
  AlertTriangle,
  Loader2,
  Database,
  Info
} from 'lucide-react';
import { StoreSettings, Item, StockMovement, Customer, Supplier, Quote, Invoice } from '../types';
import { isFirebaseAvailable } from '../lib/firebase';
import { formatFCFA } from '../utils/data';
import { useCloudBackups } from '../hooks/useCloudBackups';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  items: Item[];
  movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  quotes: Quote[];
  invoices: Invoice[];
  onRestoreAllData: (data: {
    settings: StoreSettings;
    items: Item[];
    movements: StockMovement[];
    customers: Customer[];
    suppliers: Supplier[];
    quotes: Quote[];
    invoices: Invoice[];
  }) => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  items,
  movements,
  customers,
  suppliers,
  quotes,
  invoices,
  onRestoreAllData
}: SettingsViewProps) {
  // Store Settings Form state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [ninea, setNinea] = useState(settings.ninea);
  const [rc, setRc] = useState(settings.rc);
  const [tvaRate, setTvaRate] = useState(settings.tvaRate);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      storeName,
      address,
      phone,
      email,
      ninea,
      rc,
      tvaRate: Number(tvaRate),
      currency: settings.currency
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const { backups, isBackingUp, isFetching, cloudStatusMsg, backupLabel, backupOperator, setBackupLabel, setBackupOperator, handleCreateBackup, handleRestoreBackup, handleDeleteBackup, loadBackupsList } = useCloudBackups({
    settings,
    items,
    movements,
    customers,
    suppliers,
    quotes,
    invoices
  }, onRestoreAllData);

  return (
    <div id="settings-view-root" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title section */}
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black font-display text-slate-900 flex items-center space-x-2 uppercase tracking-wide">
            <Settings className="h-6 w-6 text-slate-700" />
            <span>Paramètres Système</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Configurez votre quincaillerie sénégalaise, gérez les impressions et sécurisez vos données sur le Cloud</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-start">
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 ${
            isFirebaseAvailable 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            <span className={`h-2 w-2 rounded-full mr-1 ${isFirebaseAvailable ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
            {isFirebaseAvailable ? 'Cloud Connecté' : 'Stockage Local Uniquement'}
          </span>
        </div>
      </div>

      {/* Main Container Layout (Form Left, Cloud Backup Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Local settings form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xs p-6 space-y-6 text-xs">
            {saved && (
              <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl border border-emerald-100 flex items-center space-x-2 font-bold">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>Paramètres de l'entreprise mis à jour localement !</span>
              </div>
            )}

            {/* Section 1: Identity */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 border-b-2 border-slate-50 pb-2 text-xs uppercase tracking-wide flex items-center">
                <Building2 className="h-4.5 w-4.5 mr-2 text-amber-500 stroke-[2.5]" />
                En-tête Commercial (Documents)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Raison Sociale / Nom Enseigne *</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Téléphone(s) *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Adresse Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Adresse Physique (Dakar, Sénégal) *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Fiscal & Registry info */}
            <div className="space-y-4 pt-4 border-t-2 border-slate-50">
              <h3 className="font-black text-slate-900 border-b-2 border-slate-50 pb-2 text-xs uppercase tracking-wide flex items-center">
                <FileText className="h-4.5 w-4.5 mr-2 text-amber-500 stroke-[2.5]" />
                Enregistrements Fiscaux (Sénégal)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">N° NINEA *</label>
                  <input
                    type="text"
                    placeholder="e.g. 001234567-2G3"
                    value={ninea}
                    onChange={(e) => setNinea(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">N° Registre Commerce *</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-DKR-24-B-854"
                    value={rc}
                    onChange={(e) => setRc(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">TVA (%) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tvaRate}
                      onChange={(e) => setTvaRate(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 pr-8 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                    <Percent className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Form action submission */}
            <div className="border-t-2 border-slate-50 pt-5 flex justify-end">
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.01] text-xs"
              >
                <Save className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>Enregistrer</span>
              </button>
            </div>
          </form>

          {/* Local storage info card */}
          <div className="bg-slate-100/50 rounded-[2rem] border-2 border-slate-200/50 p-5 text-xs text-slate-500 space-y-2.5 font-medium leading-relaxed">
            <h4 className="font-black text-slate-800 uppercase tracking-wide flex items-center">
              <Info className="h-4.5 w-4.5 mr-1.5 text-blue-500 stroke-[2.5]" />
              Fonctionnement Offline & Stockage Local
            </h4>
            <p>
              Toutes vos données de ventes, clients, de stock et de devis sont stockées <b>localement sur cet appareil</b> dans la mémoire de votre navigateur (LocalStorage). L'application fonctionne sans connexion internet.
            </p>
            <p>
              Pour éviter toute perte en cas de panne, de changement d'ordinateur ou de suppression d'historique, utilisez l'<b>option de sauvegarde cloud</b> ci-contre pour archiver vos données de manière sécurisée.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Cloud backup center */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main cloud operations block */}
          <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xs p-6 space-y-6 text-xs">
            <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center">
                <Cloud className="h-5 w-5 mr-2 text-indigo-500 stroke-[2.5]" />
                Sauvegarde Cloud (Firebase)
              </h3>
              <Database className="h-4.5 w-4.5 text-slate-400 stroke-[2.5]" />
            </div>

            {/* Cloud Status Messages */}
            <AnimatePresence mode="wait">
              {cloudStatusMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-xl border font-semibold flex items-start space-x-2 ${
                    cloudStatusMsg.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-rose-50 text-rose-800 border-rose-100'
                  }`}
                >
                  <AlertTriangle className={`h-4.5 w-4.5 shrink-0 ${cloudStatusMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
                  <span className="text-[11px]">{cloudStatusMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Local dataset summary to show what will be backed up */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <span className="font-black text-slate-400 text-[10px] uppercase tracking-wider block">Volume des données locales actuelles :</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-bold text-slate-700">
                <div className="flex justify-between"><span>Articles en Stock:</span> <span className="font-mono font-black text-slate-900">{items.length}</span></div>
                <div className="flex justify-between"><span>Clients enregistrés:</span> <span className="font-mono font-black text-slate-900">{customers.length}</span></div>
                <div className="flex justify-between"><span>Factures & Ventes:</span> <span className="font-mono font-black text-slate-900">{invoices.length}</span></div>
                <div className="flex justify-between"><span>Devis émis:</span> <span className="font-mono font-black text-slate-900">{quotes.length}</span></div>
              </div>
            </div>

            {/* Trigger a new backup */}
            <form onSubmit={handleCreateBackup} className="space-y-4 pt-2">
              <span className="font-black text-slate-800 block text-xs uppercase tracking-wider">Créer un nouveau Point de Restauration</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Opérateur *</label>
                  <input
                    type="text"
                    value={backupOperator}
                    onChange={(e) => setBackupOperator(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold bg-slate-50/50"
                    placeholder="Votre nom"
                    required
                    disabled={!isFirebaseAvailable}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Description / Label *</label>
                  <input
                    type="text"
                    value={backupLabel}
                    onChange={(e) => setBackupLabel(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl font-bold bg-slate-50/50"
                    placeholder="e.g. Avant inventaire Juillet"
                    required
                    disabled={!isFirebaseAvailable}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBackingUp || !isFirebaseAvailable}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-[1.01] uppercase tracking-wider text-[11px]"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin stroke-[2.5]" />
                    <span>Sauvegarde en cours...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Exporter vers le Cloud</span>
                  </>
                )}
              </button>
            </form>

            {/* Cloud Snapshots History */}
            <div className="space-y-3 pt-4 border-t-2 border-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-800 block text-xs uppercase tracking-wider">Historique des Sauvegardes Cloud</span>
                <button
                  type="button"
                  onClick={loadBackupsList}
                  disabled={isFetching || !isFirebaseAvailable}
                  title="Rafraîchir"
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isFetching ? (
                <div className="text-center py-8 text-slate-400 font-mono italic flex flex-col items-center space-y-1.5">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 stroke-[2.5]" />
                  <span>Chargement des archives...</span>
                </div>
              ) : backups.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 italic font-mono bg-slate-50">
                  {isFirebaseAvailable 
                    ? "Aucune sauvegarde trouvée dans le Cloud." 
                    : "Activez Firebase pour voir l'historique."}
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {backups.map((bk) => (
                    <div 
                      key={bk.id} 
                      className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex items-start justify-between space-x-2 hover:bg-slate-100/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-black text-slate-900 flex items-center space-x-1.5">
                          <span className="truncate max-w-[160px]">{bk.label}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold font-mono">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-slate-300" />
                            {new Date(bk.createdAt).toLocaleDateString('fr-FR')} {new Date(bk.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1 text-slate-300" />
                            {bk.operator}
                          </span>
                        </div>
                        <div className="text-[10px] bg-indigo-50/50 text-indigo-800 border border-indigo-100/50 px-2 py-0.5 rounded-md inline-block font-mono font-bold">
                          {bk.data?.items?.length || 0} art • {bk.data?.invoices?.length || 0} vnt • {bk.data?.customers?.length || 0} clt
                        </div>
                      </div>

                      <div className="flex space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreBackup(bk)}
                          title="Restaurer ce point sur cet appareil"
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-all flex items-center space-x-1 font-bold text-[10px]"
                        >
                          <CloudDownload className="h-4.5 w-4.5 stroke-[2.5]" />
                          <span>Restaurer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(bk.id, bk.label)}
                          title="Supprimer la sauvegarde"
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
