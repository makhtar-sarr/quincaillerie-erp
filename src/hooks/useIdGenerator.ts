import { useCallback } from 'react';

export function useIdGenerator(): (prefix: string) => string {
  const generateId = useCallback((prefix: string): string => {
    return `${prefix}-${Date.now()}`;
  }, []);

  return generateId;
}
