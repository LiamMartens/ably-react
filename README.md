# ably-react
**UNOFFICIAL**  
Opinionated React library for using Ably channels and clients.
This library can handle multiple clients in a single page/app.

## Getting started
To use this library, you will need to wrap your application with the `AblyContextProvider`.

```jsx
import { AblyContextProvider } from 'ably-react'

function App() {
  return (
    <AblyContextProvider>
      <MyComponent />
    </AblyContextProvider>
  )
}
```

## Available hooks
### useAbly
This hook registers and uses a realtime Ably client.
You can pass a name to the `useAbly` hook to register multiple clients.

This hook can be used any number of times. Each hook will register a lock on the client.
If all locks disappear the client will be destroyed and disconnected.

```jsx
import { useAbly } from 'ably-react';

function App() {
  const ably = useAbly({
    // OPTIONAL: whether to skip client initialization for now.
    // useful when waiting for authentication
    skip: false,
    // OPTIONAL: can be used to identify the client
    clientId: 'user-id',
    // OPTIONAL [default: true]: whether to automatically connect the client
    autoConnect: true,
    // OPTIONAL [default: "default"]: the name to register the client under
    // the library allows for multiple clients (named)
    name: 'default',
    // OPTIONAL: Callback used to authenticate. This callback is a promise as opposed.
    authCallback: async (data) => {
      return fetchToken();
    },
    // OPTIONAL: Any other options to pass through to the client
    clientOptions: {},
  });
}
```

### useAblyClient
This hook simply gets a client from the context by name (`default` by default).
It does not register a lock on the client and simply returns the raw `Ably.Realtime` client.

```js
const ablyClient = useAblyClient('default')
```

### useAblyClientStatus
This hook simply gets a the client status from the context by name (`default` by default)
As with the `useAblyClient` hook, this also does not register a lock on the client and simply returns the client status.

```js
const ablyClientStatus = useAblyClientStatus('default')
```

### useChannel
This hook simply gets a channel reference.

```js
const ably = useAbly()
const channel = useChannel(ably.client, 'my-channel')
```

### useChannelStatus
This hook will track and return the status of a channel.

```js
const ably = useAbly()
const channel = useChannel(ably.client, 'my-channel')
const status = useChannelStatus(channel)
```

### useIsClientPresent
This hook will keep track of whether a specific client is present. This is useful for peer to peer like communication.

```js
const ably = useAbly()
const channel = useChannel(ably.client, 'my-channel')
const isClientPresent = useIsClientPresent(channel, 'client-id', (error) => {
  // do something on error
});
```

### usePresent
This hook will announce it's presence on a channel (and remove it if not rendered).

```js
const ably = useAbly()
const channel = useChannel(ably.client, 'my-channel')
usePresent(channel)
```

### useRetryAttachUntil
This hook will retry attaching a channel until the callback returns `false`.
This is useful for recovering `failed` channel states.

```js
const ably = useAbly()
const channel = useChannel(ably.client, 'my-channel')
useRetryAttachUntil(channel, 1000, (retryCount, event) => retryCount > 3, (event) => {
  // do something on failure
});
```

### useHandshakeHandler
This hook should be used with the `waitForHandshake` utility (see below). This hook simply handles responding to a handshake request. (should only be rendered once per channel).

```js
const ably = useAbly()
const channel = useChannel(ably.client, 'my-channel')
useHandshakeHandler(channel);
```

## Utilities
### waitForAttached
This utility returns a promise which waits for a channel to be attached (or rejects on timeout if specified).

```js
await waitForAttached(channel, 1000); // if timeout is omitted, the promise will never reject
```

### waitForMessage
This utility returns a promise which waits for a specific message from a channel (or rejects on timeout if specified).]

```js
await waitForMessage(channel, (message) => message.name === 'ping', 1000); // if timeout is omitted, the promise will never reject
```

### waitForHandshake
This utility returns a promise which will send a handshake request (and retry per interval), until the handshake is accepted by another client.

```js
await waitForHandshake(channel, 1000 /* retry interval */, 1000); // if timeout is omitted, the promise will never reject
```
