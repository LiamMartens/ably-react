import { Types } from 'ably';
import { useSyncExternalStore } from 'use-sync-external-store';

function subscribeToAllStateChanges(channel: Types.RealtimeChannelCallbacks | null) {
  return (handler: () => void) => {
    channel?.on('attached', handler);
    channel?.on('attaching', handler);
    channel?.on('detached', handler);
    channel?.on('detaching', handler);
    channel?.on('failed', handler);
    channel?.on('initialized', handler);
    channel?.on('suspended', handler);

    return () => {
      channel?.off('attached', handler);
      channel?.off('attaching', handler);
      channel?.off('detached', handler);
      channel?.off('detaching', handler);
      channel?.off('failed', handler);
      channel?.off('initialized', handler);
      channel?.off('suspended', handler);
    };
  };
}

export function useChannelStatus(channel: Types.RealtimeChannelCallbacks | null) {
  const status = useSyncExternalStore(
    (handler) => subscribeToAllStateChanges(channel)(handler),
    () => channel?.state ?? null,
    () => null,
  );

  return status;
}
