## ![Banner](cindel-banner.png)

> Hot module replacement server and client with file watching, static file serving, CORS proxy and WebSocket proxy support

[![npm version](https://img.shields.io/npm/v/cindel.svg)](https://www.npmjs.com/package/cindel)
[![license](https://img.shields.io/npm/l/cindel.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/cindel)](https://bundlephobia.com/package/cindel)

---

## Features

**HMR & File Watching**

- Instant push driven HMR over WebSocket on file change
- Atomic CSS hot swap (no flash of unstyled content), script execution, and ES module reload
- Glob pattern support for watch, ignore, and cold file configuration
- Cold file patterns that can trigger a full page reload instead of HMR
- Override detection to map replacement files onto their originals

**Server**

- HTTP CORS proxy with configurable header injection
- WebSocket proxy with header forwarding and message interception
- Static file server and automatic `index.html` loader injection
- TLS/HTTPS + WSS support
- `/files` endpoint exposing the live watched file list as JSON

**Client**

- Exponential backoff with automatic reconnect
- No runtime dependencies, so it works in any modern browser
- Event system with `on`, `once`, and `off` for connect, disconnect, reload, add, remove, etc.
- IIFE build compatible with userscript managers (Tampermonkey, Greasemonkey) via `@require`

---

## Requirements

| Runtime | Version  |
| ------- | -------- |
| Bun     | >= 1.0.0 |

The server uses Bun's native `Bun.serve`, `Bun.file` and `Bun.Glob` APIs and is not compatible with Node.js. The browser client has no runtime dependencies and works in any modern browser.

> Note that only the changed file itself is re-executed on reload, changes do not propagate up the ES module import chain. TypeScript is not directly supported for the same reason.

---

## Installation

```bash
bun add cindel
```

---

## Quick Start

```js
// server.js
import { HMRServer } from "cindel/server";

const server = new HMRServer({
  port: 1338,
  watch: ["src"],
});

await server.start();
```

```js
// browser - requires a bundler
import { HMRClient } from "cindel/client";

const client = new HMRClient({ port: 1338 });
await client.connect();
```

Or load it directly from a CDN with no bundler:

```html
<script src="https://cdn.jsdelivr.net/npm/cindel"></script>
<script>
  const client = new HMR.HMRClient({ port: 1338 });
  client.connect();
</script>
```

Another way with dynamic importing:

```js
(async () => {
  const { HMRClient } =
    await import("https://cdn.jsdelivr.net/npm/cindel/dist/client.js");
  const client = new HMRClient({ port: 1338 });
  await client.connect();
})();
```

You can even load it through a user script on any domain:

```js
// ==UserScript==
// @name         Cindel loader
// @version      1.0
// @description  Instead of making multiple scripts file you just inject them all locally
// @match        https://example.com/*
// @require      https://cdn.jsdelivr.net/npm/cindel
// @grant        none
// ==/UserScript==

(async () => {
  const client = new HMR.HMRClient({
    port: 1338,
    secure: true,
  });

  await client.connect();
})();
```

---

## Server

### `new HMRServer(options)`

| Option           | Type                                          | Default              | Description                                                                                     |
| ---------------- | --------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `port`           | `number`                                      | `1338`               | Port to listen on                                                                               |
| `bindHost`       | `string`                                      | `'localhost'`        | Network interface to bind to. Use `'0.0.0.0'` to expose the server on your local network        |
| `watchFiles`     | `boolean`                                     | `true`               | Disable chokidar and do a one-time file scan at startup instead                                 |
| `wsPath`         | `string`                                      | `'/hmr'`             | WebSocket upgrade path                                                                          |
| `watch`          | `string[]`                                    | `['src']`            | Paths or glob patterns to watch                                                                 |
| `ignore`         | `string[]`                                    | `[]`                 | Glob patterns to ignore                                                                         |
| `cold`           | `string[]`                                    | `[]`                 | Patterns for files that trigger a full page reload                                              |
| `extensions`     | `string[]`                                    | `.js .cjs .mjs .css` | File extensions to watch                                                                        |
| `static`         | `string \| false`                             | `'.'`                | Directory to serve static files from. Pass `false` to disable static serving                    |
| `indexPath`      | `string`                                      | `'index.html'`       | Path to `index.html`                                                                            |
| `injectLoader`   | `string`                                      |                      | Script path injected into `index.html` before `</head>`                                         |
| `corsProxy`      | `boolean \| string\| CORSProxyConfig`         |                      | Enable the HTTP CORS proxy                                                                      |
| `wsProxy`        | `WSProxyConfig`                               |                      | Proxy WebSocket connections to an upstream server                                               |
| `filesEndpoint`  | `boolean \| string`                           | `'/files'`           | Expose the watched file list as JSON. `true` mounts at `/files`                                 |
| `configEndpoint` | `boolean \| string`                           | `'/config'`          | Expose the server config as JSON. `false` to disable                                            |
| `getFiles`       | `() => string[]`                              |                      | Override the file list sent to connecting clients                                               |
| `onConnect`      | `(client, data) => void`                      |                      | Called when an HMR client connects                                                              |
| `onDisconnect`   | `(client) => void`                            |                      | Called when an HMR client disconnects                                                           |
| `logFiles`       | `boolean`                                     | `false`              | Log every watched file during startup                                                           |
| `logProxy`       | `boolean \| { cors?: boolean, ws?: boolean }` | `false`              | Log proxy traffic                                                                               |
| `tls`            | `TLSConfig`                                   |                      | Enable HTTPS / WSS                                                                              |
| `handleSignals`  | `boolean \| string[]`                         | `true`               | Register signal handlers for clean shutdown. false to opt out, or pass an array of signal names |

### Methods

```ts
server.start(): Promise<void>
server.stop(): Promise<void>
server.send(client: WebSocket, payload: Object): boolean
server.broadcast(action: string, file: string, extra?: Object): void
server.getConfig(): Object
```

---

### CORS Proxy

Enabling `corsProxy` mounts an HTTP proxy on the dev server. The browser hits a local URL and the server forwards the request upstream, injecting CORS headers onto the response. This means no browser extensions, no separate proxy process.

```js
corsProxy: {
  path: '/proxy',  // default, can also be a RegExp

  // Customize outbound headers per request
  getHeaders: (targetUrl, incomingRequest) => ({
    'Authorization': `Bearer ${getToken()}`,
    'User-Agent': 'Mozilla/5.0',
    'X-Forwarded-For': incomingRequest.headers.get('x-real-ip'),
  }),

  // Intercept and rewrite the upstream response before it reaches the browser
  transformResponse: async (response) => {
    const json = await response.json();
    return new Response(JSON.stringify(patch(json)), response);
  },
}
```

```js
// Usage from the browser
const res = await fetch(
  "http://localhost:1338/proxy/https://api.example.com/data",
);
```

---

### WebSocket Proxy

`wsProxy` tunnels WebSocket connections from the browser through the dev server to an upstream host. Useful for connecting to game servers, remote APIs, or any WS service that would otherwise be blocked by CORS or mixed-content rules.

```js
wsProxy: {
  path: '/proxy',

  // Static headers sent on every upstream connection
  headers: {
    Origin: 'https://www.example.com',
    'User-Agent': 'Mozilla/5.0',
  },

  // Forward select client headers upstream (or pass `true` to forward all)
  forwardHeaders: ['cookie', 'authorization'],

  // Dynamic headers per connection
  getHeaders: (targetUrl, clientHeaders) => ({
    'X-Session': resolveSession(clientHeaders['cookie']),
  }),

  // Intercept messages in either direction
  onClientMessage: (message, clientSocket, upstreamSocket) => {
    const data = JSON.parse(message);
    if (data.type === 'PING') return; // drop client pings
    upstreamSocket.send(message);
  },
  onUpstreamMessage: (message, clientSocket, upstreamSocket) => {
    clientSocket.send(transform(message));
  },

  onConnect: (targetUrl) => console.log('Proxy connected to', targetUrl),

  // Extra options forwarded to the upstream WebSocket constructor
  options: { perMessageDeflate: true },
}
```

```js
// Usage from the browser -- the full upstream URL goes after the path prefix
const ws = new WebSocket(
  "ws://localhost:1338/proxy/wss://game.example.com:9081/",
);
```

---

### Static Server and Loader Injection

Setting `static` serves a directory over HTTP. Setting `injectLoader` inserts a `<script>` tag for the given file into `index.html` at request time, so you never have to edit the HTML manually.

```js
new HMRServer({
  port: 1338,
  watch: ["src"],
  static: ".",
  indexPath: "index.html",
  injectLoader: "src/loader.mjs", // automatically injected before </head>
});
```

`.mjs` loader files are injected with `type="module"`. All static responses include `Cache-Control: no-cache` headers so the browser never serves stale files during development.

---

### TLS

Pass `tls` to switch the server to HTTPS and WSS. The client's `secure` option or a `wss://` URL flips the client to match.

```js
new HMRServer({
  port: 1338,
  watch: ["src"],
  tls: {
    key: "localhost-key.pem",
    cert: "localhost.pem",
    ca: "ca.pem", // optional, for mutual TLS
    passphrase: "secret", // optional, for encrypted keys
  },
});
```

```js
new HMRClient({ port: 1338, secure: true });
```

---

### Local Network Sharing

Set `bindHost: '0.0.0.0'` to expose the server on all network interfaces. Any device on the same network can then connect using your machine's local IP with no extra configuration needed. The injected loader URL is derived automatically from the `Host` header of each incoming request, so local devices get `localhost` and remote devices get whatever address they used to reach the server.

```js
new HMRServer({
  port: 1338,
  bindHost: "0.0.0.0",
  watch: ["core"],
  injectLoader: "loader.mjs",
  tls: {
    key: "localhost-key.pem",
    cert: "localhost.pem",
  },
});
```

This also works with domains, if you're running on a VPS with a domain pointed at it, devices anywhere can connect to it.

Here is how you can find your local IP that other clients would need to connect to your hmr server:

**Mac:**

```bash
ipconfig getifaddr $(route get default | grep interface | awk '{print $2}')
```

**Linux:**

```bash
ip route get 1 | awk '{print $7; exit}'
```

**Windows:**

```
ipconfig | findstr /i "IPv4"
```

> **Firewall rules**: only needed if your OS blocks incoming connections on your chosen port. Replace `1338` with your actual port.
>
> **Windows** (run as admin):
>
> ```
> netsh advfirewall firewall add rule name="Cindel HMR" dir=in action=allow protocol=TCP localport=1338
> ```
>
> **Linux with ufw:**
>
> ```bash
> sudo ufw allow 1338/tcp
> ```
>
> **Linux with firewalld:**
>
> ```bash
> sudo firewall-cmd --add-port=1338/tcp --permanent && sudo firewall-cmd --reload
> ```
>
> Mac does not require a firewall rule, it works out of the box.

---

### Signal Handling

By default cindel registers `SIGINT` and `SIGTERM` handlers so Ctrl+C and process
managers like Docker, PM2, and systemd all shut down cleanly without leaving the
chokidar watcher or Bun server hanging.

```js
// Default: SIGINT + SIGTERM
new HMRServer({
  port: 1338,
  watch: ["src"],
});

// Add SIGHUP for terminal-close and Nodemon compat
new HMRServer({
  port: 1338,
  watch: ["src"],
  handleSignals: ["SIGINT", "SIGTERM", "SIGHUP"],
});

// Opt out entirely and manage shutdown yourself
const server = new HMRServer({
  port: 1338,
  watch: ["src"],
  handleSignals: false,
});
process.on("SIGINT", () => server.stop().then(() => process.exit(0)));
```

---

## Client

### `new HMRClient(options)`

`options` can be shorthand:

- **`number`** treated as `{ port: n }`, connects to `ws://localhost:<n>`
- **`string`** treated as a full WebSocket URL
- **`object`** full config, see below

| Option              | Type                                 | Default                   | Description                                                                                      |
| ------------------- | ------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `port`              | `number`                             |                           | Port number                                                                                      |
| `host`              | `string`                             | `'localhost'`             | Hostname                                                                                         |
| `secure`            | `boolean`                            | `false`                   | Use `wss://` and `https://`                                                                      |
| `wsUrl`             | `string`                             |                           | Explicit WebSocket URL, overrides host/port                                                      |
| `httpUrl`           | `string`                             |                           | Explicit HTTP base URL for file fetching                                                         |
| `wsPath`            | `string`                             | `'/hmr'`                  | WebSocket path                                                                                   |
| `autoReconnect`     | `boolean`                            | `true`                    | Reconnect on disconnect with exponential backoff                                                 |
| `reconnectDelay`    | `number`                             | `2000`                    | Base reconnect delay in ms                                                                       |
| `maxReconnectDelay` | `number`                             | `30000`                   | Maximum reconnect delay cap in ms                                                                |
| `skipOnReconnect`   | `boolean`                            | `true`                    | Skip files already loaded in the page when the server reconnects                                 |
| `skip`              | `string[]`                           |                           | Glob patterns for files to never load                                                            |
| `filterSkip`        | `(file, allFiles) => boolean`        |                           | Custom skip logic, OR'd with `skip`                                                              |
| `cold`              | `string[]`                           |                           | Glob patterns that trigger a full page reload. Merged with the server's `cold` config on connect |
| `filterCold`        | `(file) => boolean`                  |                           | Custom cold logic, OR'd with `cold`                                                              |
| `getOverrideTarget` | `(file, allFiles) => string \| null` |                           | Map an override file to the original it replaces                                                 |
| `onFileLoaded`      | `(file) => void`                     |                           | Called after each file is loaded or reloaded                                                     |
| `sortFiles`         | `(files) => string[]`                | CSS before JS, cold first | Custom sort for the initial load order                                                           |

### Methods

```ts
client.connect(): Promise<void>
client.disconnect(): void
client.on(event, handler): HMRClient     // chainable
client.once(event, handler): HMRClient   // chainable
client.off(event, handler?): HMRClient   // chainable
```

---

### Events

Events fire throughout the connection lifecycle and for every file action. All event methods are chainable.

```js
client
  .on("connect", () => {
    console.log("HMR connected");
  })
  .on("disconnect", () => {
    showBanner("Dev server offline, reconnecting...");
  })
  .on("init", ({ files, config }) => {
    console.log(`Loaded ${files.length} files`);
    console.log("Server cold patterns:", config.cold);
  })
  .on("reload", ({ file }) => {
    console.log(`Hot-reloaded: ${file}`);
    applyChanges(file);
  })
  .on("add", ({ file }) => {
    console.log(`New file available: ${file}`);
  })
  .on("remove", ({ file }) => {
    console.log(`File removed: ${file}`);
    cleanupForFile(file);
  })
  .on("cold", (file) => {
    console.log(`Cold file changed: ${file} -> forcing hard reload`);
    window.location.reload();
  })
  .on("error", (err) => {
    console.error("HMR error:", err);
  });
```

| Event        | Payload             | Description                            |
| ------------ | ------------------- | -------------------------------------- |
| `connect`    |                     | WebSocket connection established       |
| `disconnect` |                     | WebSocket disconnected                 |
| `init`       | `{ files, config }` | Server sent the initial file list      |
| `reload`     | `{ file }`          | A file was changed and hot-reloaded    |
| `add`        | `{ file }`          | A new file was detected                |
| `remove`     | `{ file }`          | A file was removed                     |
| `cold`       | `file: string`      | A cold file changed                    |
| `error`      | `Error`             | A connection or message error occurred |

---

### Skip and Cold Filters

`skip` prevents files from ever being loaded by the client. `cold` marks files that need a full page reload rather than a hot swap. Both options accept glob patterns, a custom filter function, or both combined via OR logic.

> **Note:** Glob patterns are always relative to the project root, not the watched directory.

```js
new HMRClient({
  port: 1338,

  // Never load files matching these patterns
  skip: ["**/*.test.js", "_*/**"],

  // Custom skip logic is context aware, it receives the full file list
  filterSkip: (file, allFiles) => {
    return allFiles.includes(file.replace(".override.js", ".js"));
  },

  // These files can't be hot-swapped, they need a full reload
  cold: ["**/*.cold.js", "src/bootstrap.js"],

  // Custom cold logic
  filterCold: (file) => file.includes("/vendor/"),
});
```

---

### Override Detection

Override detection lets you maintain a parallel directory of replacement files that shadow originals without modifying them. When an override changes, the client unloads the original before loading the override.

```js
new HMRClient({
  port: 1338,

  // x_mypatch/overrides/core/game.js shadows core/game.js
  getOverrideTarget: (file, allFiles) => {
    const match = file.match(/^x_[^/]+\/overrides\/(.+)$/);
    if (!match) return null;
    const original = match[1];
    return allFiles.includes(original) ? original : null;
  },
});

new HMRClient({
  port: 1338,

  // any file named `override.<original>` shadows the original
  // e.g. override.utils.js -> utils.js
  getOverrideTarget: (file, allFiles) => {
    const name = file.split("/").pop();
    const match = name.match(/^override\.(.+)$/);
    if (!match) return null;

    const target = file.replace(name, match[1]);
    return allFiles?.includes(target) ? target : null;
  },
});
```

---

## Exports

| Import path                           | Environment | Description          |
| ------------------------------------- | ----------- | -------------------- |
| `cindel` or `cindel/server`           | Node / Bun  | `HMRServer`          |
| `cindel/client`                       | Browser ESM | `HMRClient`          |
| `https://cdn.jsdelivr.net/npm/cindel` | Browser CDN | Exposes `window.HMR` |

---

## License

GPL-3.0-or-later (c) [sneazy-ibo](https://github.com/sneazy-ibo)
