import { Realtime } from 'ably';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useCallbackRef } from 'use-auto-callback-ref';

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

export function useAblyClientStatus(client: Realtime | null) {
  const [status, setStatus] = useState(AblyClientStatus.IDLE);
  const resetStatusTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetStatusTimeoutIdRef = useCallbackRef(() => {
    if (resetStatusTimeoutIdRef.current) {
      clearTimeout(resetStatusTimeoutIdRef.current);
      resetStatusTimeoutIdRef.current = null;
    }
  }, [resetStatusTimeoutIdRef]);

  // this function only uses refs
  // no deps needed
  const resetStatus = useCallback(() => {
    clearResetStatusTimeoutIdRef.current();
    resetStatusTimeoutIdRef.current = setTimeout(() => {
      setStatus(AblyClientStatus.IDLE);
    }, 1000);
  }, []);

  const updateStatus = useCallback((incoming: AblyClientStatus) => {
    clearResetStatusTimeoutIdRef.current();
    setStatus(incoming);
  }, []);

  useEffect(() => {
    resetStatus();

    if (client) {
      const handleInitialized = () => updateStatus(AblyClientStatus.INITIALIZED);
      const handleConnected = () => updateStatus(AblyClientStatus.CONNECTED);
      const handleConnecting = () => updateStatus(AblyClientStatus.CONNECTING);
      const handleDisconnected = () => updateStatus(AblyClientStatus.DISCONNECTED);
      const handleSuspended = () => updateStatus(AblyClientStatus.SUSPENDED);
      const handleClosed = () => updateStatus(AblyClientStatus.CLOSED);
      const handleClosing = () => updateStatus(AblyClientStatus.CLOSING);
      const handleFailed = () => updateStatus(AblyClientStatus.FAILED);
      const handleUpdate = () => updateStatus(AblyClientStatus.UPDATE);

      client.connection.on('initialized', handleInitialized);
      client.connection.on('connected', handleConnected);
      client.connection.on('connecting', handleConnecting);
      client.connection.on('disconnected', handleDisconnected);
      client.connection.on('suspended', handleSuspended);
      client.connection.on('closed', handleClosed);
      client.connection.on('closing', handleClosing);
      client.connection.on('failed', handleFailed);
      client.connection.on('update', handleUpdate);

      return () => {
        client.connection.off('initialized', handleInitialized);
        client.connection.off('connected', handleConnected);
        client.connection.off('connecting', handleConnecting);
        client.connection.off('disconnected', handleDisconnected);
        client.connection.off('suspended', handleSuspended);
        client.connection.off('closed', handleClosed);
        client.connection.off('closing', handleClosing);
        client.connection.off('failed', handleFailed);
        client.connection.off('update', handleUpdate);
      };
    }

    return () => {};
  }, [client]);

  return status;
}
