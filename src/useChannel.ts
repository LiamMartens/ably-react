import { Realtime, Types } from 'ably';
import { useEffect, useState } from 'react';

export function useChannel(client: Realtime | null, channelName: string) {
  const [channel, setChannel] = useState<Types.RealtimeChannelCallbacks | null>(null);

  useEffect(() => {
    // this should only run if
    // - the client changes
    // - the channelName changes
    // detach previous channel if any
    if (channel) channel.detach();
    if (client) {
      // create new channel
      setChannel(client.channels.get(channelName));
    }
  }, [client, channelName]);

  return channel;
}
