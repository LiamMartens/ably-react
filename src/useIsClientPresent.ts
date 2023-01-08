import { Types } from 'ably';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';

// can be used to determine whether a client is present on a specific channel
export function useIsClientPresent(
  channel: Types.RealtimeChannelCallbacks,
  clientId: string,
  onError?: (error: Types.ErrorInfo | null | undefined) => void,
) {
  const removePresenceTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPresent, setIsPresent] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clearRemovePresenceTimeoutId = useCallback(() => {
    if (removePresenceTimeoutIdRef.current) {
      clearTimeout(removePresenceTimeoutIdRef.current);
      removePresenceTimeoutIdRef.current = null;
    }
  }, [removePresenceTimeoutIdRef]);
  const clearRemovePresenceTimeoutIdRef = useRef(clearRemovePresenceTimeoutId);
  clearRemovePresenceTimeoutIdRef.current = clearRemovePresenceTimeoutId;

  const removePresence = useCallback(() => {
    clearRemovePresenceTimeoutIdRef.current();
    removePresenceTimeoutIdRef.current = setTimeout(() => {
      setIsPresent(false);
    }, 1000);
  }, [clearRemovePresenceTimeoutIdRef, removePresenceTimeoutIdRef]);
  const removePresenceRef = useRef(removePresence);
  removePresenceRef.current = removePresence;

  useEffect(() => {
    // if the channel changes - reset the presentness
    // this will be delayed in case the client only briefly disconnects
    removePresenceRef.current();

    // attach handler
    const handler = (message: Types.PresenceMessage) => {
      if (message.clientId === clientId) {
        if (message.action === 'enter') {
          clearRemovePresenceTimeoutIdRef.current();
          setIsPresent(true);
        } else if (message.action === 'leave') {
          removePresenceRef.current();
        }
      }
    };

    channel.presence.subscribe(handler, (err) => {
      // trigger error handler
      if (err) onErrorRef.current?.(err);
      // check if client is already present
      channel.presence.get((getPresenceError, presence) => {
        // trigger error handler if there is an error
        if (getPresenceError) onErrorRef.current?.(getPresenceError);
        presence?.forEach((entry) => handler(entry));
      });
    });

    return () => {
      channel.presence.unsubscribe(handler);
    };
  }, [channel, clientId, onErrorRef, clearRemovePresenceTimeoutIdRef]);

  return isPresent;
}
