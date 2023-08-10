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

  const promise = new Promise<Types.Message | null>((resolve, reject) => {
    const handler = (message: Types.Message) => {
      if (when(message)) {
        cancelTimeout();
        channel.unsubscribe(handler);
        resolve(message);
      }
    };

    cancel = () => {
      cancelTimeout();
      channel.unsubscribe(handler);
      resolve(null);
    };

    channel.subscribe(handler);

    if (timeout) {
      rejectTimeoutId = setTimeout(() => {
        cancelTimeout();
        channel.unsubscribe(handler);
        reject();
      }, timeout);
    }
  }) as Promise<Types.Message> & {
    cancel: typeof cancel
  };
  promise.cancel = cancel;

  return promise;
}
