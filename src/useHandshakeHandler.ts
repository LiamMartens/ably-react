import { Types } from 'ably';
import { useEffect } from 'react';
import { waitForAttached } from './utils';

export function useHandshakeHandler(channel: Types.RealtimeChannelCallbacks | null) {
  useEffect(() => {
    if (channel) {
      const handler = (message: Types.Message) => {
        if (message.name === '__ably-react__handshake__initiate') {
          channel.publish('__ably-react__handshake__callback', message.data);
        }
      };
      const promise = waitForAttached(channel);
      promise.then(() => {
        channel.subscribe(handler);
      });

      return () => {
        promise.cancel();
        channel.unsubscribe(handler);
      };
    }

    return () => {};
  }, [channel]);
}
