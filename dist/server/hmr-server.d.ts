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
    constructor(options?: {
        port?: number;
        bindHost?: string;
        watchFiles?: boolean;
        wsPath?: string;
        watch?: string[];
        ignore?: string[];
        cold?: string[];
        extensions?: string[];
        onConnect?: (arg0: WebSocket, arg1: {
            files: string[];
            config: any;
        }) => void;
        onDisconnect?: (arg0: WebSocket) => void;
        logFiles?: boolean;
        logProxy?: boolean | {
            cors?: boolean;
            ws?: boolean;
        };
        static?: string;
        indexPath?: string;
        injectLoader?: string;
        corsProxy?: boolean | string | CORSProxyConfig;
        wsProxy?: WSProxyConfig;
        getFiles?: () => string[];
        filesEndpoint?: boolean | string;
        configEndpoint?: boolean | string;
        tls?: TLSConfig;
        handleSignals?: boolean | string[];
    });
    port: number;
    bindHost: string;
    wsPath: string;
    watchFiles: boolean;
    watchPaths: string[];
    ignorePaths: string[];
    coldPatterns: string[];
    extensions: string[];
    onConnectCallback: any;
    onDisconnectCallback: (arg0: WebSocket) => void;
    logFiles: boolean;
    logProxy: {
        cors: boolean;
        ws: boolean;
    };
    logger: Logger;
    watcher: FileWatcher;
    server: Bun.Server<undefined>;
    /** @type {Set<WebSocket>} */
    clients: Set<WebSocket>;
    staticDir: string;
    getFilesCallback: () => string[];
    filesEndpoint: any;
    configEndpoint: any;
    corsProxy: {
        path: any;
        getHeaders?: undefined;
        transformResponse?: undefined;
    } | {
        path: any;
        getHeaders: (arg0: string, arg1: Request) => any;
        transformResponse: (arg0: Response) => Promise<Response>;
    };
    wsProxy: {
        path: any;
        /**
         * - Static headers sent to every upstream connection.
         */
        headers?: any;
        /**
         * - Forward incoming client headers to the upstream connection.
         * `true` forwards all headers; an array of header name strings forwards only the listed ones (case-insensitive).
         * Applied before `headers` and `getHeaders`, so explicit values always win.
         */
        forwardHeaders?: boolean | string[];
        /**
         * - Return dynamic headers per connection. Receives `(targetUrl, incomingHeaders)`. Merged on top of `headers`.
         */
        getHeaders?: (arg0: string, arg1: any) => any;
        /**
         * - Called when the upstream connection opens. Receives `targetUrl`.
         */
        onConnect?: (arg0: string) => void;
        /**
         * - Intercept messages from the browser before forwarding upstream. Receives `(message, clientSocket, upstreamSocket)`.
         */
        onClientMessage?: (arg0: any, arg1: WebSocket, arg2: WebSocket) => void;
        /**
         * - Intercept messages from upstream before forwarding to the browser. Receives `(message, clientSocket, upstreamSocket)`.
         */
        onUpstreamMessage?: (arg0: any, arg1: WebSocket, arg2: WebSocket) => void;
        /**
         * - Extra options passed to the upstream `WebSocket` constructor (e.g. `options: { perMessageDeflate: true }`)
         */
        options?: any;
    };
    loaderPath: string;
    injectLoader: boolean;
    indexPath: string;
    tls: TLSConfig;
    handleSignals: boolean | string[];
    isColdFile(file: any): any;
    /**
     * Send a message to a single HMR client
     * @param {WebSocket} client - The client to send to
     * @param {Object} payload - The payload to send, will be JSON serialized
     * @returns {boolean} Whether the message was sent successfully
     */
    send(client: WebSocket, payload: any): boolean;
    defaultOnConnect(ws: any, data: any): void;
    getConfig(): {
        port: number;
        bindHost: string;
        wsPath: string;
        watch: string[];
        ignore: string[];
        cold: string[];
        watchFiles: boolean;
        extensions: string[];
        static: string;
        corsProxy: {
            path: any;
            getHeaders?: undefined;
            transformResponse?: undefined;
        } | {
            path: any;
            getHeaders: (arg0: string, arg1: Request) => any;
            transformResponse: (arg0: Response) => Promise<Response>;
        };
        wsProxy: {
            path: any;
            /**
             * - Static headers sent to every upstream connection.
             */
            headers?: any;
            /**
             * - Forward incoming client headers to the upstream connection.
             * `true` forwards all headers; an array of header name strings forwards only the listed ones (case-insensitive).
             * Applied before `headers` and `getHeaders`, so explicit values always win.
             */
            forwardHeaders?: boolean | string[];
            /**
             * - Return dynamic headers per connection. Receives `(targetUrl, incomingHeaders)`. Merged on top of `headers`.
             */
            getHeaders?: (arg0: string, arg1: any) => any;
            /**
             * - Called when the upstream connection opens. Receives `targetUrl`.
             */
            onConnect?: (arg0: string) => void;
            /**
             * - Intercept messages from the browser before forwarding upstream. Receives `(message, clientSocket, upstreamSocket)`.
             */
            onClientMessage?: (arg0: any, arg1: WebSocket, arg2: WebSocket) => void;
            /**
             * - Intercept messages from upstream before forwarding to the browser. Receives `(message, clientSocket, upstreamSocket)`.
             */
            onUpstreamMessage?: (arg0: any, arg1: WebSocket, arg2: WebSocket) => void;
            /**
             * - Extra options passed to the upstream `WebSocket` constructor (e.g. `options: { perMessageDeflate: true }`)
             */
            options?: any;
        };
        wsProxyHeaders: any;
        wsProxyPrefix: any;
        filesEndpoint: any;
        injectLoader: boolean;
        loaderPath: string;
        indexPath: string;
        tls: TLSConfig;
        handleSignals: boolean | string[];
        logProxy: {
            cors: boolean;
            ws: boolean;
        };
        logFiles: boolean;
    };
    setupWatcher(): Promise<void>;
    staticFiles: string[];
    broadcast(action: any, file: any, extra?: {}): void;
    handleHMRConnection(client: any): void;
    handleHMRDisconnect(client: any): void;
    getWebSocketConfig(): {
        open: (client: any) => void;
        message: (client: any, message: any) => void;
        close: (client: any) => void;
    };
    /**
     * Start the HMR server
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stop the HMR server and clean up resources
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
}
export type TLSConfig = {
    /**
     * - Path to the private key file (PEM)
     */
    key: string;
    /**
     * - Path to the certificate file (PEM)
     */
    cert: string;
    /**
     * - Path to a CA certificate file for mutual TLS
     */
    ca?: string;
    /**
     * - Passphrase for an encrypted private key
     */
    passphrase?: string;
};
export type CORSProxyConfig = {
    /**
     * - Path prefix or regex that triggers the proxy
     */
    path?: string | RegExp;
    /**
     * - Return custom headers for the outbound request. Receives `(targetUrl, incomingRequest)`.
     */
    getHeaders?: (arg0: string, arg1: Request) => any;
    /**
     * - Transform the upstream response before returning it to the client
     */
    transformResponse?: (arg0: Response) => Promise<Response>;
};
export type WSProxyConfig = {
    /**
     * - Path prefix that triggers the proxy. The remainder of the path must be the full upstream `ws://` or `wss://` URL.
     */
    path?: string;
    /**
     * - Static headers sent to every upstream connection.
     */
    headers?: any;
    /**
     * - Forward incoming client headers to the upstream connection.
     * `true` forwards all headers; an array of header name strings forwards only the listed ones (case-insensitive).
     * Applied before `headers` and `getHeaders`, so explicit values always win.
     */
    forwardHeaders?: boolean | string[];
    /**
     * - Return dynamic headers per connection. Receives `(targetUrl, incomingHeaders)`. Merged on top of `headers`.
     */
    getHeaders?: (arg0: string, arg1: any) => any;
    /**
     * - Called when the upstream connection opens. Receives `targetUrl`.
     */
    onConnect?: (arg0: string) => void;
    /**
     * - Intercept messages from the browser before forwarding upstream. Receives `(message, clientSocket, upstreamSocket)`.
     */
    onClientMessage?: (arg0: any, arg1: WebSocket, arg2: WebSocket) => void;
    /**
     * - Intercept messages from upstream before forwarding to the browser. Receives `(message, clientSocket, upstreamSocket)`.
     */
    onUpstreamMessage?: (arg0: any, arg1: WebSocket, arg2: WebSocket) => void;
    /**
     * - Extra options passed to the upstream `WebSocket` constructor (e.g. `options: { perMessageDeflate: true }`)
     */
    options?: any;
};
import { Logger } from '../shared/logger.js';
import { FileWatcher } from './file-watcher.js';
//# sourceMappingURL=hmr-server.d.ts.map