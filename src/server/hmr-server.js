import chalk from 'chalk';
import { FileWatcher } from './file-watcher.js';
import { Logger } from '../shared/logger.js';
import { handleRoutes } from './routes.js';
import { handleWSProxy } from './ws-proxy.js';
import {
  matchGlob,
  getBrowserFromUA,
  normalizeProxyPath,
  resolveEndpoint
} from '../shared/utils.js';
import {
  DEFAULT_PORT,
  WATCHABLE_EXTENSIONS,
  DEFAULT_CORS_PROXY_PATH,
  DEFAULT_WS_PROXY_PATH,
  HMR_ACTIONS,
  DEFAULT_FILES_ENDPOINT,
  DEFAULT_CONFIG_ENDPOINT,
  CORS_HEADERS
} from "../shared/constants.js";

/**
 * @typedef {Object} TLSConfig
 * @property {string} key - Path to the private key file (PEM)
 * @property {string} cert - Path to the certificate file (PEM)
 * @property {string} [ca] - Path to a CA certificate file for mutual TLS
 * @property {string} [passphrase] - Passphrase for an encrypted private key
 */

/**
 * @typedef {Object} CORSProxyConfig
 * @property {string|RegExp} [path='/proxy'] - Path prefix or regex that triggers the proxy
 * @property {function(string, Request): Object} [getHeaders] - Return custom headers for the outbound request. Receives `(targetUrl, incomingRequest)`.
 * @property {function(Response): Promise<Response>} [transformResponse] - Transform the upstream response before returning it to the client
 */

/**
 * @typedef {Object} WSProxyConfig
 * @property {string} [path='/proxy'] - Path prefix that triggers the proxy. The remainder of the path must be the full upstream `ws://` or `wss://` URL.
 * @property {Object} [headers] - Static headers sent to every upstream connection.
 * @property {boolean|string[]} [forwardHeaders] - Forward incoming client headers to the upstream connection.
 *   `true` forwards all headers; an array of header name strings forwards only the listed ones (case-insensitive).
 *   Applied before `headers` and `getHeaders`, so explicit values always win.
 * @property {function(string, Object): Object} [getHeaders] - Return dynamic headers per connection. Receives `(targetUrl, incomingHeaders)`. Merged on top of `headers`.
 * @property {function(string): void} [onConnect] - Called when the upstream connection opens. Receives `targetUrl`.
 * @property {function(*, WebSocket, WebSocket): void} [onClientMessage] - Intercept messages from the browser before forwarding upstream. Receives `(message, clientSocket, upstreamSocket)`.
 * @property {function(*, WebSocket, WebSocket): void} [onUpstreamMessage] - Intercept messages from upstream before forwarding to the browser. Receives `(message, clientSocket, upstreamSocket)`.
 * @property {Object} [options] - Extra options passed to the upstream `WebSocket` constructor (e.g. `options: { perMessageDeflate: true }`)
 */

/**
 * HMR server with optional HTTP features (static files, CORS proxy, WebSocket proxy).
 * All features are opt-in via configuration.
 * 
 * @example
 * // Minimal HMR only
 * const hmr = new HMRServer({
 *   port: 1338,
 *   watch: ['src']
 * });
 * 
 * @example
 * // HMR + Development Server
 * const dev = new HMRServer({
 *   port: 1338,
 *   watch: ['src'],
 *   static: '.',
 *   injectLoader: 'loader.js'
 * });
 * 
 * @example
 * // HMR + Proxies
 * const proxy = new HMRServer({
 *   port: 1338,
 *   watch: ['src'],
 *   corsProxy: { path: '/proxy' },
 *   wsProxy: {
 *     path: '/proxy',
 *     headers: {
 *       Origin: 'https://www.example.com',
 *       'User-Agent': 'Mozilla/5.0'
 *     }
 *   }
 * });
 * 
 * @example
 * // Full Stack
 * const server = new HMRServer({
 *   port: 1338,
 *   watch: ['src'],
 *   static: '.',
 *   corsProxy: true,
 *   wsProxy: {
 *     path: '/proxy',
 *     headers: {
 *       Origin: 'https://www.example.com'
 *     },
 *     options: { perMessageDeflate: true }
 *   },
 *   injectLoader: 'loader.js',
 *   tls: {
 *     key: 'localhost-key.pem',
 *     cert: 'localhost.pem'
 *   }
 * });
 */
