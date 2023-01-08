import { Types } from 'ably';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';

// can be used to determine whether a client is present on a specific channel
export function useIsClientPresent(
  channel: Types.RealtimeChannelCallbacks,
  clientId: string,
) {
  const removePresenceTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPresent, setIsPresent] = useState(false);

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

    channel.presence.subscribe((message) => {
      if (message.clientId === clientId) {
        if (message.action === 'enter') {
          clearRemovePresenceTimeoutIdRef.current();
          setIsPresent(true);
        } else if (message.action === 'leave') {
          removePresenceRef.current();
        }
      }
    });
    channel.presence.unsubscribe();
  }, [channel, clientId, clearRemovePresenceTimeoutIdRef]);

  return isPresent;
}
