import Ably from 'ably';
import {
  useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { nanoid } from 'nanoid';
import { AblyContext } from './AblyContext';

type UseAblyOptions = {
  clientId?: string
  autoConnect?: boolean
  name: string
  authCallback?: (data: Ably.Types.TokenParams) => Promise<
  Ably.Types.TokenDetails | Ably.Types.TokenRequest | string | null
  >
};

export enum AblyClientStatus {
  IDLE = 'idle',
  INITIALIZED = 'idle',
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  CLOSING = 'closing',
  FAILED = 'failed',
  UPDATE = 'update',
}

export function useAbly(options: UseAblyOptions) {
  const hookId = useRef(nanoid(8));
  const context = useContext(AblyContext);
  const [client, setClient] = useState<Ably.Realtime | null>();
  const [status, setStatus] = useState(AblyClientStatus.IDLE);
  const clientId = useMemo(() => options.clientId ?? nanoid(8), [options.clientId]);

  const connect = useCallback(() => {
    client?.connect();
  }, [client]);

  const close = useCallback(() => {
    client?.close();
  }, [client]);

  const authCallbackRef = useRef(options.authCallback);
  authCallbackRef.current = options.authCallback;

  useEffect(() => {
    const handleInitialized = () => setStatus(AblyClientStatus.INITIALIZED);
    const handleConnected = () => setStatus(AblyClientStatus.CONNECTED);
    const handleConnecting = () => setStatus(AblyClientStatus.CONNECTING);
    const handleDisconnected = () => setStatus(AblyClientStatus.DISCONNECTED);
    const handleSuspended = () => setStatus(AblyClientStatus.SUSPENDED);
    const handleClosed = () => setStatus(AblyClientStatus.CLOSED);
    const handleClosing = () => setStatus(AblyClientStatus.CLOSING);
    const handleFailed = () => setStatus(AblyClientStatus.FAILED);
    const handleUpdate = () => setStatus(AblyClientStatus.UPDATE);

    const ablyClient = context.registerClient(options.name, hookId.current, () => (
      new Ably.Realtime({
        closeOnUnload: true,
        autoConnect: options.autoConnect ?? false,
        ...(authCallbackRef.current ? {
          authCallback: (data, callback) => {
            authCallbackRef.current!(data)
              .then((result) => callback(null, result))
              .catch((err) => callback(err, null));
          },
        } : {}),
      })
    ));

    ablyClient.connection.on('initialized', handleInitialized);
    ablyClient.connection.on('connected', handleConnected);
    ablyClient.connection.on('connecting', handleConnecting);
    ablyClient.connection.on('disconnected', handleDisconnected);
    ablyClient.connection.on('suspended', handleSuspended);
    ablyClient.connection.on('closed', handleClosed);
    ablyClient.connection.on('closing', handleClosing);
    ablyClient.connection.on('failed', handleFailed);
    ablyClient.connection.on('update', handleUpdate);
    setClient(ablyClient);

    return () => {
      ablyClient.connection.off('initialized', handleInitialized);
      ablyClient.connection.off('connected', handleConnected);
      ablyClient.connection.off('connecting', handleConnecting);
      ablyClient.connection.off('disconnected', handleDisconnected);
      ablyClient.connection.off('suspended', handleSuspended);
      ablyClient.connection.off('closed', handleClosed);
      ablyClient.connection.off('closing', handleClosing);
      ablyClient.connection.off('failed', handleFailed);
      ablyClient.connection.off('update', handleUpdate);
      // @README client will be auto-closed if all locks are released
      context.releaseClient(options.name, hookId.current);
    };
  }, [options.name, options.clientId]);

  return useMemo(() => ({
    status,
    client,
    connect,
    close,
    clientId,
  } as {
    status: typeof status
    client: typeof client
    connect: typeof connect
    close: typeof close
    clientId: typeof clientId
  }), [
    status,
    client,
    connect,
    close,
    clientId,
  ]);
}
