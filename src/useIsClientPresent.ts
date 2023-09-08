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
  const updatePresenceTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPresent, setIsPresent] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

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
    // attach handler
    const handler = (message: Types.PresenceMessage) => {
      if (message.clientId === clientId) {
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
  }, [channel, channelStatus, clientId, onErrorRef]);

  return isPresent;
}
