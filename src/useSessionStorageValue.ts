import { useCallback, useMemo, useState } from 'react';

export function useSessionStorageValue(name: string, initialValue: string = '') {
  const [value, setValue] = useState(
    typeof window === 'undefined' ? initialValue : (
      window.sessionStorage.getItem(name) ?? initialValue
    ),
  );

  const updateValue = useCallback((incoming: string) => {
    window.sessionStorage.setItem(name, incoming);
    setValue(incoming);
  }, [name]);

  return useMemo(() => (
    [value, updateValue] as [typeof value, typeof updateValue]
  ), [value, updateValue]);
}
