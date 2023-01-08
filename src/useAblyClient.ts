import { useContext, useEffect, useState } from 'react';
import { AblyContext } from './AblyContext';

export function useAblyClient(name = 'default') {
  const context = useContext(AblyContext);
  const [client, setClient] = useState(context.clients.get(name)?.client ?? null);

  useEffect(() => {
    setClient(context.clients.get(name)?.client ?? null);
    context.$e.on('updated', (clients) => {
      setClient(clients.get(name)?.client ?? null);
    });
  }, [name, context.$e]);

  return client;
}
