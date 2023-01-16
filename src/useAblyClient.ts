import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { AblyClients } from './AblyClients';

export function useAblyClient(name = 'default') {
  const client = useSyncExternalStore(
    (handler) => () => {
      AblyClients.$e.on('updated', handler);
      return () => AblyClients.$e.off('updated', handler);
    },
    () => AblyClients.clients.get(name)?.client ?? null,
    () => null,
  );

  return client;
}
