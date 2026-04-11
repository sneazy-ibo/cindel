import { FileLoader } from './file-loader.js';
import { HMR_ACTIONS } from '../shared/constants.js'
import { matchGlob, getFileName, getFilePath, formatTime, resolveConnectionUrls } from './../shared/utils.js';

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
   * @param {boolean} [options.skipOnReconnect=true] - Skip files already present in the page on reconnect, preventing them from being loaded again.
   * @param {string[]} [options.skip] - Glob patterns for files that should never be loaded (e.g. `['_*\/**']`)
   * @param {function(string, string[]): boolean} [options.filterSkip] - Custom skip logic. Receives `(filePath, allFiles)`. Combined with `skip` via OR.
   * @param {string[]} [options.cold] - Glob patterns for files that require a full page reload. Merged with the server's `cold` config on connect. A `cold` event is emitted instead of hot reloading.
   * @param {function(string): boolean} [options.filterCold] - Custom cold file logic. Receives `(filePath)`. Combined with `cold` via OR.
   * @param {function(string, string[]): string|null} [options.getOverrideTarget] - Given a changed file, return the path of the original it replaces, or `null`. Receives `(filePath, allFiles)`. When matched, the original is unloaded before the override loads.
   * @param {function(string): void} [options.onFileLoaded] - Called after each file loads or reloads. Receives `(filePath)`.
   * @param {function(string[]): string[]} [options.sortFiles] - Custom sort for the initial file load order. When provided, replaces `defaultSortFiles` entirely and `loadOrder` is ignored.
   * @param {Array<Function>} [options.loadOrder] - Stages prepended before the built-in sort (CSS-first, cold-first, alphabetical). One argument: return true to load that file first. Two arguments: works like a normal sort callback.
   * @param {boolean | Object} [options.iframe] - Forward files to an iframe via `postMessage` (for Private Network Access restricted environments). Pass `true` for defaults.
   * @param {Window | HTMLIFrameElement} [options.iframe.target] - Target a specific same-origin iframe directly, skipping auto-discovery. Reattachment is not automatic.
   * @param {string} [options.iframe.origin] - The iframe's origin used to validate incoming handshake responses. Defaults to `'*'`.
   * @param {'iframe'|'parent'|'both'} [options.iframe.css='iframe'] - Where CSS files are loaded when `iframe` is set.
   */
  constructor(options) {
    // Extract additional options if object was passed
    const opts = typeof options === 'object' && !Array.isArray(options) ? options : {};

    const wsPath = opts.wsPath || '/hmr';
    const { wsUrl, httpUrl } = resolveConnectionUrls(options, wsPath);
    this.wsUrl = wsUrl;
    this.httpUrl = httpUrl;
    this.watchFiles = true;

    this._autoReconnectDefault = opts.autoReconnect !== false;
    this.autoReconnect = this._autoReconnectDefault;
    this.reconnectDelay = opts.reconnectDelay || 2000;
    this.maxReconnectDelay = opts.maxReconnectDelay || 30000;
    this.skipOnReconnect = opts.skipOnReconnect !== false;

    // Store original cold config so we can merge server patterns on connect
    this._coldPatterns = opts.cold || null;
    this._filterCold = opts.filterCold || null;

    // Create normalized filter functions
    this.shouldSkipFile = this.makeFilter(opts.skip || null, opts.filterSkip || null);
    this.isColdFile = this.makeFilter(this._coldPatterns, this._filterCold);

    // Tracks the current set of watched files (seeded on init, updated on add/remove)
    this.allFiles = [];

    this.getOverrideTarget = opts.getOverrideTarget || null;
    this.onFileLoaded = opts.onFileLoaded || null;
    this.loadOrder = opts.loadOrder || [];
    this.sortFiles = opts.sortFiles || this.defaultSortFiles.bind(this);

    this.socket = null;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this._reconnectTimer = null;

    // Serialized message processing, this prevents concurrent handleMessage calls
    // from racing when two WS messages arrive before the first async chain completes.
    this._messageQueue = [];
    this._processingMessages = false;

    const iframeOpts = opts.iframe === true ? {} : opts.iframe;
    const iframeTarget = iframeOpts?.target
      ? (iframeOpts.target?.contentWindow ?? null)
      : null;

    const iframeOrigin = iframeOpts?.origin ?? '*';

    this._iframeTarget = iframeTarget;
    this._iframeOrigin = iframeOrigin;

    // When true, _waitForStub and _listenForReattach are used to discover
    // and track the iframe target automatically via stub's hmr:ready signal.
    this._stubManaged = !!iframeOpts && !iframeTarget;

    // Stored so the listener can be removed on disconnect
    this._onReattach = null;

    this.fileLoader = new FileLoader(this.httpUrl, {
      iframeTarget,
      iframeOrigin,
      css: iframeOpts?.css ?? 'iframe',
    });

    /** @type {Map<string, string>} - Maps override file -> original file */
    this.overrideMap = new Map();
    /** @type {Map<string, Set<string>>} - Maps original file -> set of active overrides */
    this._reverseOverrideMap = new Map();

    this.logStyles = {
      info: { symbol: 'ℹ', color: '#76fffd' },
      success: { symbol: '▶', color: '#68ff51' },
      warning: { symbol: '⌬', color: '#ff8400' },
      error: { symbol: '✖', color: '#ff0000' },
      add: { symbol: '⊕', color: '#22c55e' },
      remove: { symbol: '⊖', color: '#f87171' },
      inject: { symbol: '⎘', color: '#facc15' },
      disconnect: { symbol: '✦', color: '#ef4444' },
      override: { symbol: '⧫', color: '#ff8400' },
      skip: { symbol: '⊘', color: '#888888' },
      cold: { symbol: '❄', color: '#60a5fa' }
    };
  }

  defaultSortFiles(files) {
    const coldSet = new Set(files.filter(f => this.isColdFile(f)));
    const builtinStages = [
      f => f.endsWith('.css'),
      f => coldSet.has(f),
      (a, b) => a.localeCompare(b),
    ];

    // loadOrder stages run first, built-ins are the fallback
    const stages = [...this.loadOrder, ...builtinStages];

    return [...files].sort((a, b) => {
      for (const stage of stages) {
        const result = stage.length === 2 ? stage(a, b) : stage(b) - stage(a);
        if (result !== 0) return result;
      }
      return 0;
    });
  }

  makeFilter(patterns, callback) {
    // If both provided, combine them with OR logic
    if (patterns && callback) {
      return (file, allFiles) => {
        return matchGlob(file, patterns) || callback(file, allFiles);
      };
    }
    if (patterns) {
      return (file) => matchGlob(file, patterns);
    }
    if (callback) {
      return callback;
    }
    return () => false;
  }

  log(type, message) {
    const { symbol, color } = this.logStyles[type] || this.logStyles.info;
    const time = formatTime();
    console.log(`%c${symbol} [${time}] ${message}`, `color: ${color}; font-weight: bold;`);
  }

  logInitFileGroup(files, overrideMap, isColdFile) {
    if (!files.length) return;

    const overrideCount = files.filter(f => overrideMap.has(f)).length;
    const coldCount = files.filter(f => isColdFile(f)).length;
    const jsCount = files.filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs')).length;
    const cssCount = files.filter(f => f.endsWith('.css')).length;

    const parts = [];
    if (overrideCount) parts.push(`${overrideCount} overridden`);
    if (coldCount) parts.push(`${coldCount} cold`);
    if (cssCount) parts.push(`${jsCount} JS, ${cssCount} CSS`);

    const suffix = parts.length ? ` (${parts.join(', ')})` : '';
    const title = `Loading ${files.length} initial file${files.length !== 1 ? 's' : ''}${suffix}`;

    const { symbol, color } = this.logStyles.inject;
    console.groupCollapsed(
      `%c${symbol} [${formatTime()}] ${title}`,
      `color: ${color}; font-weight: bold;`
    );

    files.forEach(file => {
      const fileName = getFileName(file);
      const filePath = getFilePath(file);
      const isOverride = overrideMap.has(file);
      const isCold = isColdFile(file);

      if (isOverride) {
        const target = getFileName(overrideMap.get(file));
        const targetPath = getFilePath(overrideMap.get(file));
        console.log(
          `%c└─ ${fileName} -> ${target}%c (${filePath} -> ${targetPath})`,
          `color: ${this.logStyles.override.color}; font-weight: bold;`,
          'color: #888888; font-style: italic;'
        );
      } else if (isCold) {
        console.log(
          `%c└─ ${fileName}%c (${filePath})`,
          `color: ${this.logStyles.cold.color}; font-weight: bold;`,
          'color: #888888; font-style: italic;'
        );
      } else {
        console.log(
          `└─ %c${fileName}%c (${filePath})`,
          'color: #ffffff; font-weight: bold;',
          'color: #888888; font-style: italic;'
        );
      }
    });

    console.groupEnd();
  }

  buildOverrideMap(files) {
    this.overrideMap.clear();
    this._reverseOverrideMap.clear();
    const overrideFiles = new Set();
    const originalFiles = new Set();

    if (!this.getOverrideTarget) {
      return files; // No override detection configured
    }

    // First pass: identify overrides and their targets
    for (const file of files) {
      const target = this.getOverrideTarget(file, files);
      if (target) {
        this.overrideMap.set(file, target);
        if (!this._reverseOverrideMap.has(target)) {
          this._reverseOverrideMap.set(target, new Set());
        }
        this._reverseOverrideMap.get(target).add(file);
        overrideFiles.add(file);
        originalFiles.add(target);
      }
    }

    // Return files with originals removed
    return files.filter(f => !originalFiles.has(f));
  }

  async processInitFiles(files) {
    const filtered = [];
    const skipped = [];
    for (const f of files) {
      (this.shouldSkipFile(f, files) ? skipped : filtered).push(f);
    }

    if (skipped.length > 0) {
      console.groupCollapsed(
        `%c${this.logStyles.skip.symbol} [${formatTime()}] Skipped ${skipped.length} file${skipped.length !== 1 ? 's' : ''}`,
        `color: ${this.logStyles.skip.color}; font-weight: bold;`
      );
      skipped.forEach(f => console.log(`  └─ ${getFileName(f)}`));
      console.groupEnd();
    }

    // Skip files that are already present
    let toLoad = filtered;
    if (this.skipOnReconnect) {
      const alreadyLoaded = [];
      toLoad = [];
      for (const f of filtered) {
        const isLoaded = this.fileLoader.versions.has(f) ||
          document.querySelector(`[data-file="${f}"]`);
        (isLoaded ? alreadyLoaded : toLoad).push(f);
      }

      if (alreadyLoaded.length > 0) {
        this.log('info', `Server reconnected - skipping ${alreadyLoaded.length} existing file${alreadyLoaded.length !== 1 ? 's' : ''}`);
      }
    }

    // Build override map and remove original files
    const withOverrides = this.buildOverrideMap(toLoad);

    // Sort files
    const sorted = this.sortFiles(withOverrides);

    // Log what we're loading
    this.logInitFileGroup(sorted, this.overrideMap, this.isColdFile.bind(this));

    // Both CSS and JS are loaded sequentially to preserve order.
    for (const file of sorted) {
      await this.fileLoader.loadFile(file);
      if (this.onFileLoaded) this.onFileLoaded(file);
    }

    this.log('success', `HMR client ready (${sorted.length} files loaded)`);
  }

  async handleFileChange(file, action, serverCold = false) {
    if (this.shouldSkipFile(file, this.allFiles)) {
      this.log('skip', `Skipping ${action}: ${getFileName(file)}`);
      return;
    }

    // If this file is currently overridden, don't load it
    if (this._reverseOverrideMap.has(file)) {
      this.log('skip', `Skipping ${action}: ${getFileName(file)} (overridden)`);
      return;
    }

    if (this.getOverrideTarget) {
      const newTarget = this.getOverrideTarget(file, this.allFiles);

      // If the target changed since last time, tear down the old relationship
      // so _reverseOverrideMap doesn't accumulate stale entries.
      const previousTarget = this.overrideMap.get(file);
      if (previousTarget && previousTarget !== newTarget) {
        const siblings = this._reverseOverrideMap.get(previousTarget);
        if (siblings) {
          siblings.delete(file);
          if (siblings.size === 0) this._reverseOverrideMap.delete(previousTarget);
        }
        this.overrideMap.delete(file);
      }

      if (newTarget) {
        this.log('override', `${getFileName(file)} -> ${getFileName(newTarget)}`);
        await this.fileLoader.removeFile(newTarget);
        this.overrideMap.set(file, newTarget);

        // Keep _reverseOverrideMap in sync for live events, not just init.
        if (!this._reverseOverrideMap.has(newTarget)) {
          this._reverseOverrideMap.set(newTarget, new Set());
        }
        this._reverseOverrideMap.get(newTarget).add(file);
      }
    }

    // Check if cold file but server flag is authoritative
    const isCold = serverCold || this.isColdFile(file);
    if (isCold) {
      this.log('cold', `Cold file changed: ${getFileName(file)}`);
      this.emit('cold', file);
      return;
    }

    const fileName = getFileName(file);
    const filePath = getFilePath(file);
    const actionType = action === HMR_ACTIONS.RELOAD ? 'warning' : 'add';

    this.log(actionType, `HMR ${action}: ${fileName}`);
    console.log(`%c  └─ Path: ${filePath}`, 'color: #888888; font-style: italic;');

    if (action === HMR_ACTIONS.RELOAD) {
      await this.fileLoader.reloadFile(file);
    } else {
      await this.fileLoader.loadFile(file);
    }

    if (this.onFileLoaded) {
      this.onFileLoaded(file);
    }

    this.emit(action, file);
  }

  async handleFileRemove(file) {
    if (this.shouldSkipFile(file, this.allFiles)) {
      this.log('skip', `Skipping remove: ${getFileName(file)}`);
      return;
    }

    const fileName = getFileName(file);
    const filePath = getFilePath(file);

    this.log('remove', `HMR remove: ${fileName}`);
    console.log(`%c  └─ Path: ${filePath}`, 'color: #888888; font-style: italic;');

    // If this file was overriding something, only restore the original
    // if no other overrides are still actively replacing it
    const overriddenFile = this.overrideMap.get(file);
    if (overriddenFile) {
      this.overrideMap.delete(file);

      const remainingOverrides = this._reverseOverrideMap.get(overriddenFile);
      if (remainingOverrides) {
        remainingOverrides.delete(file);
        if (remainingOverrides.size === 0) {
          // No more overrides for this target, safe to restore
          this._reverseOverrideMap.delete(overriddenFile);
          this.log('override', `Restoring: ${getFileName(overriddenFile)}`);

          const originalExists = this.allFiles.includes(overriddenFile);
          if (originalExists) {
            try {
              await this.fileLoader.loadFile(overriddenFile);
            } catch (e) {
              this.log('error', `Failed to restore original: ${getFileName(overriddenFile)} - ${e.message}`);
              // Remove from allFiles since it's clearly gone
              this.allFiles = this.allFiles.filter(f => f !== overriddenFile);
            }
          } else {
            this.log('warning', `Original file no longer tracked, skipping restore: ${getFileName(overriddenFile)}`);
          }
        }
      }
    }

    await this.fileLoader.removeFile(file);
    this.emit(HMR_ACTIONS.REMOVE, file);
  }

  async handleMessage(data) {
    if (data.type === HMR_ACTIONS.INIT) {
      this.emit(HMR_ACTIONS.INIT, data);

      this.watchFiles = data.config?.watchFiles ?? true;
      if (!this.watchFiles) {
        this.log('info', 'Static snapshot mode -> live watching disabled');
      }

      // Merge server cold patterns with any client configured patterns,
      // so that both sources are respected.
      if (data.config?.cold?.length) {
        // Always merge from the original client patterns, not the previously merged ones
        const merged = [...new Set([...(this._coldPatterns || []), ...data.config.cold])];
        this.isColdFile = this.makeFilter(merged, this._filterCold);
      }

      if (data.files && data.files.length > 0) {
        this.allFiles = [...data.files];
        await this.processInitFiles(data.files);
      } else {
        const modeLabel = this.watchFiles ? 'HMR ready' : 'Static snapshot ready';
        this.log('success', `${modeLabel} (0 files loaded)`);
      }
      return;
    }

    const { action, file } = data;
    if (!action || !file) return;

    if (action === HMR_ACTIONS.ADD) {
      this.allFiles = [...this.allFiles, file];
    }

    if (action === HMR_ACTIONS.REMOVE) {
      this.allFiles = this.allFiles.filter(f => f !== file);
    }

    if (action === HMR_ACTIONS.RELOAD || action === HMR_ACTIONS.ADD) {
      await this.handleFileChange(file, action, data.cold ?? false);
    }

    if (action === HMR_ACTIONS.REMOVE) {
      await this.handleFileRemove(file);
    }
  }

  /**
   * Register an event handler
   * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {HMRClient} This client for chaining
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
    return this;
  }

  /**
   * Register a one-time event handler that auto-removes itself after the first call
   * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {HMRClient} This client for chaining
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    wrapper._original = handler;
    return this.on(event, wrapper);
  }

  /**
   * Remove a previously registered event handler
   * @param {'init'|'reload'|'add'|'remove'|'cold'|'connect'|'disconnect'|'error'} event - Event name
   * @param {Function} handler - The exact handler reference passed to `on()`
   * @returns {HMRClient} This client for chaining
   */
  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return this;
    if (!handler) {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
      return this;
    }

    const remaining = handlers.filter(h => h !== handler && h._original !== handler);
    if (remaining.length === handlers.length) return this;

    if (remaining.length === 0) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.set(event, remaining);
    }
    return this;
  }

  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    // Snapshot to prevent mutation issues during emit
    for (const handler of [...handlers]) {
      handler(...args);
    }
  }

  // Push an incoming message onto the serial queue and drain it if not already
  // running. This ensures handleMessage calls never execute concurrently, a
  // rapid pair of change events for the same file would otherwise race between
  // removeFile and loadFile and could leave the DOM in a broken state.
  _enqueueMessage(data) {
    this._messageQueue.push(data);
    if (!this._processingMessages) this._drainMessageQueue();
  }

  async _drainMessageQueue() {
    this._processingMessages = true;
    while (this._messageQueue.length > 0) {
      const data = this._messageQueue.shift();
      try {
        await this.handleMessage(data);
      } catch (e) {
        this.log('error', `Message handling error: ${e.message}`);
      }
    }
    this._processingMessages = false;
  }

  // Wait for stub's hmr:ready signal. Stub fires it proactively on run.
  // Times out after 5s and resolves anyway, a missing stub degrades gracefully.
  _waitForStub() {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        window.removeEventListener('message', onReady);
        this.log('warning', 'Timed out waiting for hmr:ready. Was HMR.stub() called in the iframe?');
        resolve();
      }, 5000);

      const onReady = (e) => {
        let data;
        try { data = JSON.parse(e.data); } catch { return; }
        if (data?.type !== 'hmr:ready') return;
        const originOk = this._iframeOrigin === '*' || e.origin === this._iframeOrigin;
        if (!originOk) return;
        clearTimeout(timer);
        window.removeEventListener('message', onReady);
        if (this._stubManaged) {
          this._iframeTarget = e.source;
          this.fileLoader.iframeTarget = e.source;
        }
        resolve();
      };

      window.addEventListener('message', onReady);
    });
  }

  // Persistent listener for hmr:ready that handles iframe reattachment. If the
  // iframe reloads or is replaced, the stub fires hmr:ready again so we can
  // update the target and re-inject all currently loaded files.
  _listenForReattach() {
    if (this._onReattach) return;

    this._onReattach = async (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      if (data?.type !== 'hmr:ready') return;
      const originOk = this._iframeOrigin === '*' || e.origin === this._iframeOrigin;
      if (!originOk) return;
      // Ignore signals from the window we're already attached to
      if (e.source === this._iframeTarget) return;

      this._iframeTarget = e.source;
      this.fileLoader.iframeTarget = e.source;
      this.log('success', 'HMR reattached to new iframe');

      for (const path of this.sortFiles([...this.fileLoader.versions.keys()])) {
        try {
          await this.fileLoader.loadFile(path);
        } catch (e) {
          this.log('error', `Reattach failed to load ${path}: ${e.message}`);
        }
      }
    };

    window.addEventListener('message', this._onReattach);
  }

  /**
   * Connect to the HMR server
   * @returns {Promise<void>}
   */
  connect() {
    this.autoReconnect = this._autoReconnectDefault;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    // Prevent orphaned sockets if called while already connected or connecting
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      // Guards against onerror and onclose both settling the Promise
      let settled = false;

      try {
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = async () => {
          settled = true;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.log('success', 'HMR connected');
          this.emit('connect');

          this._messageQueue = [];
          // Hold the queue so INIT isn't processed before the stub is ready.
          // Messages arriving during the handshake buffer up and drain once we unblock.
          this._processingMessages = true;

          if (this._iframeTarget || this._stubManaged) {
            await this._waitForStub();
            if (this._stubManaged) this._listenForReattach();
          }

          this._processingMessages = false;
          if (this._messageQueue.length > 0) this._drainMessageQueue();
          resolve();
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.socket = null;
          this.emit('disconnect');

          // Reconnect on any disconnect, including failed initial attempts
          if (this.autoReconnect) {
            const delay = Math.min(
              this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts++),
              this.maxReconnectDelay
            );

            const msg = settled
              ? `HMR disconnected, retrying in ${(delay / 1000).toFixed(1)}s...`
              : `HMR connection failed, retrying in ${(delay / 1000).toFixed(1)}s...`;

            this.log('disconnect', msg);
            this._reconnectTimer = setTimeout(() => {
              this.connect().catch((error) => {
                this.log('error', `Reconnect attempt failed: ${error.message}`);
                this.emit('error', error);
              });
            }, delay);
          } else {
            if (settled) this.log('disconnect', 'HMR disconnected');
          }
        };

        this.socket.onerror = (error) => {
          const errorMsg = error.message || 'Connection failed';
          this.log('error', `HMR error: ${errorMsg}`);
          this.emit('error', error);
          if (!settled) { settled = true; reject(error); }
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._enqueueMessage(data);
          } catch (e) {
            this.log('error', `Failed to parse message: ${e.message}`);
          }
        };

      } catch (error) {
        this.log('error', `Failed to create WebSocket: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the HMR server and clean up
   */
  disconnect() {
    this.autoReconnect = false;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = null;

    if (this._onReattach) {
      window.removeEventListener('message', this._onReattach);
      this._onReattach = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}