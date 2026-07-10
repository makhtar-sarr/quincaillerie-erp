import { useState, useCallback } from 'react';

/**
 * Hook for filtering data by month and year.
 * Items must have a `date` field in YYYY-MM-DD format.
 * Setting month=0 or year=0 disables that dimension ("Tous").
 */
export function useTemporalFilter<T extends { date: string }>() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const filterByMonth = useCallback(
    (items: T[]): T[] => {
      return items.filter((item) => {
        const date = new Date(item.date);
        const itemMonth = date.getMonth() + 1;
        const itemYear = date.getFullYear();

        const matchMonth = selectedMonth === 0 || itemMonth === selectedMonth;
        const matchYear = selectedYear === 0 || itemYear === selectedYear;

        return matchMonth && matchYear;
      });
    },
    [selectedMonth, selectedYear],
  );

  return {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    filterByMonth,
  };
}
