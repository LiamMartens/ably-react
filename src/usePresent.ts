import type { Types } from 'ably';
import { useEffect, useRef } from 'react';
import { useCallbackRef } from 'use-auto-callback-ref';

/*
 * This hook is simply used to present a client to a channel
 */
export function usePresent(channel: Types.RealtimeChannelCallbacks | null) {
  const leaveChannelTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveChannelTimeoutRef = useCallbackRef(() => {
    if (leaveChannelTimeoutIdRef.current) {
      clearTimeout(leaveChannelTimeoutIdRef.current);
      leaveChannelTimeoutIdRef.current = null;
    }
  }, [leaveChannelTimeoutIdRef]);

  const leaveChannelPresenceRef = useCallbackRef(() => {
    clearLeaveChannelTimeoutRef.current();
    leaveChannelTimeoutIdRef.current = setTimeout(() => {
      channel?.presence.leave();
    }, 1000);
  }, [channel, clearLeaveChannelTimeoutRef]);

  useEffect(() => {
    clearLeaveChannelTimeoutRef.current();

    const attachedHandler = () => {
      channel?.presence.enter();
    };

    channel?.presence.enter(undefined, (error) => {
      if (error) {
        console.warn(error);
        // if there was an error let's try and wait until the channel is attached
        channel.on('attached', attachedHandler);
      }
    });

    return () => {
      leaveChannelPresenceRef.current();
      channel?.off('attached', attachedHandler);
    };
  }, [channel]);
}
