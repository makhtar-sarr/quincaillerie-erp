import { useMemo } from 'react';
import { Item, Invoice, Customer, StockMovement } from '../types';

export interface DashboardMetrics {
  totalSales: number;
  salesToday: number;
  stockValueCost: number;
  stockValueRetail: number;
  clientDebts: number;
  lowStockCount: number;
  lowStockItems: Item[];
}

export interface SalesCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DashboardMetricsResult {
  metrics: DashboardMetrics;
  salesByCategory: SalesCategory[];
  recentSales: Invoice[];
  recentMovements: StockMovement[];
}

export function useDashboardMetrics(
  items: Item[],
  invoices: Invoice[],
  customers: Customer[],
  movements: StockMovement[]
): DashboardMetricsResult {
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);

    // Sales today (mocking today as 2026-07-06 based on current system date)
    const todayStr = new Date().toISOString().split('T')[0];
    const salesToday = invoices
      .filter(inv => inv.date === todayStr)
      .reduce((acc, inv) => acc + inv.total, 0);

    const stockValueCost = items.reduce(
      (acc, item) => acc + item.stockCount * item.buyingPrice,
      0
    );
    const stockValueRetail = items.reduce(
      (acc, item) => acc + item.stockCount * item.sellingPrice,
      0
    );

    const clientDebts = customers.reduce(
      (acc, cust) => acc + cust.outstandingBalance,
      0
    );
    const lowStockItems = items.filter(item => item.stockCount <= item.minStock);

    return {
      totalSales,
      salesToday,
      stockValueCost,
      stockValueRetail,
      clientDebts,
      lowStockCount: lowStockItems.length,
      lowStockItems,
    };
  }, [items, invoices, customers]);

  const salesByCategory = useMemo<SalesCategory[]>(() => {
    const categories: Record<string, number> = {};
    invoices.forEach(inv => {
      inv.items.forEach(line => {
        const itemObj = items.find(i => i.id === line.itemId);
        const cat = itemObj ? itemObj.category : 'Divers';
        categories[cat] = (categories[cat] || 0) + line.total;
      });
    });

    const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100),
        color:
          name === 'Ciment & Matériaux'
            ? '#B91C1C' // red-700
            : name === 'Fer & Métaux'
              ? '#4338CA' // indigo-700
              : name === 'Peinture & Finition'
                ? '#047857' // emerald-700
                : name === 'Plomberie & Sanitaire'
                  ? '#0369A1' // sky-700
                  : name === 'Électricité & Éclairage'
                    ? '#D97706' // amber-600
                    : name === 'Outillage & Sécurité'
                      ? '#6B7280' // gray-500
                      : '#8B5CF6', // purple-500
      }))
      .sort((a, b) => b.value - a.value);
  }, [invoices, items]);

  const recentSales = useMemo<Invoice[]>(() => {
    return [...invoices]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [invoices]);

  const recentMovements = useMemo<StockMovement[]>(() => {
    return [...movements]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [movements]);

  return {
    metrics,
    salesByCategory,
    recentSales,
    recentMovements,
  };
}
