import type Ably from 'ably';
import React, {
  createContext, PropsWithChildren, useRef, useMemo,
} from 'react';

export type AblyContextValue = {
  clients: Map<string, {
    client: Ably.Realtime;
    locks: Set<string>;
  }>
  registerClient(name: string, lockId: string, createClient: () => Ably.Realtime): Ably.Realtime
  releaseClient(name: string, lockId: string): void
};

export const AblyContext = createContext<AblyContextValue>({
  clients: new Map(),
  registerClient: () => {
    throw new Error('Not implemented');
  },
  releaseClient: () => {},
});

export function AblyContextProvider({ children }: PropsWithChildren<{}>) {
  const clients = useRef<AblyContextValue['clients']>(new Map());
  const contextValue = useMemo<AblyContextValue>(() => ({
    clients: clients.current,
    registerClient: (name, lockId, createClient) => {
      const clientObject = clients.current.get(name) ?? (
        clients.current.set(name, {
          client: createClient(),
          locks: new Set(),
        }).get(name)!
      );
      clientObject.locks.add(lockId);
      return clientObject.client;
    },
    releaseClient: (name, lockId) => {
      if (clients.current.has(name)) {
        const clientObject = clients.current.get(name)!;
        clientObject.locks.delete(lockId);
        if (clientObject.locks.size === 0) {
          clientObject.client.close();
          clients.current.delete(name);
        }
      }
    },
  }), [clients]);

  return (
    <AblyContext.Provider value={contextValue}>
      {children}
    </AblyContext.Provider>
  );
}
