import type { Types } from 'ably';
import { retryAsPromised, Options as RetryOptions } from 'retry-as-promised';
import { useEffect, useRef } from 'react';
import { useCallbackRef } from 'use-auto-callback-ref';

type Options = {
  retryOptions?: RetryOptions;
};

/*
 * This hook is simply used to present a client to a channel
 */
export function usePresent(
  clientId: string,
  channel: Types.RealtimeChannelCallbacks | null,
  options?: Options,
) {
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

    const enterClientIfNotPresent = () => retryAsPromised(
      () => new Promise<void>((resolve, reject) => {
        if (channel?.state !== 'attached') { throw new Error('Channel not ready'); }
        channel.presence.get(
          {
            waitForSync: true,
            clientId,
          },
          (err, presence) => {
            if (err) return reject(err);
            const isPresent = !!presence?.some(
              (p) => p.clientId === clientId,
            );
            if (!isPresent) {
              // only re-enter if not already present
              return channel?.presence.enter(undefined, (enterError) => {
                if (enterError) return reject(enterError);
                return resolve();
              });
            }

            return resolve();
          },
        );
      }),
      {
        backoffBase: 2000,
        max: Infinity,
        ...options?.retryOptions,
      },
    );

    enterClientIfNotPresent();
    retryAsPromised(
      () => new Promise<void>((resolve, reject) => {
        if (channel?.state !== 'attached') { throw new Error('Channel not ready'); }
        channel?.presence.subscribe(enterClientIfNotPresent, (err) => {
          if (err) return reject(err);
          return resolve();
        });
      }),
      {
        backoffBase: 2000,
        max: Infinity,
        ...options?.retryOptions,
      },
    );

    return () => {
      channel?.presence.unsubscribe(enterClientIfNotPresent);
      leaveChannelPresenceRef.current();
    };
  }, [clientId, channel]);
}