export class HMRServer {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.port=1338] - Port to listen on.
   * @param {string} [options.bindHost='localhost'] - Network interface to bind to. Use `'0.0.0.0'` to listen on all interfaces and expose the server on your local network.
   * @param {boolean} [options.watchFiles=true] - Use chokidar to watch files. Set to `false` to scan once at startup for initial file loading only.
   * @param {string} [options.wsPath='/hmr'] - WebSocket upgrade path. Clients must connect to this path.
   * @param {string[]} [options.watch=[]] - Paths or glob patterns to watch (e.g. `['src', 'lib']`)
   * @param {string[]} [options.ignore] - Glob patterns to ignore.
   * @param {string[]} [options.cold] - Glob patterns for files that require a full page reload instead of HMR (e.g. `['**\/*.config.js']`)
   * @param {string[]} [options.extensions] - File extensions to watch. Defaults to `.js .cjs .mjs .css`
   * @param {function(WebSocket, {files: string[], config: Object}): void} [options.onConnect] - Called when an HMR client connects. Defaults to sending an `init` message with the file list.
   * @param {function(WebSocket): void} [options.onDisconnect] - Called when an HMR client disconnects
   * @param {boolean} [options.logFiles=false] - Log every watched file during watcher initialization
   * @param {boolean|{cors?: boolean, ws?: boolean}} [options.logProxy=false] - Log proxy traffic.
   *   `true` enables both. Pass `{ cors: true, ws: false }` to enable only one.
   * @param {string} [options.static] - Directory to serve static files from (e.g. `'.'` or `'public'`), Defaults to `'.'` for serving from project root.
   * @param {string} [options.indexPath='index.html'] - Path to index.html, used as the `/` fallback and for loader injection
   * @param {string} [options.injectLoader] - Path to a script that will be injected into index.html via `<script>` before `</head>`
   * @param {boolean|string|CORSProxyConfig} [options.corsProxy] - Enable the HTTP CORS proxy. `true` mounts at `/proxy`. A string uses that as the path directly e.g. `'/cors'`.
   * @param {WSProxyConfig} [options.wsProxy] - Proxy WebSocket connections to an upstream server
   * @param {function(): string[]} [options.getFiles] - Override the file list sent to connecting clients. Called on every new connection.
   * @param {boolean|string} [options.filesEndpoint] - Expose the watched file list as JSON. `true` mounts at `/files`, a string uses that as the path.
   * @param {boolean|string} [options.configEndpoint] - Expose the server config as JSON. `true` mounts at `/config`, a string uses that as the path.
   * @param {TLSConfig} [options.tls] - Enable HTTPS/WSS
   * @param {boolean|string[]} [options.handleSignals=true] - Register signal handlers that call `stop()` and exit cleanly.
   *    Default `yes` adds `SIGINT`/`SIGTERM`; `false` disables; or pass an array (e.g. `['SIGINT','SIGTERM','SIGHUP']`).
   */
  constructor(options = {}) {
    // --- HMR Core
    this.port = options.port || DEFAULT_PORT;
    this.bindHost = options.bindHost ?? 'localhost';
    this.wsPath = options.wsPath || '/hmr'
    this.watchFiles = options.watchFiles ?? true;
    this.watchPaths = options.watch || ['src'];
    this.ignorePaths = options.ignore || [];
    this.coldPatterns = options.cold || [];
    this.extensions = (options.extensions || WATCHABLE_EXTENSIONS).map(e => e.toLowerCase());
    this.onConnectCallback = options.onConnect || this.defaultOnConnect.bind(this);
    this.onDisconnectCallback = options.onDisconnect || (() => { });
    this.logFiles = options.logFiles || false;

    // Normalize logProxy to { cors, ws } so callers can enable individually.
    const lp = options.logProxy;
    if (lp === true) {
      this.logProxy = { cors: true, ws: true };
    } else if (lp && typeof lp === 'object') {
      this.logProxy = { cors: !!lp.cors, ws: !!lp.ws };
    } else {
      this.logProxy = { cors: false, ws: false };
    }

    this.logger = new Logger();
    this.watcher = null;
    this.server = null;
    /** @type {Set<WebSocket>} */
    this.clients = new Set();

    // --- HTTP features
    this.staticDir = options.static === false ? null : (options.static ?? '.');
    this.getFilesCallback = options.getFiles || null;
    this.filesEndpoint = resolveEndpoint(options.filesEndpoint, DEFAULT_FILES_ENDPOINT);
    this.configEndpoint = resolveEndpoint(options.configEndpoint, DEFAULT_CONFIG_ENDPOINT);

    // Normalize CORS proxy configuration - supports `true` for defaults or a config object with overrides
    const proxyConfig = options.corsProxy;
    if (proxyConfig === true) {
      this.corsProxy = { path: DEFAULT_CORS_PROXY_PATH };
    } else if (typeof proxyConfig === 'string') {
      this.corsProxy = { path: normalizeProxyPath(proxyConfig, DEFAULT_CORS_PROXY_PATH) };
    } else if (proxyConfig && typeof proxyConfig === 'object') {
      const { path: proxyPath, getHeaders, transformResponse, ...rest } = proxyConfig;

      if (Object.keys(rest).length > 0) {
        this.logger.warning(`corsProxy received unknown options: ${Object.keys(rest).join(', ')}, these will be ignored`);
      }

      this.corsProxy = {
        path: normalizeProxyPath(proxyPath, DEFAULT_CORS_PROXY_PATH),
        getHeaders: getHeaders || null,
        transformResponse: transformResponse || null
      };
    } else {
      this.corsProxy = null;
    }

    // WebSocket Proxy
    if (options.wsProxy) {
      this.wsProxy = {
        ...options.wsProxy,
        path: normalizeProxyPath(options.wsProxy.path, DEFAULT_WS_PROXY_PATH)
      };
    } else {
      this.wsProxy = null;
    }

    // Loader injection
    if (options.injectLoader !== undefined && options.injectLoader !== null) {
      if (typeof options.injectLoader !== 'string' || options.injectLoader.trim().length === 0) {
        throw new Error('injectLoader must be a non-empty string path');
      }
      this.loaderPath = options.injectLoader.trim();
    } else {
      this.loaderPath = null;
    }
    this.injectLoader = this.loaderPath !== null;
    this.indexPath = options.indexPath || 'index.html';

    // TLS/HTTPS
    this.tls = options.tls || null;

    // Process signals to handle for graceful shutdown
    const DEFAULT_SIGNALS = ['SIGINT', 'SIGTERM'];
    this.handleSignals = options.handleSignals === false
      ? false
      : Array.isArray(options.handleSignals)
        ? options.handleSignals
        : DEFAULT_SIGNALS;
  }

  isColdFile(file) {
    if (this.coldPatterns.length === 0) return false;
    return matchGlob(file, this.coldPatterns);
  }

  /**
   * Send a message to a single HMR client
   * @param {WebSocket} client - The client to send to
   * @param {Object} payload - The payload to send, will be JSON serialized
   * @returns {boolean} Whether the message was sent successfully
   */
  send(client, payload) {
    try {
      client.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      this.logger.error(`Error sending to client: ${error.message}`);
      this.handleHMRDisconnect(client);
      return false;
    }
  }

  defaultOnConnect(ws, data) {
    this.send(ws, {
      type: HMR_ACTIONS.INIT,
      files: data.files,
      config: data.config
    });
  }

  getConfig() {
    return {
      port: this.port,
      bindHost: this.bindHost,
      wsPath: this.wsPath,
      watch: this.watchPaths,
      ignore: this.ignorePaths,
      cold: this.coldPatterns,
      watchFiles: this.watchFiles,
      extensions: this.extensions,
      static: this.staticDir,
      corsProxy: this.corsProxy,
      wsProxy: this.wsProxy,
      wsProxyHeaders: this.wsProxy?.headers || null,
      wsProxyPrefix: this.wsProxy?.path || null,
      filesEndpoint: this.filesEndpoint,
      injectLoader: this.injectLoader,
      loaderPath: this.loaderPath,
      indexPath: this.indexPath,
      tls: this.tls,
      handleSignals: this.handleSignals,
      logProxy: this.logProxy,
      logFiles: this.logFiles
    };
  }

  async setupWatcher() {
    if (!this.watchFiles) {
      console.log(chalk.yellow(`\n${this.logger.symbols.config} WatchFiles disabled - globbing: ${this.watchPaths.join(', ')}`));
      const files = [];
      const extPatterns = this.extensions.map(ext => `**/*${ext}`);
      for (const pattern of this.watchPaths) {
        const globPattern = pattern.endsWith('*') ? pattern : `${pattern}/**/*`;
        const glob = new Bun.Glob(globPattern);
        for await (const file of glob.scan({ onlyFiles: true })) {
          if (matchGlob(file, extPatterns) && !matchGlob(file, this.ignorePaths)) {
            files.push(file);
          }
        }
      }
      console.log(chalk.cyan(`${this.logger.symbols.watch} Found ${files.length} file${files.length !== 1 ? 's' : ''} (static snapshot, no watcher running)\n`));
      this.staticFiles = files;
      this.getFilesCallback = () => this.staticFiles;
      return;
    }
    const watcherOptions = {
      logger: this.logger,
      paths: this.watchPaths,
      ignore: this.ignorePaths,
      logFiles: this.logFiles,
      onChange: (path) => {
        if (this.isColdFile(path)) {
          this.logger.file('change', path, 'cyanBright', 'Cold file');
          this.broadcast(HMR_ACTIONS.RELOAD, path, { cold: true });
          return;
        }
        this.logger.file('change', path, 'yellow', 'File changed');
        this.broadcast(HMR_ACTIONS.RELOAD, path);
      },
      onAdd: (path) => {
        this.logger.file('add', path, 'greenBright', 'File added');
        this.broadcast(HMR_ACTIONS.ADD, path);
      },
      onRemove: (path) => {
        this.logger.file('remove', path, 'red', 'File removed');
        this.broadcast(HMR_ACTIONS.REMOVE, path);
      },
      onAddDir: (path) => {
        this.logger.file('dirAdd', path, 'cyan', 'Directory added');
      },
      onRemoveDir: (path) => {
        this.logger.file('dirRemove', path, 'red', 'Directory removed');
      },
      onReady: () => {
        // Ready callback is handled in file-watcher
      }
    };

    if (this.extensions) {
      watcherOptions.extensions = this.extensions;
    }

    this.watcher = new FileWatcher(watcherOptions);
    await this.watcher.start();
  }

  broadcast(action, file, extra = {}) {
    const message = JSON.stringify({ action, file, ...extra });
    const dead = [];
    const sentCount = this.clients.size;

    for (const client of this.clients) {
      try {
        client.send(message);
      } catch (error) {
        this.logger.error(`Error sending to client: ${error.message}`);
        dead.push(client);
      }
    }

    for (const client of dead) {
      this.handleHMRDisconnect(client);
    }

    // Only send logs if there are multiple concurrent connections.
    if (sentCount > 1) {
      console.log(chalk.gray(`  └─ Broadcasted to ${sentCount} client${sentCount !== 1 ? 's' : ''}`));
    }
  }

  handleHMRConnection(client) {
    this.clients.add(client);
    const browser = getBrowserFromUA(client.data?.headers?.['user-agent']);
    this.logger.custom(
      'connect',
      `HMR client connected (${this.clients.size} total) - ${browser}`,
      'green'
    );

    const files = this.getFilesCallback
      ? this.getFilesCallback()
      : (this.watcher ? this.watcher.getWatchedFiles() : []);
    const data = {
      files,
      config: this.getConfig()
    };
    this.onConnectCallback(client, data);
  }

  handleHMRDisconnect(client) {
    if (!this.clients.has(client)) return;
    this.clients.delete(client);
    this.logger.custom(
      'disconnect',
      `HMR client disconnected (${this.clients.size} remaining)`,
      'red'
    );
    this.onDisconnectCallback(client);
  }

  getWebSocketConfig() {
    return {
      open: (client) => {
        const path = client.data?.path || '/';

        if (this.wsProxy && path.startsWith(this.wsProxy.path + '/')) {
          const proxyHandlers = handleWSProxy(client, path, this.wsProxy, this.logger, this.logProxy.ws);
          // Store handlers so we can use them in message/close
          client.data.proxyHandlers = proxyHandlers;
          return;
        }

        this.handleHMRConnection(client);
      },

      message: (client, message) => {
        if (client.data?.isProxy) {
          client.data.proxyHandlers?.onMessage(message);
          return;
        }

        this.logger.debug(`Received HMR message: ${message}`);
      },

      close: (client) => {
        if (client.data?.isProxy) {
          client.data.proxyHandlers?.onClose();
          return;
        }

        this.handleHMRDisconnect(client);
      }
    };
  }

  /**
   * Start the HMR server
   * @returns {Promise<void>}
   */
  async start() {
    // Validate loader path exists before injection
    if (this.loaderPath) {
      const loaderFile = Bun.file(this.loaderPath);
      if (!(await loaderFile.exists())) {
        this.injectLoader = false;
      }
    }

    // Load TLS files if configured
    let tlsConfig = null;
    if (this.tls) {
      try {
        tlsConfig = {
          key: await Bun.file(this.tls.key).text(),
          cert: await Bun.file(this.tls.cert).text(),
        };

        if (this.tls.ca) {
          tlsConfig.ca = await Bun.file(this.tls.ca).text();
        }
        if (this.tls.passphrase) {
          tlsConfig.passphrase = this.tls.passphrase;
        }
      } catch (error) {
        this.logger.error(`Failed to load TLS files: ${error.message}`);
        throw error;
      }
    }

    const httpProtocol = tlsConfig ? 'https' : 'http';
    const wsProtocol = tlsConfig ? 'wss' : 'ws';

    this.logger.banner('HMR Server', {
      ...this.getConfig(),
      httpServer: !!(this.staticDir || this.corsProxy),
      websocket: true,
      protocol: httpProtocol,
      wsProtocol: wsProtocol,
    });

    await this.setupWatcher();

    const serverConfig = {
      port: this.port,
      hostname: this.bindHost,

      fetch: async (req, server) => {
        const url = new URL(req.url);
        const isHMRPath = url.pathname === this.wsPath;
        const isWSProxyPath = this.wsProxy && url.pathname.startsWith(this.wsProxy.path + '/');

        if (isHMRPath || isWSProxyPath) {
          const upgraded = server.upgrade(req, {
            data: {
              path: url.pathname,
              headers: Object.fromEntries(req.headers.entries())
            }
          });
          if (upgraded) return;
        }

        const response = await handleRoutes(req, this);

        // Add CORS headers to all HTTP responses
        const headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      },

      websocket: this.getWebSocketConfig()
    };

    if (tlsConfig) {
      serverConfig.tls = tlsConfig;
    }

    this.server = Bun.serve(serverConfig);

    if (this.handleSignals) {
      const shutdown = () => this.stop().then(() => process.exit(0));
      for (const signal of this.handleSignals) {
        process.on(signal, shutdown);
      }
    }
  }

  /**
   * Stop the HMR server and clean up resources
   * @returns {Promise<void>}
   */
  async stop() {
    this.logger.shutdown();

    if (this.server) {
      // stop(true) closes all active connections immediately
      this.server.stop(true);
    }

    if (this.watcher) {
      await this.watcher.stop();
    }

    // Clear stale references so the Set doesn't hold onto dead WebSocket
    // objects if the server is restarted in the same process.
    this.clients.clear();
  }
}