/* eslint "no-async-promise-executor": "off" */
import { Types } from 'ably';
import { nanoid } from 'nanoid';
import { waitForAttached } from './waitForAttached';
import { waitForMessage } from './waitForMessage';

export function waitForHandshake(
  channel: Types.RealtimeChannelCallbacks,
  interval = 1000,
  timeout: number | false = false,
  acceptHandshakeIf?: (message: Types.Message) => boolean,
) {
  let canceled = false;
  const handshakeId = nanoid();
  const waitForAttachedPromise = waitForAttached(channel, timeout);
  let waitForMessagePromise: ReturnType<typeof waitForMessage> | null = null;
  let retryIntervalId: ReturnType<typeof setInterval> | null = null;

  const promise = new Promise<void>(async (resolve, reject) => {
    await waitForAttachedPromise;
    if (canceled) {
      resolve();
      return;
    }

    // wait until the channel is attached (if not already)
    // create a waitForMessage promise which will wait for the handshake callback
    // with the same handshakeId
    waitForMessagePromise = waitForMessage(channel, (message) => (
      message.name === '__ably-react__handshake__callback'
      && message.data === handshakeId
      && (!acceptHandshakeIf || acceptHandshakeIf(message))
    ), timeout);

    // publish initiate handshakeId
    channel.publish('__ably-react__handshake__initiate', handshakeId);
    // re-publish handhsake every {interval}
    retryIntervalId = setInterval(() => {
      channel.publish('__ably-react__handshake__initiate', handshakeId);
    }, interval);
    // when the waitForMessagePromise resolves or rejects
    // we will cancel the interval
    waitForMessagePromise?.finally(() => {
      if (retryIntervalId !== null) {
        clearInterval(retryIntervalId);
      }
    });

    waitForMessagePromise.then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  }) as Promise<void> & {
    cancel: () => void;
  };

  promise.cancel = () => {
    canceled = true;
    waitForAttachedPromise.cancel();
    waitForMessagePromise?.cancel();
    if (retryIntervalId !== null) {
      clearInterval(retryIntervalId);
    }
  };

  return promise;
}
