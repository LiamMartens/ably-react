import type { Types } from 'ably';
import { retryAsPromised, Options as RetryOptions } from 'retry-as-promised';
import { useEffect, useRef } from 'react';
import { useCallbackRef } from 'use-auto-callback-ref';

type Options = {
  retryOptions?: RetryOptions
};

/*
 * This hook is simply used to present a client to a channel
 */
export function usePresent(channel: Types.RealtimeChannelCallbacks | null, options?: Options) {
  const leaveChannelTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

    const enterClient = () => retryAsPromised(
      () => new Promise<void>((resolve, reject) => {
        channel?.presence.enter(undefined, (err) => {
          if (err) return reject(err);
          return resolve();
        });
      }),
      {
        timeout: 3000,
        max: Infinity,
        ...options?.retryOptions,
      },
    );

    enterClient();
    retryAsPromised(
      () => new Promise<void>((resolve, reject) => {
        channel?.presence.subscribe(enterClient, (err) => {
          if (err) return reject(err);
          return resolve();
        });
      }),
      {
        timeout: 3000,
        max: Infinity,
        ...options?.retryOptions,
      },
    );

    return () => {
      channel?.presence.unsubscribe(enterClient);
      leaveChannelPresenceRef.current();
    };
  }, [channel]);
}
