// @README inspired by @ably-labs/react-hooks
/* eslint "prefer-spread": "off" */
import { Types, Realtime } from 'ably';
import {
  useCallback, useContext, useEffect, useMemo, useRef,
} from 'react';
import { AblyContext } from './AblyContext';

export type AblyMessageCallback = (message: Types.Message) => void;
export type ChannelNameAndOptions = { channelName: string; options?: Types.ChannelOptions; };
export type ChannelParameters = string | ChannelNameAndOptions;
export type ChannelAndClient = [
  channel: Types.RealtimeChannelCallbacks,
  message: Realtime,
];

export function useChannel(
  clientName: string,
  channelNameOrNameAndOptions: ChannelParameters,
  callbackOnMessage: AblyMessageCallback
): ChannelAndClient;
export function useChannel(
  clientName: string,
  channelNameOrNameAndOptions: ChannelParameters,
  event: string,
  callbackOnMessage: AblyMessageCallback
): ChannelAndClient;
export function useChannel(
  clientName: string,
  channelNameOrNameAndOptions: ChannelParameters,
  ...channelSubscriptionArguments: any[]
): ChannelAndClient {
  const ablyContext = useContext(AblyContext);
  const ablyClient = ablyContext.clients.get(clientName)?.client ?? null;

  if (!ablyClient) {
    throw new Error(`Ably client not registered before using "useChannel" hook (${clientName})`);
  }

  const channelName = useMemo(() => (
    typeof channelNameOrNameAndOptions === 'string'
      ? channelNameOrNameAndOptions
      : channelNameOrNameAndOptions.channelName
  ), [channelNameOrNameAndOptions]);

  const channel = useMemo(() => (
    typeof channelNameOrNameAndOptions === 'string'
      ? ablyClient.channels.get(channelName)
      : ablyClient.channels.get(channelName, channelNameOrNameAndOptions.options)
  ), [ablyClient, channelName]);

  const onMount = useCallback(async () => {
    await channel.subscribe.apply(channel, channelSubscriptionArguments);
  }, [channel]);
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;

  const onUnmount = useCallback(async () => {
    await channel.unsubscribe.apply(channel, channelSubscriptionArguments);

    setTimeout(async () => {
      // React is very mount/unmount happy, so if we just detatch the channel
      // it's quite likely it will be reattached again by a subsequent onMount calls.
      // To solve this, we set a timer, and if all the listeners have been removed,
      // we know that the component
      // has been removed for good and we can detatch the channel.

      if (channel.listeners.length === 0) {
        await channel.detach();
      }
    }, 2500);
  }, [ablyClient, channel]);
  const onUnmountRef = useRef(onUnmount);
  onUnmountRef.current = onUnmount;

  useEffect(() => {
    onMountRef.current();
    return () => {
      onUnmountRef.current();
    };
  }, [ablyClient, channelName]);

  return useMemo(
    () => ([channel, ablyClient]),
    [channel, ablyClient],
  );
}
