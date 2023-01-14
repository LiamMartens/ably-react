import Ably from 'ably';
import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { nanoid } from 'nanoid';
import { useAblyClientStatus } from './useAblyClientStatus';
import { AblyClients } from './AblyClients';
import { useClientId } from './useClientId';

type UseAblyOptions = {
  skip?: boolean
  clientId?: string
  autoConnect?: boolean
  name?: string
  authCallback?: (data: Ably.Types.TokenParams) => Promise<
  Ably.Types.TokenDetails | Ably.Types.TokenRequest | string | null
  >
  clientOptions?: Ably.Types.ClientOptions
};

export function useAbly(options: UseAblyOptions) {
  const hookId = useRef(nanoid(8));
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const status = useAblyClientStatus(client);
  const clientId = useClientId(options.clientId ?? null);

  const authCallbackRef = useRef(options.authCallback);
  authCallbackRef.current = options.authCallback;

  useEffect(() => {
    if (options.skip) {
      return () => {};
    }

    const ablyClient = AblyClients.registerClient(options.name ?? 'default', hookId.current, () => (
      new Ably.Realtime({
        closeOnUnload: true,
        autoConnect: options.autoConnect ?? true,
        ...(authCallbackRef.current ? {
          authCallback: (data, callback) => {
            authCallbackRef.current!(data)
              .then((result) => callback(null, result))
              .catch((err) => callback(err, null));
          },
        } : {}),
        ...options.clientOptions,
      })
    ));
    setClient(ablyClient);

    return () => {
      // @README client will be auto-closed if all locks are released
      AblyClients.releaseClient(options.name ?? 'default', hookId.current);
    };
  }, [options.skip, options.name, options.clientId, options.clientOptions]);

  return useMemo(() => ({
    status,
    client,
    clientId,
  } as {
    status: typeof status
    client: typeof client
    clientId: typeof clientId
  }), [
    status,
    client,
    clientId,
  ]);
}
