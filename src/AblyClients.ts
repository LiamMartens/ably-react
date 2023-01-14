import type Ably from 'ably';
import mitt, { Emitter } from 'mitt';

export type AblyClientsEvents = {
  updated: Map<string, {
    client: Ably.Realtime;
    locks: Set<string>;
  }>
};

export type AblyClientsType = {
  $e: Emitter<AblyClientsEvents>;
  clients: Map<string, {
    client: Ably.Realtime;
    locks: Set<string>;
  }>
  registerClient(name: string, lockId: string, createClient: () => Ably.Realtime): Ably.Realtime
  releaseClient(name: string, lockId: string): void
};

export const AblyClients: AblyClientsType = {
  $e: mitt<AblyClientsEvents>(),
  clients: new Map(),
  registerClient: (name, lockId, createClient) => {
    const clientObject = AblyClients.clients.get(name) ?? (
      AblyClients.clients.set(name, {
        client: createClient(),
        locks: new Set(),
      }).get(name)!
    );
    clientObject.locks.add(lockId);
    AblyClients.$e.emit('updated', AblyClients.clients);
    return clientObject.client;
  },
  releaseClient: (name, lockId) => {
    if (AblyClients.clients.has(name)) {
      const clientObject = AblyClients.clients.get(name)!;
      clientObject.locks.delete(lockId);
      if (clientObject.locks.size === 0) {
        clientObject.client.close();
        AblyClients.clients.delete(name);
      }
      AblyClients.$e.emit('updated', AblyClients.clients);
    }
  },
};
