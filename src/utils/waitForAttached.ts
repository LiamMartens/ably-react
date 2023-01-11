import { Types } from 'ably';

export function waitForAttached(channel: Types.RealtimeChannelCallbacks, timeout = 0) {
  let cancel = () => {};
  let rejectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancelTimeout = () => {
    if (rejectTimeoutId != null) {
      clearTimeout(rejectTimeoutId);
      rejectTimeoutId = null;
    }
  };

  const promise = new Promise<void>((resolve, reject) => {
    if (channel.state === 'attached') {
      resolve();
    } else {
      const handler = () => {
        cancelTimeout();
        channel.off('attached', handler);
        resolve();
      };
      cancel = () => handler();
      channel.on('attached', handler);

      if (timeout > 0) {
        rejectTimeoutId = setTimeout(() => {
          cancelTimeout();
          channel.off('attached', handler);
          reject();
        }, timeout);
      }
    }
  }) as Promise<void> & {
    cancel: typeof cancel
  };
  promise.cancel = cancel;

  return promise;
}
