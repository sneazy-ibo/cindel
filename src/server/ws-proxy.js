export function handleWSProxy(client, path, config, logger, logProxy) {
  // Extract target URL by removing path prefix
  // '/proxy/wss://example.com:9081/' -> 'wss://example.com:9081/'
  const targetUrl = path.slice(config.path.length + 1);

  // Validate the target URL early. Both ws:// and wss:// are supported.
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
      throw new Error(`Invalid protocol: ${parsed.protocol}`);
    }
  } catch (e) {
    logger.custom('wsProxy', `Invalid WS proxy target: ${e.message}`, 'red');
    client.close(1002, 'Invalid target URL');
    return null;
  }

  // Only mark as proxy once we know the connection is legitimate
  client.data.isProxy = true;

  // Short random ID used to differentiate between connections to the same host.
  const id = Math.random().toString(36).slice(2, 7);
  const tag = `[${id}]`;

  // Build headers - layers applied in order so explicit config always wins:
  // 1. forwardHeaders (client headers, all or selective)
  // 2. config.headers (static overrides)
  // 3. getHeaders (dynamic overrides, highest priority)
  let headers = {};

  if (config.forwardHeaders && client.data.headers) {
    if (config.forwardHeaders === true) {
      headers = { ...client.data.headers };
    } else if (Array.isArray(config.forwardHeaders)) {
      for (const name of config.forwardHeaders) {
        const value = client.data.headers?.[name.toLowerCase()];
        if (value !== undefined) {
          headers[name.toLowerCase()] = value;
        }
      }
    }
  }

  if (config.headers) {
    headers = { ...headers, ...config.headers };
  }

  if (config.getHeaders) {
    headers = { ...headers, ...config.getHeaders(targetUrl, client.data.headers) };
  }

  const wsOptions = { headers };
  if (config.options) {
    Object.assign(wsOptions, config.options);
  }

  let upstream;
  try {
    upstream = new WebSocket(targetUrl, wsOptions);
  } catch (error) {
    logger.custom('wsProxy', `${tag} Failed to create upstream WebSocket: ${error.message}`, 'red');
    client.close(1011, 'Upstream connection failed');
    return;
  }

  client.data.upstream = upstream;

  // Guard against double closing from both sides triggering closeBoth simultaneously.
  let closed = false;
  const closeBoth = () => {
    if (closed) return;
    closed = true;
    clientOpen = false;
    upstreamReady = false;
    try { client.close(); } catch { }
    try { upstream.close(); } catch { }
    if (logProxy) logger.custom('wsProxy', `${tag} Closed ${targetUrl}`, 'gray');
  };

  // Buffer messages sent by the client before upstream has finished connecting.
  // Without this, any messages sent in the "CONNECTING" window are silently dropped,
  // which can cause the game client to time out and retransmit, adding perceived lag.
  const pendingClientMessages = [];
  const MAX_PENDING = 512;

  // Plain JS booleans so both message-path hot loops read closure variables
  // rather than crossing the native boundary on every frame.
  // clientOpen starts true - by the time handleWSProxy is called, the Bun
  // server has already completed the WebSocket upgrade.
  let clientOpen = true;
  let upstreamReady = false;

  const clientMessageHandler = config.onClientMessage ||
    ((message, _client, upstream) => {
      if (logProxy && typeof message === 'string') {
        logger.custom('wsProxy', `${tag} -> ${message.slice(0, 200)}`, 'gray');
      }
      if (upstreamReady) {
        upstream.send(message);
      } else {
        if (pendingClientMessages.length >= MAX_PENDING) {
          pendingClientMessages.shift(); // drop oldest
        }
        pendingClientMessages.push(message);
      }
    });

  const upstreamMessageHandler = config.onUpstreamMessage ||
    ((message, client, _upstream) => {
      if (logProxy && typeof message === 'string') {
        logger.custom('wsProxy', `${tag} <- ${message.slice(0, 200)}`, 'gray');
      }
      if (clientOpen && client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch {
          // Client socket died between the clientOpen check and the send,
          // closeBoth will be called so nothing to do here.
        }
      }
    });

  upstream.onmessage = (event) => {
    upstreamMessageHandler(event.data, client, upstream);
  };

  upstream.onclose = closeBoth;

  upstream.onerror = (event) => {
    const message = event instanceof ErrorEvent ? event.message : 'Connection failed';
    if (logProxy) logger.custom('wsProxy', `${tag} Upstream error: ${message}`, 'red');
    closeBoth();
  };

  upstream.onopen = () => {
    upstreamReady = true;

    if (logProxy) logger.wsProxyConnect(id, targetUrl, headers);

    // Flush any messages that arrived while upstream was still connecting
    for (const msg of pendingClientMessages) {
      upstream.send(msg);
    }
    pendingClientMessages.length = 0;

    if (config.onConnect) {
      config.onConnect(targetUrl);
    }
  };

  return {
    onMessage: (message) => {
      clientMessageHandler(message, client, upstream);
    },
    onClose: closeBoth
  };
}