import { Realtime } from 'ably';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

export enum AblyClientStatus {
  IDLE = 'idle',
  INITIALIZED = 'initialized',
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  CLOSING = 'closing',
  FAILED = 'failed',
  UPDATE = 'update',
}

const connectionStateToClientStatus = {
  initialized: AblyClientStatus.INITIALIZED,
  connected: AblyClientStatus.CONNECTED,
  connecting: AblyClientStatus.CONNECTING,
  disconnected: AblyClientStatus.DISCONNECTED,
  suspended: AblyClientStatus.SUSPENDED,
  closed: AblyClientStatus.CLOSED,
  closing: AblyClientStatus.CLOSING,
  failed: AblyClientStatus.FAILED,
  update: AblyClientStatus.UPDATE,
};

function subscribeToAllStatusChanges(client: Realtime | null) {
  return (handler: () => void) => {
    client?.connection.on('initialized', handler);
    client?.connection.on('connected', handler);
    client?.connection.on('connecting', handler);
    client?.connection.on('disconnected', handler);
    client?.connection.on('suspended', handler);
    client?.connection.on('closed', handler);
    client?.connection.on('closing', handler);
    client?.connection.on('failed', handler);
    client?.connection.on('update', handler);

    return () => {
      client?.connection.off('initialized', handler);
      client?.connection.off('connected', handler);
      client?.connection.off('connecting', handler);
      client?.connection.off('disconnected', handler);
      client?.connection.off('suspended', handler);
      client?.connection.off('closed', handler);
      client?.connection.off('closing', handler);
      client?.connection.off('failed', handler);
      client?.connection.off('update', handler);
    };
  };
}

export function useAblyClientStatus(client: Realtime | null) {
  const status = useSyncExternalStore(
    (handler) => subscribeToAllStatusChanges(client)(handler),
    () => (
      client?.connection.state
        ? connectionStateToClientStatus[client.connection.state]
        : AblyClientStatus.IDLE
    ),
    () => AblyClientStatus.IDLE,
  );

  return status;
}
