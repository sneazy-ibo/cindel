/**
 * HMR client with baked-in file loading, override detection, and cold file handling.
 *
 * @example
 * // Simple setup
 * const client = new HMRClient({
 *   port: 1338,
 *   skip: ['_*\/**'],
 *   cold: ['**\/*.cold.js'],
 *   onFileLoaded: (file) => swapPrototype(file)
 * });
 *
 * @example
 * // With override detection
 * const client = new HMRClient({
 *   port: 1338,
 *   getOverrideTarget: (file, allFiles) => {
 *     const m = file.match(/^x_[^/]+\/overrides\/(.+)$/);
 *     if (!m) return null;
 *     const core = `core/${m[1]}`;
 *     return allFiles?.includes(core) ? core : null;
 *   }
 * });
 */
export class HMRClient {
    /**
     * `options` can be a shorthand or a full config object:
     * - **number**  treated as `{ port: n }`, connects to `ws://localhost:<n>`
     * - **string**  treated as a full WebSocket URL
     * - **object**  full config, see below
     *
     * @param {Object} options - setting options jsdoc to `Object` only for the sake of auto complete.
     * @param {string} [options.wsUrl] - Explicit WebSocket URL. Takes priority over host/port.
     * @param {string} [options.httpUrl] - Explicit HTTP base URL for fetching files. Derived from `wsUrl` if omitted.
     * @param {boolean} [options.watchFiles=true] Server side file watching is enabled by default.
     * @param {string} [options.host='localhost'] - Hostname (used when building from `port`)
     * @param {number} [options.port] - Port number
     * @param {boolean} [options.secure=false] - Use `wss://` and `https://`
     * @param {boolean} [options.autoReconnect=true] - Reconnect on disconnect with exponential backoff.
     * @param {number} [options.reconnectDelay=2000] - Base reconnect delay in ms
     * @param {number} [options.maxReconnectDelay=30000] - Maximum reconnect delay cap in ms
     * @param {string[]} [options.skip] - Glob patterns for files that should never be loaded (e.g. `['_*\/**']`)
     * @param {function(string, string[]): boolean} [options.filterSkip] - Custom skip logic. Receives `(filePath, allFiles)`. Combined with `skip` via OR.
     * @param {string[]} [options.cold] - Glob patterns for files that require a full page reload. Merged with the server's `cold` config on connect. A `cold` event is emitted instead of hot reloading.
     * @param {function(string): boolean} [options.filterCold] - Custom cold file logic. Receives `(filePath)`. Combined with `cold` via OR.
     * @param {function(string, string[]): string|null} [options.getOverrideTarget] - Given a changed file, return the path of the original it replaces, or `null`. Receives `(filePath, allFiles)`. When matched, the original is unloaded before the override loads.
     * @param {function(string): void} [options.onFileLoaded] - Called after each file loads or reloads. Receives `(filePath)`.
     * @param {function(string[]): string[]} [options.sortFiles] - Custom sort for the initial file load order. Default sorts CSS before JS, cold files first.
     */
    constructor(options: {
        wsUrl?: string;
        httpUrl?: string;
        watchFiles?: boolean;
        host?: string;
        port?: number;
        secure?: boolean;
        autoReconnect?: boolean;
        reconnectDelay?: number;
        maxReconnectDelay?: number;
        skip?: string[];
        filterSkip?: (arg0: string, arg1: string[]) => boolean;
        cold?: string[];
        filterCold?: (arg0: string) => boolean;
        getOverrideTarget?: (arg0: string, arg1: string[]) => string | null;
        onFileLoaded?: (arg0: string) => void;
        sortFiles?: (arg0: string[]) => string[];
    });
    wsUrl: any;
    httpUrl: any;
    watchFiles: boolean;
    _autoReconnectDefault: boolean;
    autoReconnect: boolean;
    reconnectDelay: number;
    maxReconnectDelay: number;
    _coldPatterns: string[];
    _filterCold: (arg0: string) => boolean;
    shouldSkipFile: any;
    isColdFile: any;
    allFiles: any[];
    getOverrideTarget: (arg0: string, arg1: string[]) => string | null;
    onFileLoaded: (arg0: string) => void;
    sortFiles: any;
    socket: WebSocket;
    reconnectAttempts: number;
    isConnected: boolean;
    eventHandlers: Map<any, any>;
    _reconnectTimer: NodeJS.Timeout;
    _messageQueue: any[];
    _processingMessages: boolean;
    fileLoader: FileLoader;
    /** @type {Map<string, string>} - Maps override file -> original file */
    overrideMap: Map<string, string>;
    /** @type {Map<string, Set<string>>} - Maps original file -> set of active overrides */
    _reverseOverrideMap: Map<string, Set<string>>;
    logStyles: {
        info: {
            symbol: string;
            color: string;
        };
        success: {
            symbol: string;
            color: string;
        };
        warning: {
            symbol: string;
            color: string;
        };
        error: {
            symbol: string;
            color: string;
        };
        add: {
            symbol: string;
            color: string;
        };
        remove: {
            symbol: string;
            color: string;
        };
        inject: {
            symbol: string;
            color: string;
        };
        disconnect: {
            symbol: string;
            color: string;
        };
        override: {
            symbol: string;
            color: string;
        };
        skip: {
            symbol: string;
            color: string;
        };
        cold: {
            symbol: string;
            color: string;
        };
    };
    defaultSortFiles(files: any): any[];
    makeFilter(patterns: any, callback: any): any;
    log(type: any, message: any): void;
    logInitFileGroup(files: any, overrideMap: any, isColdFile: any): void;
    buildOverrideMap(files: any): any;
    processInitFiles(files: any): Promise<void>;
    handleFileChange(file: any, action: any, serverCold?: boolean): Promise<void>;
    handleFileRemove(file: any): Promise<void>;
    handleMessage(data: any): Promise<void>;
    /**
     * Register an event handler
     * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
     * @param {Function} handler - Event handler function
     * @returns {HMRClient} This client for chaining
     */
    on(event: "init" | "reload" | "add" | "remove" | "cold" | "connect" | "disconnect" | "error", handler: Function): HMRClient;
    /**
     * Register a one-time event handler that auto-removes itself after the first call
     * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
     * @param {Function} handler - Event handler function
     * @returns {HMRClient} This client for chaining
     */
    once(event: "init" | "reload" | "add" | "remove" | "cold" | "connect" | "disconnect" | "error", handler: Function): HMRClient;
    /**
     * Remove a previously registered event handler
     * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
     * @param {Function} handler - The exact handler reference passed to `on()`
     * @returns {HMRClient} This client for chaining
     */
    off(event: "init" | "reload" | "add" | "remove" | "cold" | "connect" | "disconnect" | "error", handler: Function): HMRClient;
    emit(event: any, ...args: any[]): void;
    _enqueueMessage(data: any): void;
    _drainMessageQueue(): Promise<void>;
    /**
     * Connect to the HMR server
     * @returns {Promise<void>}
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the HMR server and clean up
     */
    disconnect(): void;
}
import { FileLoader } from './file-loader.js';
//# sourceMappingURL=hmr-client.d.ts.map