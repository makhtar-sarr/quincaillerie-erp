import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  CheckCircle, 
  ShieldAlert 
} from 'lucide-react';
import { Item, Invoice, Quote, Customer, StockMovement } from '../types';
import { formatFCFA } from '../utils/data';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { Button } from './ui/Button';

interface DashboardViewProps {
  items: Item[];
  invoices: Invoice[];
  quotes: Quote[];
  customers: Customer[];
  movements: StockMovement[];
  onNavigate: (view: string) => void;
  onQuickRestock: (itemId: string, qty: number) => void;
}

export default function DashboardView({
  items,
  invoices,
  quotes,
  customers,
  movements,
  onNavigate,
  onQuickRestock
}: DashboardViewProps) {
  const { metrics, salesByCategory, recentSales, recentMovements } = useDashboardMetrics(items, invoices, customers, movements);

  return (
    <div id="dashboard-view-container" className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 text-white dark:text-neutral-900 p-8 rounded-[2rem] shadow-md border border-neutral-800 dark:border-neutral-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">Gestion de Quincaillerie Sunu</h1>
          <p className="text-slate-300 dark:text-neutral-600 mt-1.5 text-sm font-medium">Tableau de bord de suivi en temps réel • Dakar, Sénégal</p>
        </div>
        <div className="relative z-10 mt-4 md:mt-0 flex items-center space-x-2 bg-white/5 dark:bg-neutral-900/20 border border-white/10 dark:border-neutral-400/20 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-mono font-semibold">
          <span className="h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse"></span>
          <span className="text-amber-300 dark:text-amber-600">Données synchronisées (Local)</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div id="kpi-sales-today" className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-emerald-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-bold font-display uppercase tracking-wider">Ventes Aujourd'hui</span>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-2xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5">
            <span className="text-xl md:text-2xl font-black font-display text-foreground tracking-tight">{formatFCFA(metrics.salesToday)}</span>
            <div className="text-[10px] text-muted mt-2.5 flex items-center font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1 flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-sm">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                Mise à jour
              </span>
              en direct
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div id="kpi-total-sales" className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-indigo-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-bold font-display uppercase tracking-wider">Chiffre d'Affaires</span>
            <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-2xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5">
            <span className="text-xl md:text-2xl font-black font-display text-foreground tracking-tight">{formatFCFA(metrics.totalSales)}</span>
            <div className="text-[10px] text-muted mt-2.5 font-medium">Cumulé sur l'exercice</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div id="kpi-stock-value" className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-amber-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-bold font-display uppercase tracking-wider">Valeur Stock (Vente)</span>
            <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5">
            <span className="text-xl md:text-2xl font-black font-display text-foreground tracking-tight">{formatFCFA(metrics.stockValueRetail)}</span>
            <div className="text-[10px] text-muted mt-2.5 font-medium">
              Achat: <span className="font-bold text-foreground font-mono">{formatFCFA(metrics.stockValueCost)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div id="kpi-client-debts" className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 border-b-4 border-b-rose-500 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-bold font-display uppercase tracking-wider">Créances (Crédits)</span>
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-2.5 rounded-2xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5">
            <span className="text-xl md:text-2xl font-black font-display text-rose-600 dark:text-rose-400 tracking-tight">{formatFCFA(metrics.clientDebts)}</span>
            <div className="text-[10px] text-muted mt-2.5 flex items-center font-medium">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 mr-1 shrink-0" />
              Reste à recouvrer
            </div>
          </div>
        </div>

        {/* KPI 5 */}
        <div id="kpi-stock-alerts" className={`bg-surface p-6 rounded-[2rem] border-2 border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${metrics.lowStockCount > 0 ? 'border-b-4 border-b-amber-500' : 'border-b-4 border-b-emerald-500'}`}>
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-bold font-display uppercase tracking-wider">Alertes Stock Bas</span>
            <div className={`p-2.5 rounded-2xl ${metrics.lowStockCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 animate-pulse' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5">
            <span className={`text-xl md:text-2xl font-black font-display tracking-tight ${metrics.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {metrics.lowStockCount} {metrics.lowStockCount > 1 ? 'articles' : 'article'}
            </span>
            <div className="text-[10px] text-muted mt-2.5 font-medium">Sous le seuil minimal</div>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Category Sales - Custom Pie Chart with pure Tailwind */}
        <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)] flex flex-col lg:col-span-1 justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-display mb-4">Ventes par Catégorie</h3>
            {salesByCategory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-muted font-mono italic">
                Aucune vente enregistrée
              </div>
            ) : (
              <div className="space-y-4">
                {/* Circular Indicator */}
                <div className="flex items-center justify-center py-4 relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {(() => {
                      let accumulatedPercent = 0;
                      return salesByCategory.map((cat, idx) => {
                        const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`;
                        const strokeDashoffset = -accumulatedPercent;
                        accumulatedPercent += cat.percentage;
                        return (
                          <circle
                            key={idx}
                            cx="16"
                            cy="16"
                            r="10.5"
                            fill="transparent"
                            stroke={cat.color}
                            strokeWidth="3.5"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            viewBox="0 0 32 32"
                            className="transition-all duration-1000 ease-out"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-base font-black font-display text-foreground">FCFA</span>
                    <span className="text-[10px] text-muted font-bold">Répartition</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2.5 text-xs">
                  {salesByCategory.slice(0, 4).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-neutral-50/50 p-2 rounded-xl border border-border">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                        <span className="text-foreground font-semibold truncate">{cat.name}</span>
                      </div>
                      <div className="text-right flex items-center space-x-1.5 shrink-0">
                        <span className="font-extrabold text-foreground font-mono">{formatFCFA(cat.value)}</span>
                        <span className="text-muted font-mono text-[10px]">({cat.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                  {salesByCategory.length > 4 && (
                    <div className="text-[10px] text-center text-muted italic pt-1">
                      + {salesByCategory.length - 4} autres catégories
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Recent stock alerts & actions */}
        <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)] lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-50">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-display">Alerte de Rupture & Réapprovisionnement rapide</h3>
            </div>
            <Button 
              onClick={() => onNavigate('items')} 
              variant="primary" 
              size="sm"
            >
              Gérer le stock
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {metrics.lowStockItems.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-[2rem]">
              <CheckCircle className="h-10 w-10 text-emerald-500 dark:text-emerald-400 mb-2" />
              <p className="text-xs text-foreground font-bold">Tout est en ordre !</p>
              <p className="text-[10px] text-muted mt-1">Tous les articles dépassent le stock de sécurité.</p>
            </div>
          ) : (
            <div className="overflow-x-auto h-56 scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pb-2">Article</th>
                    <th className="py-2.5 pb-2">Réf</th>
                    <th className="py-2.5 pb-2 text-center">En Stock</th>
                    <th className="py-2.5 pb-2 text-center">Seuil Min</th>
                    <th className="py-2.5 pb-2 text-right">Action (Commande)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.lowStockItems.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-2.5 font-bold text-foreground truncate max-w-[160px]">{item.name}</td>
                      <td className="py-2.5 text-muted font-mono text-[10px]">{item.ref}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold font-mono text-[10px] ${item.stockCount === 0 ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                          {item.stockCount} {item.unit}s
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-muted font-mono font-semibold">{item.minStock}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end space-x-1.5">
                          <Button
                            onClick={() => onQuickRestock(item.id, 100)}
                            variant="success"
                            size="sm"
                          >
                            +100 {item.unit}s
                          </Button>
                          <Button
                            onClick={() => onQuickRestock(item.id, 500)}
                            variant="success"
                            size="sm"
                          >
                            +500
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {metrics.lowStockItems.length > 5 && (
                <div className="text-center py-2 text-[10px] text-amber-600 dark:text-amber-400 italic font-bold">
                  + {metrics.lowStockItems.length - 5} autres articles en stock critique
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Recent Sales & Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices / Sales */}
        <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-display flex items-center space-x-2">
              <FileText className="h-4.5 w-4.5 text-red-600 dark:text-red-400 shrink-0" />
              <span>Dernières Ventes</span>
            </h3>
            <Button 
              onClick={() => onNavigate('invoices')} 
              variant="danger" 
              size="sm"
            >
              Voir toutes
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {recentSales.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3.5 bg-neutral-50/50 rounded-2xl border border-border hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-foreground text-xs font-mono">{inv.number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                      inv.status === 'Payé' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : 
                      inv.status === 'Partiel' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' : 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted mt-1 font-medium">
                    {inv.customerName} • {inv.date} • <span className="font-bold text-foreground">{inv.paymentMethod}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-foreground font-mono">{formatFCFA(inv.total)}</span>
                  {inv.status === 'Partiel' && (
                    <div className="text-[9px] font-bold text-rose-500 dark:text-rose-400 font-mono">
                      Reste {formatFCFA(inv.total - inv.amountPaid)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center py-6 text-xs text-muted font-mono italic">Aucune vente récente</p>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-surface p-6 rounded-[2rem] border-2 border-border/80 shadow-[0_10px_40px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-display flex items-center space-x-2">
              <Package className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Derniers Mouvements</span>
            </h3>
            <button 
              onClick={() => onNavigate('items')} 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              Historique complet
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {recentMovements.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between p-3.5 bg-neutral-50/50 rounded-2xl border border-border hover:bg-neutral-50 transition-colors">
                <div className="truncate pr-4">
                  <span className="font-extrabold text-foreground text-xs block truncate">{mov.itemName}</span>
                  <div className="text-[10px] text-muted mt-1 font-medium">
                    {mov.date} • {mov.reason} • Réf: <span className="font-mono text-muted">{mov.referenceCode}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end">
                  <span className={`font-black text-xs flex items-center font-mono ${mov.type === 'ENTREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {mov.type === 'ENTREE' ? '+' : '-'}{mov.quantity}
                  </span>
                  <span className="text-[9px] text-muted font-semibold">par {mov.operator}</span>
                </div>
              </div>
            ))}
            {recentMovements.length === 0 && (
              <p className="text-center py-6 text-xs text-muted font-mono italic">Aucun mouvement récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
