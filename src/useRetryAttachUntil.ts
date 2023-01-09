import { Types } from 'ably';
import { useEffect, useRef } from 'react';

export function useRetryAttachUntil(
  channel: Types.RealtimeChannelCallbacks | null,
  retryTimeout: number,
  untilCallback: () => boolean,
  onFail?: (event: Types.ChannelStateChange) => void,
) {
  const reattachTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  useEffect(() => {
    if (!channel) {
      return () => {};
    }

    const failedHandler = (event: Types.ChannelStateChange) => {
      if (untilCallback()) {
        reattachTimeoutIdRef.current = setTimeout(() => {
          channel.attach();
        }, retryTimeout);
      } else {
        onFailRef.current?.(event);
      }
    };

    const attachedOrAttachingHandler = () => {
      if (reattachTimeoutIdRef.current) {
        clearTimeout(reattachTimeoutIdRef.current);
        reattachTimeoutIdRef.current = null;
      }
    };

    channel.on('failed', failedHandler);
    channel.on('attached', attachedOrAttachingHandler);
    channel.on('attaching', attachedOrAttachingHandler);
    return () => {
      channel.off('failed', failedHandler);
      channel.off('attached', attachedOrAttachingHandler);
      channel.off('attaching', attachedOrAttachingHandler);
    };
  }, [channel, retryTimeout, untilCallback]);
}
