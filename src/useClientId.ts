import { nanoid } from 'nanoid';
import { useRef } from 'react';

export function useClientId(clientId: string | null) {
  const uniqueClientIdRef = useRef(nanoid(8));
  return clientId ?? uniqueClientIdRef.current;
}
