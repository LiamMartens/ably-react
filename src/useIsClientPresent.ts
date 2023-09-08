import { Types } from 'ably';
import {
  useEffect, useRef, useState,
} from 'react';
import { useCallbackRef } from 'use-auto-callback-ref';
import { useChannelStatus } from './useChannelStatus';

// can be used to determine whether a client is present on a specific channel
export function useIsClientPresent(
  channel: Types.RealtimeChannelCallbacks | null,
  clientId: string,
  onError?: (error: Types.ErrorInfo | null | undefined) => void,
) {
  const channelStatus = useChannelStatus(channel);
  const removePresenceTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updatePresenceTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPresent, setIsPresent] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clearRemovePresenceTimeoutIdRef = useCallbackRef(() => {
    if (removePresenceTimeoutIdRef.current) {
      clearTimeout(removePresenceTimeoutIdRef.current);
      removePresenceTimeoutIdRef.current = null;
    }
  }, [removePresenceTimeoutIdRef]);

  const removePresenceRef = useCallbackRef(() => {
    clearRemovePresenceTimeoutIdRef.current();
    removePresenceTimeoutIdRef.current = setTimeout(() => {
      setIsPresent(false);
    }, 1000);
  }, [clearRemovePresenceTimeoutIdRef, removePresenceTimeoutIdRef]);

  const updateClientPresenceRef = useCallbackRef(() => {
    if (updatePresenceTimeoutIdRef.current) {
      clearTimeout(updatePresenceTimeoutIdRef.current);
      updatePresenceTimeoutIdRef.current = null;
    }

    updatePresenceTimeoutIdRef.current = setTimeout(() => {
      channel?.presence.get((getPresenceError, presence) => {
        // trigger error handler if there is an error
        if (getPresenceError) onErrorRef.current?.(getPresenceError);
        setIsPresent(presence?.some((p) => p.clientId === clientId) ?? false);
      });
    }, 300);
  }, [clientId, updatePresenceTimeoutIdRef]);

  useEffect(() => {
    // if the channel changes - reset the presentness
    // this will be delayed in case the client only briefly disconnects
    removePresenceRef.current();

    // attach handler
    const handler = (message: Types.PresenceMessage) => {
      if (message.clientId === clientId) {
        if (message.action === 'enter' || message.action === 'present' || message.action === 'update') {
          clearRemovePresenceTimeoutIdRef.current();
          setIsPresent(true);
        } else if (message.action === 'leave' || message.action === 'absent') {
          removePresenceRef.current();
        }

        // need to also fetch the actual presence (https://ably.com/tutorials/presence#tutorial-step-5)
        // the presence events can come in out of sync
        updateClientPresenceRef.current();
      }
    };

    channel?.on('attached', updateClientPresenceRef.current);
    channel?.on('update', updateClientPresenceRef.current);
    channel?.presence.subscribe(handler, (err) => {
      // trigger error handler
      if (err) onErrorRef.current?.(err);
      // check if client is already present
      channel?.presence.get((getPresenceError, presence) => {
        // trigger error handler if there is an error
        if (getPresenceError) onErrorRef.current?.(getPresenceError);
        setIsPresent(presence?.some((p) => p.clientId === clientId) ?? false);
      });
    });

    return () => {
      channel?.off('attached', updateClientPresenceRef.current);
      channel?.off('update', updateClientPresenceRef.current);
      channel?.presence.unsubscribe(handler);
    };
  }, [channel, channelStatus, clientId, onErrorRef, clearRemovePresenceTimeoutIdRef]);

  return isPresent;
}
