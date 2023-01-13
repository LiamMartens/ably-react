import { Types } from 'ably';

export function waitForMessage(
  channel: Types.RealtimeChannelCallbacks,
  when: (message: Types.Message) => boolean,
  timeout: number | false = false,
) {
  let cancel = () => {};
  let rejectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancelTimeout = () => {
    if (rejectTimeoutId != null) {
      clearTimeout(rejectTimeoutId);
      rejectTimeoutId = null;
    }
  };

  const promise = new Promise<void>((resolve, reject) => {
    const handler = (message: Types.Message) => {
      if (when(message)) {
        cancelTimeout();
        channel.unsubscribe(handler);
        resolve();
      }
    };

    cancel = () => {
      cancelTimeout();
      channel.unsubscribe(handler);
      resolve();
    };

    channel.subscribe(handler);

    if (timeout) {
      rejectTimeoutId = setTimeout(() => {
        cancelTimeout();
        channel.unsubscribe(handler);
        reject();
      }, timeout);
    }
  }) as Promise<void> & {
    cancel: typeof cancel
  };
  promise.cancel = cancel;

  return promise;
}
