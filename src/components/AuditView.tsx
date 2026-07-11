import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import type { AuditEntry } from '@/types';
import { getAuditLog } from '@/lib/storageAdapter';
import { Table } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';

const ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
};

const ENTITY_LABELS: Record<string, string> = {
  item: 'Article',
  movement: 'Mouvement',
  customer: 'Client',
  supplier: 'Fournisseur',
  quote: 'Devis',
  invoice: 'Facture',
  settings: 'Paramètres',
};

function formatAction(action: string): string {
  if (!action) return '—';
  return ACTION_LABELS[action.toLowerCase()] ?? action.charAt(0).toUpperCase() + action.slice(1);
}

function formatEntity(entity: string): string {
  if (!entity) return '—';
  return ENTITY_LABELS[entity.toLowerCase()] ?? entity.charAt(0).toUpperCase() + entity.slice(1);
}

function formatDate(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  try {
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return ts;
  }
}

function formatTime(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  try {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const columns = [
  { key: 'date', label: 'Date', className: 'whitespace-nowrap' },
  { key: 'operator', label: 'Opérateur', className: 'font-semibold' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Entité' },
  { key: 'detail', label: 'Détail', className: 'text-muted max-w-[260px] truncate' },
];

export default function AuditView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAuditLog();
        if (!cancelled) {
          setEntries(data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du journal d\'audit:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div id="audit-view-root" className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-black font-display text-foreground flex items-center space-x-2 uppercase tracking-wide">
            <ShieldAlert className="h-6 w-6 text-muted" />
            <span>Journal d'Audit</span>
          </h2>
          <p className="text-xs text-muted mt-1 font-semibold">
            Historique des opérations et modifications système
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-sm text-muted font-medium">Chargement du journal...</p>
          </div>
        </div>
      </div>
    );
  }

  const tableData = entries.map((entry) => ({
    date: (
      <span className="flex items-center gap-1.5 text-xs font-mono">
        <span className="font-bold text-foreground">{formatDate(entry.ts)}</span>
        <span className="text-muted">{formatTime(entry.ts)}</span>
      </span>
    ),
    operator: (
      <span className="text-sm font-semibold text-foreground">{entry.operator}</span>
    ),
    action: (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
        bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
        {formatAction(entry.action)}
      </span>
    ),
    entity: (
      <span className="text-sm text-foreground">{formatEntity(entry.entity)}</span>
    ),
    detail: (
      <span className="text-xs text-muted leading-relaxed block truncate" title={entry.detail}>
        {entry.detail ?? '—'}
      </span>
    ),
  }));

  return (
    <div id="audit-view-root" className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── Title section ── */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black font-display text-foreground flex items-center space-x-2 uppercase tracking-wide">
            <ShieldAlert className="h-6 w-6 text-muted" />
            <span>Journal d'Audit</span>
          </h2>
          <p className="text-xs text-muted mt-1 font-semibold">
            Historique des opérations et modifications système
          </p>
        </div>
        {entries.length > 0 && (
          <span className="text-[10px] font-mono text-muted bg-neutral-50 dark:bg-neutral-100 px-3 py-1 rounded-full border border-border">
            {entries.length} entrée{entries.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Audit table ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="p-0 overflow-hidden">
          <Table
            columns={columns}
            data={tableData}
            emptyMessage="Aucune entrée d'audit"
            mobileCard
          />
        </Card>
      </motion.div>
    </div>
  );
}
