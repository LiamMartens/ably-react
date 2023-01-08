import type { Types } from 'ably';
import { useCallback, useEffect, useRef } from 'react';

/*
 * This hook is simply used to present a client to a channel
 */
export function usePresent(channel: Types.RealtimeChannelCallbacks | null) {
  const leaveChannelTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveChannelTimeout = useCallback(() => {
    if (leaveChannelTimeoutIdRef.current) {
      clearTimeout(leaveChannelTimeoutIdRef.current);
      leaveChannelTimeoutIdRef.current = null;
    }
  }, [leaveChannelTimeoutIdRef]);
  const clearLeaveChannelTimeoutRef = useRef(clearLeaveChannelTimeout);
  clearLeaveChannelTimeoutRef.current = clearLeaveChannelTimeout;

  const leaveChannelPresence = useCallback(() => {
    clearLeaveChannelTimeoutRef.current();
    leaveChannelTimeoutIdRef.current = setTimeout(() => {
      channel?.presence.leave();
    }, 1000);
  }, [channel, clearLeaveChannelTimeoutRef]);
  const leaveChannelPresenceRef = useRef(leaveChannelPresence);
  leaveChannelPresenceRef.current = leaveChannelPresence;

  useEffect(() => {
    channel?.presence.enter();
    return () => {
      leaveChannelPresenceRef.current();
    };
  }, [channel]);
}
