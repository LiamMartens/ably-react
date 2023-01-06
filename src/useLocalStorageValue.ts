import { useCallback, useMemo, useState } from 'react';

export function useLocalStorageValue(name: string, initialValue: string = '') {
  const [value, setValue] = useState(
    typeof window === 'undefined' ? initialValue : (
      window.localStorage.getItem(name) ?? initialValue
    ),
  );

  const updateValue = useCallback((incoming: string) => {
    window.localStorage.setItem(name, incoming);
    setValue(incoming);
  }, [name]);

  return useMemo(() => (
    [value, updateValue] as [typeof value, typeof updateValue]
  ), [value, updateValue]);
}
