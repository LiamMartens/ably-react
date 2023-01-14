import { useEffect, useState } from 'react';
import { AblyClients } from './AblyClients';

export function useAblyClient(name = 'default') {
  const [client, setClient] = useState(AblyClients.clients.get(name)?.client ?? null);

  useEffect(() => {
    setClient(AblyClients.clients.get(name)?.client ?? null);
    AblyClients.$e.on('updated', (clients) => {
      setClient(clients.get(name)?.client ?? null);
    });
  }, [name]);

  return client;
}
