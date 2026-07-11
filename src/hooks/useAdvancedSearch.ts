import { useState, useMemo, useCallback } from 'react';

export interface AdvancedFilters {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  category?: string;
  status?: string;
  textSearch?: string;
}

export interface AdvancedSearchConfig<T> {
  dateField?: keyof T;
  amountField?: keyof T;
  categoryField?: keyof T;
  statusField?: keyof T;
  textSearchFields?: (keyof T)[];
}

export interface AdvancedSearchResult<T> {
  /** Items matching all active advanced filters */
  filtered: T[];
  /** Current filter values */
  filters: AdvancedFilters;
  /** Set a single filter key (pass undefined or empty string to clear) */
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  /** Set multiple filters at once (partial update) */
  setFilters: (filters: Partial<AdvancedFilters>) => void;
  /** Clear all advanced filters back to defaults */
  resetFilters: () => void;
  /** Number of non-empty active filters */
  activeFilterCount: number;
}

const emptyFilters: AdvancedFilters = {};

export function useAdvancedSearch<T>(
  items: T[],
  config: AdvancedSearchConfig<T>
): AdvancedSearchResult<T> {
  const [filters, setFiltersState] = useState<AdvancedFilters>({});

  const setFilter = useCallback(<K extends keyof AdvancedFilters>(
    key: K,
    value: AdvancedFilters[K]
  ) => {
    setFiltersState(prev => {
      const cleaned = value === '' ? undefined : value;
      if (prev[key] === cleaned) return prev;
      return { ...prev, [key]: cleaned };
    });
  }, []);

  const setFilters = useCallback((partial: Partial<AdvancedFilters>) => {
    setFiltersState(prev => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(partial)) {
        const cleaned = value === '' ? undefined : value;
        (next as Record<string, unknown>)[key] = cleaned;
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const filtered = useMemo(() => {
    return items.filter(item => {
      // --- Date range filter ---
      if (config.dateField && filters.dateFrom) {
        const itemDate = new Date(item[config.dateField] as string);
        const fromDate = new Date(filters.dateFrom);
        if (itemDate < fromDate) return false;
      }
      if (config.dateField && filters.dateTo) {
        const itemDate = new Date(item[config.dateField] as string);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }

      // --- Amount range filter ---
      if (config.amountField && filters.amountMin !== undefined) {
        const amount = Number(item[config.amountField]);
        if (amount < filters.amountMin) return false;
      }
      if (config.amountField && filters.amountMax !== undefined) {
        const amount = Number(item[config.amountField]);
        if (amount > filters.amountMax) return false;
      }

      // --- Category filter ---
      if (config.categoryField && filters.category) {
        const category = String(item[config.categoryField]);
        if (category !== filters.category) return false;
      }

      // --- Status filter ---
      if (config.statusField && filters.status) {
        const status = String(item[config.statusField]);
        if (status !== filters.status) return false;
      }

      // --- Text search (applied to multiple fields) ---
      if (config.textSearchFields && filters.textSearch && filters.textSearch.trim()) {
        const query = filters.textSearch.toLowerCase().trim();
        const matches = config.textSearchFields.some(field => {
          const value = item[field];
          return String(value ?? '').toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      return true;
    });
  }, [items, config.dateField, config.amountField, config.categoryField, config.statusField, config.textSearchFields, filters]);

  const activeFilterCount = useMemo((): number => {
    let count = 0;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.amountMin !== undefined) count++;
    if (filters.amountMax !== undefined) count++;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.textSearch && filters.textSearch.trim()) count++;
    return count;
  }, [filters]);

  return {
    filtered,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    activeFilterCount,
  };
}
