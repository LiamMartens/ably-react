import { Types } from 'ably';
import { nanoid } from 'nanoid';
import { waitForAttached } from './waitForAttached';
import { waitForMessage } from './waitForMessage';

export async function waitForHandshake(
  channel: Types.RealtimeChannelCallbacks,
  interval = 1000,
  timeout = 0,
  acceptHandshakeIf?: (message: Types.Message) => boolean,
) {
  const handshakeId = nanoid();
  // wait until the channel is attached (if not already)
  await waitForAttached(channel, timeout);
  // create a waitForMessage promise which will wait for the handshake callback
  // with the same handshakeId
  const waitForMessagePromise = waitForMessage(channel, (message) => (
    message.name === '__ably-react__handshake__callback'
    && message.data === handshakeId
    && (!acceptHandshakeIf || acceptHandshakeIf(message))
  ), timeout);
  // publish initiate handshakeId
  channel.publish('__ably-react__handshake__initiate', handshakeId);
  // re-publish handhsake every {interval}
  const intervalId = setInterval(() => {
    channel.publish('__ably-react__handshake__initiate', handshakeId);
  }, interval);
  // when the waitForMessagePromise resolves or rejects
  // we will cancel the interval
  waitForMessagePromise.finally(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  });
  // let's return the waitForMessagePromise (which can also be canceled)
  return waitForMessagePromise;
}
