import { Types } from 'ably';
import { useEffect, useState } from 'react';

export function useChannelStatus(channel: Types.RealtimeChannelCallbacks | null) {
  const [status, setStatus] = useState(channel?.state ?? null);

  useEffect(() => {
    setStatus(channel?.state ?? null);
    if (channel) {
      const handleAttached = () => setStatus('attached');
      const handleAttaching = () => setStatus('attaching');
      const handleDetached = () => setStatus('detached');
      const handleDetaching = () => setStatus('detaching');
      const handleFailed = () => setStatus('failed');
      const handleInitialized = () => setStatus('initialized');
      const handleSuspended = () => setStatus('suspended');

      channel.on('attached', handleAttached);
      channel.on('attaching', handleAttaching);
      channel.on('detached', handleDetached);
      channel.on('detaching', handleDetaching);
      channel.on('failed', handleFailed);
      channel.on('initialized', handleInitialized);
      channel.on('suspended', handleSuspended);

      return () => {
        channel.off('attached', handleAttached);
        channel.off('attaching', handleAttaching);
        channel.off('detached', handleDetached);
        channel.off('detaching', handleDetaching);
        channel.off('failed', handleFailed);
        channel.off('initialized', handleInitialized);
        channel.off('suspended', handleSuspended);
      };
    }

    return () => {};
  }, [channel]);

  return status;
}
