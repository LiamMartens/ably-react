import type Ably from 'ably';
import React, {
  createContext, PropsWithChildren, useRef, useMemo,
} from 'react';
import mitt, { Emitter } from 'mitt';

export type AblyContextEvents = {
  updated: Map<string, {
    client: Ably.Realtime;
    locks: Set<string>;
  }>
};

export type AblyContextValue = {
  $e: Emitter<AblyContextEvents>;
  clients: Map<string, {
    client: Ably.Realtime;
    locks: Set<string>;
  }>
  registerClient(name: string, lockId: string, createClient: () => Ably.Realtime): Ably.Realtime
  releaseClient(name: string, lockId: string): void
};

export const AblyContext = createContext<AblyContextValue>({
  $e: mitt<AblyContextEvents>(),
  clients: new Map(),
  registerClient: () => {
    throw new Error('Not implemented');
  },
  releaseClient: () => {},
});

export function AblyContextProvider({ children }: PropsWithChildren<{}>) {
  const $e = useRef(mitt<AblyContextEvents>());
  const clients = useRef<AblyContextValue['clients']>(new Map());
  const contextValue = useMemo<AblyContextValue>(() => ({
    $e: $e.current,
    clients: clients.current,
    registerClient: (name, lockId, createClient) => {
      const clientObject = clients.current.get(name) ?? (
        clients.current.set(name, {
          client: createClient(),
          locks: new Set(),
        }).get(name)!
      );
      clientObject.locks.add(lockId);
      $e.current.emit('updated', clients.current);
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
        $e.current.emit('updated', clients.current);
      }
    },
  }), [$e, clients]);

  return (
    <AblyContext.Provider value={contextValue}>
      {children}
    </AblyContext.Provider>
  );
}
