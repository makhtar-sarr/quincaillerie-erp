import { Item, Category } from '@/types';

const VALID_CATEGORIES: Category[] = [
  'Ciment & Matériaux',
  'Fer & Métaux',
  'Peinture & Finition',
  'Plomberie & Sanitaire',
  'Électricité & Éclairage',
  'Outillage & Sécurité',
  'Divers',
];

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  items: Item[];
}

/**
 * Parses a single CSV line, handling double-quoted values.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function generateId(index: number): string {
  return `prod-import-${Date.now()}-${index}`;
}

function findHeaderIndex(headers: string[], name: string): number {
  return headers.findIndex(h => h.trim().toLowerCase() === name);
}

/**
 * Imports articles from a CSV string.
 *
 * Expected columns: name, ref, category, unit, minStock, stockCount, buyingPrice, sellingPrice
 * Required fields: name, ref
 * Skips rows where the ref already exists in existingRefs.
 *
 * @param csvContent - Raw CSV string with header row.
 * @param existingRefs - Array of existing article references (for duplicate detection).
 * @returns Summary of the import operation with created items.
 */
export function importArticlesFromCSV(
  csvContent: string,
  existingRefs: string[] = [],
): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [], items: [] };

  if (!csvContent.trim()) {
    result.errors.push('Le contenu CSV est vide');
    return result;
  }

  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    result.errors.push('Le fichier CSV doit contenir une ligne d\'en-tête et au moins une ligne de données');
    return result;
  }

  const headers = parseCSVLine(lines[0]);
  const nameIdx = findHeaderIndex(headers, 'name');
  const refIdx = findHeaderIndex(headers, 'ref');
  const categoryIdx = findHeaderIndex(headers, 'category');
  const unitIdx = findHeaderIndex(headers, 'unit');
  const minStockIdx = findHeaderIndex(headers, 'minstock');
  const stockCountIdx = findHeaderIndex(headers, 'stockcount');
  const buyingPriceIdx = findHeaderIndex(headers, 'buyingprice');
  const sellingPriceIdx = findHeaderIndex(headers, 'sellingprice');
  const descriptionIdx = findHeaderIndex(headers, 'description');

  if (nameIdx === -1) {
    result.errors.push('La colonne requise "name" est introuvable');
    return result;
  }
  if (refIdx === -1) {
    result.errors.push('La colonne requise "ref" est introuvable');
    return result;
  }

  const existingRefSet = new Set(existingRefs.map(r => r.trim().toUpperCase()));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const lineNumber = i + 1;

    const getVal = (idx: number): string | undefined =>
      idx !== -1 && idx < values.length ? values[idx].trim() : undefined;

    const name = getVal(nameIdx);
    const ref = getVal(refIdx);

    if (!name) {
      result.errors.push(`Ligne ${lineNumber} : le champ "name" est obligatoire`);
      continue;
    }
    if (!ref) {
      result.errors.push(`Ligne ${lineNumber} : le champ "ref" est obligatoire (nom: "${name}")`);
      continue;
    }

    const refUpper = ref.toUpperCase();
    if (existingRefSet.has(refUpper)) {
      result.skipped++;
      continue;
    }

    const categoryRaw = getVal(categoryIdx);
    const category: Category = categoryRaw
      ? (VALID_CATEGORIES.includes(categoryRaw as Category)
          ? (categoryRaw as Category)
          : 'Divers')
      : 'Divers';

    const unit = getVal(unitIdx) || 'Unité';
    const description = getVal(descriptionIdx) || undefined;

    const parseNum = (idx: number): number | undefined => {
      const val = getVal(idx);
      if (!val) return undefined;
      const cleaned = val.replace(/[^0-9.-]/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? undefined : Math.floor(num);
    };

    const item: Item = {
      id: generateId(result.imported),
      name,
      ref,
      category,
      unit,
      minStock: parseNum(minStockIdx) ?? 0,
      stockCount: parseNum(stockCountIdx) ?? 0,
      buyingPrice: parseNum(buyingPriceIdx) ?? 0,
      sellingPrice: parseNum(sellingPriceIdx) ?? 0,
      description,
    };

    existingRefSet.add(refUpper);
    result.items.push(item);
    result.imported++;
  }

  return result;
}
