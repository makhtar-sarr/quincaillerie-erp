import { toast } from 'sonner';
import type { StoreState } from '../context/StoreContext';

/**
 * Converts an array of objects to CSV and triggers a browser download.
 *
 * @param data - Array of flat objects to export. Keys become CSV headers.
 * @param filename - Output filename (e.g. "items.csv"). `.csv` is appended if missing.
 *
 * Handles:
 * - Commas in values → wraps in double quotes
 * - Double quotes in values → RFC 4180 escaping ("")
 * - undefined / null → empty cell
 * - Empty data → shows toast error, no download
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (!data || data.length === 0) {
    toast.error("Aucune donnée à exporter");
    return;
  }

  const headers = Object.keys(data[0] as Record<string, unknown>);

  const escapeCell = (raw: unknown): string => {
    if (raw === undefined || raw === null) return '';
    const str = String(raw);
    // RFC 4180: wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const bodyRows = data.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(','),
  );

  const csv = [headerRow, ...bodyRows].join('\r\n');

  // BOM for proper Excel UTF-8 handling
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports the full application state as a formatted JSON file.
 *
 * @param state - The current StoreState (settings, items, movements,
 *                customers, suppliers, quotes, invoices).
 *
 * Exports all 7 entity slices. Users are NOT included for security.
 * Filename: erp-backup-YYYY-MM-DD.json
 */
export function exportToJSON(state: StoreState): void {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const filename = `erp-backup-${yyyy}-${mm}-${dd}.json`;

  const payload = {
    settings: state.settings,
    items: state.items,
    movements: state.movements,
    customers: state.customers,
    suppliers: state.suppliers,
    quotes: state.quotes,
    invoices: state.invoices,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success(`Sauvegarde téléchargée : ${filename}`);
}
