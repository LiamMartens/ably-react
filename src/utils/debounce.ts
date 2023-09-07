export function debounce<T extends (...args: any) => any>(fn: T, timeout = 0) {
  type Params = Parameters<T>;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Params) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...Array.from(args));
    }, timeout);
  }) as T & {
    cancel: () => void;
  };
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debounced;
}
