// src/server/file-watcher.js
import chokidar from "chokidar";
import chalk from "chalk";
import path from "path";

// src/shared/utils.js
import picomatch from "picomatch";
var matcherCache = /* @__PURE__ */ new Map();
function matchGlob(file, patterns) {
  return patterns.some((pattern) => {
    if (!matcherCache.has(pattern)) matcherCache.set(pattern, picomatch(pattern));
    return matcherCache.get(pattern)(file);
  });
}
function formatTime() {
  return (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function getBrowserFromUA(userAgent) {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) return "Safari";
  if (userAgent.includes("Edge/")) return "Edge";
  if (userAgent.includes("Opera/") || userAgent.includes("OPR/")) return "Opera";
  return "Unknown";
}
function getFileName(path3) {
  return path3.split("/").pop();
}
function getFilePath(path3) {
  const parts = path3.split("/");
  parts.pop();
  return parts.join("/") || ".";
}
function normalizeUrl(url) {
  return url.endsWith("/") ? url : url + "/";
}
function normalizeProxyPath(path3, defaultPath) {
  return (path3 || defaultPath).replace(/^(?!\/)/, "/").replace(/\/+$/, "");
}
function resolveEndpoint(value, defaultPath) {
  if (!value) return null;
  if (value === true) return defaultPath;
  return value.startsWith("/") ? value : `/${value}`;
}
function wsUrlToHttpUrl(wsUrl) {
  const u = new URL(wsUrl);
  return `${u.protocol === "wss:" ? "https" : "http"}://${u.host}/`;
}
function httpUrlToWsUrl(httpUrl, wsPath) {
  const u = new URL(httpUrl);
  return `${u.protocol === "https:" ? "wss" : "ws"}://${u.host}${wsPath}`;
}
function resolveConnectionUrls(options, wsPath = "/hmr") {
  if (typeof options === "string") {
    return { wsUrl: options, httpUrl: wsUrlToHttpUrl(options) };
  }
  if (typeof options === "number") {
    options = { port: options };
  }
  if (typeof options !== "object" || options === null) {
    throw new Error("Options must be a string, number, or object");
  }
  if (options.wsUrl && options.httpUrl) {
    return { wsUrl: options.wsUrl, httpUrl: normalizeUrl(options.httpUrl) };
  }
  if (options.wsUrl) {
    return { wsUrl: options.wsUrl, httpUrl: wsUrlToHttpUrl(options.wsUrl) };
  }
  if (options.httpUrl) {
    const httpUrl = normalizeUrl(options.httpUrl);
    return { wsUrl: httpUrlToWsUrl(httpUrl, wsPath), httpUrl };
  }
  if (options.port) {
    const host = options.host || "localhost";
    const secure = options.secure || false;
    const wsProtocol = secure ? "wss" : "ws";
    const httpProtocol = secure ? "https" : "http";
    const wsUrl = `${wsProtocol}://${host}:${options.port}${wsPath}`;
    const httpUrl = normalizeUrl(`${httpProtocol}://${host}:${options.port}`);
    return { wsUrl, httpUrl };
  }
  throw new Error("Must provide wsUrl, httpUrl, port, or host+port");
}

// src/shared/constants.js
var DEFAULT_PORT = 1338;
var WATCHABLE_EXTENSIONS = [".js", ".cjs", ".mjs", ".css"];
var DEFAULT_FILES_ENDPOINT = "/files";
var DEFAULT_CONFIG_ENDPOINT = "/config";
var DEFAULT_CORS_PROXY_PATH = "/proxy";
var DEFAULT_WS_PROXY_PATH = "/proxy";
var WATCHER_CONFIG = {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 50,
    pollInterval: 10
  },
  usePolling: false,
  alwaysStat: true,
  atomic: false
};
var HMR_ACTIONS = {
  RELOAD: "reload",
  ADD: "add",
  REMOVE: "remove",
  INIT: "init"
};

// src/server/file-watcher.js
var FileWatcher = class {
  constructor(options) {
    this.paths = options.paths || [];
    this.ignorePatterns = options.ignore || [];
    this.extensions = options.extensions || [];
    this.onChange = options.onChange || (() => {
    });
    this.onAdd = options.onAdd || (() => {
    });
    this.onRemove = options.onRemove || (() => {
    });
    this.onAddDir = options.onAddDir || (() => {
    });
    this.onRemoveDir = options.onRemoveDir || (() => {
    });
    this.onReady = options.onReady || (() => {
    });
    this.logFiles = options.logFiles || false;
    this.logger = options.logger;
    this.watcher = null;
    this._watchedFiles = /* @__PURE__ */ new Set();
    this.isInitializing = true;
    this.loggedFiles = /* @__PURE__ */ new Set();
  }
  shouldIgnore(filePath, stats) {
    const normalized = this.normalizePath(filePath);
    if (stats && stats.isDirectory()) {
      return matchGlob(normalized, this.ignorePatterns);
    }
    if (matchGlob(normalized, this.ignorePatterns)) {
      this.logFile(filePath, true, "ignored pattern");
      return true;
    }
    if (stats && stats.isFile() && !this.isWatchableFile(normalized, this.extensions)) {
      this.logFile(filePath, true, "non-watchable extension");
      return true;
    }
    if (stats && stats.isFile()) {
      this.logFile(filePath, false);
    }
    return false;
  }
  normalizePath(filePath) {
    return path.relative(".", filePath).replace(/\\/g, "/");
  }
  isWatchableFile(filePath, extensions) {
    const ext = path.extname(filePath).toLowerCase();
    return extensions.includes(ext);
  }
  logFile(filePath, ignored, reason = "") {
    if (!this.logFiles || !this.isInitializing) return;
    const normalized = this.normalizePath(filePath);
    if (this.loggedFiles.has(normalized)) return;
    this.loggedFiles.add(normalized);
    this.logger.logInitFile(normalized, ignored, reason);
  }
  getWatchedFiles() {
    return Array.from(this._watchedFiles);
  }
  logWatchedDirectories() {
    if (!this.logFiles || !this.watcher) return;
    const watched = this.watcher.getWatched();
    const watchRoots = this.paths.map((p) => this.normalizePath(p));
    const relevantDirs = /* @__PURE__ */ new Set();
    for (const [dir, files] of Object.entries(watched)) {
      const normalized = this.normalizePath(dir);
      const isWithinWatchRoot = watchRoots.some(
        (root) => normalized === root || normalized.startsWith(root + "/")
      );
      if (!isWithinWatchRoot || normalized === ".") continue;
      const hasWatchableFiles = files.some((file) => {
        const fullPath = `${dir}/${file}`.replace(/\\/g, "/");
        const normalizedFile = this.normalizePath(fullPath);
        return this.isWatchableFile(normalizedFile, this.extensions) && !matchGlob(normalizedFile, this.ignorePatterns);
      });
      if (hasWatchableFiles) {
        relevantDirs.add(normalized);
        for (const root of watchRoots) {
          if (normalized.startsWith(root + "/")) {
            const parts = normalized.substring(root.length + 1).split("/");
            let ancestor = root;
            for (const part of parts.slice(0, -1)) {
              ancestor = `${ancestor}/${part}`;
              relevantDirs.add(ancestor);
            }
            break;
          }
        }
      }
    }
    const sortedDirs = Array.from(relevantDirs).sort();
    if (sortedDirs.length === 0) return;
    console.log(chalk.cyan(`
${this.logger.symbols.watch} Watching directories:`));
    sortedDirs.forEach((dir) => {
      console.log(chalk.green(`  ${this.logger.symbols.success} ${dir}`));
    });
  }
  async start() {
    if (this.watcher) {
      this.logger.warning("Watcher already started");
      return;
    }
    if (this.paths.length === 0) {
      this.logger.warning("No paths to watch");
      return;
    }
    this.logger.watcherStart(this.paths);
    this.isInitializing = true;
    this.watcher = chokidar.watch(this.paths, {
      ...WATCHER_CONFIG,
      ignored: (filePath, stats) => this.shouldIgnore(filePath, stats)
    });
    this.watcher.on("change", (filePath) => {
      const normalized = this.normalizePath(filePath);
      this.onChange(normalized);
    }).on("add", (filePath) => {
      const normalized = this.normalizePath(filePath);
      this._watchedFiles.add(normalized);
      this.onAdd(normalized);
    }).on("unlink", (filePath) => {
      const normalized = this.normalizePath(filePath);
      this._watchedFiles.delete(normalized);
      this.onRemove(normalized);
    }).on("addDir", (dirPath) => {
      const normalized = this.normalizePath(dirPath);
      this.onAddDir(normalized);
    }).on("unlinkDir", (dirPath) => {
      const normalized = this.normalizePath(dirPath);
      this.onRemoveDir(normalized);
    }).on("error", (error) => {
      this.logger.error(`Watcher error: ${error.message}`);
    }).on("ready", () => {
      this.isInitializing = false;
      this.loggedFiles.clear();
      const watched = this.watcher.getWatched();
      const watchRoots = this.paths.map((p) => this.normalizePath(p));
      let actualFileCount = 0;
      let actualDirCount = 0;
      for (const [dir, files] of Object.entries(watched)) {
        const normalized = this.normalizePath(dir);
        const isWithinWatchRoot = watchRoots.some(
          (root) => normalized === root || normalized.startsWith(root + "/")
        );
        if (!isWithinWatchRoot || normalized === ".") continue;
        let hasWatchableFiles = false;
        for (const file of files) {
          const fullPath = `${dir}/${file}`.replace(/\\/g, "/");
          const normalizedFile = this.normalizePath(fullPath);
          if (this.isWatchableFile(normalizedFile, this.extensions) && !matchGlob(normalizedFile, this.ignorePatterns)) {
            this._watchedFiles.add(normalizedFile);
            actualFileCount++;
            hasWatchableFiles = true;
          }
        }
        if (hasWatchableFiles) actualDirCount++;
      }
      this.logWatchedDirectories();
      console.log(chalk.green(`
${this.logger.symbols.watch} Chokidar is ready`));
      console.log(chalk.cyan(`${this.logger.symbols.watch} Watching ${actualFileCount} files across ${actualDirCount} ${actualDirCount === 1 ? "directory" : "directories"}
`));
      if (actualFileCount === 0) {
        this.logger.watcherNoFiles(this.paths, this.extensions);
      }
      this.onReady();
    });
    return new Promise((resolve) => {
      this.watcher.on("ready", resolve);
    });
  }
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this._watchedFiles.clear();
    }
  }
};

// src/server/hmr-server.js
import chalk3 from "chalk";

// src/shared/logger.js
import chalk2 from "chalk";
var Logger = class {
  constructor() {
    this.symbols = {
      debug: "\u25C6",
      info: "\u2139",
      success: "\u2713",
      warning: "\u26A0",
      error: "\u2716",
      config: "\u26ED",
      connect: "\u25B6",
      disconnect: "\u2726",
      change: "\u232C",
      add: "\u2295",
      remove: "\u2296",
      inject: "\u2398",
      startup: "\u26B5",
      shutdown: "\u26B6",
      corsProxy: "\u29C9",
      wsProxy: "\u224D",
      watch: "\u26AD",
      dirAdd: "\u2B22",
      dirRemove: "\u2B21",
      glob: "\u2042"
    };
  }
  debug(message) {
    console.log(chalk2.gray(`${this.symbols.debug} [${formatTime()}] ${message}`));
  }
  info(message) {
    console.log(chalk2.cyan(`${this.symbols.info} [${formatTime()}] ${message}`));
  }
  success(message) {
    console.log(chalk2.green(`${this.symbols.success} [${formatTime()}] ${message}`));
  }
  warning(message) {
    console.log(chalk2.yellow(`${this.symbols.warning} [${formatTime()}] ${message}`));
  }
  error(message) {
    console.log(chalk2.red(`${this.symbols.error} [${formatTime()}] ${message}`));
  }
  custom(symbol, message, color = "white") {
    const sym = this.symbols[symbol] || symbol;
    const msg = `${sym} [${formatTime()}] ${message}`;
    console.log(chalk2[color](msg));
  }
  file(symbol, filePath, color = "white", prefix = "") {
    const sym = this.symbols[symbol] || symbol;
    const fileName = getFileName(filePath);
    const dirPath = getFilePath(filePath);
    const prefixText = prefix ? `${prefix}: ` : "";
    const msg = `${sym} [${formatTime()}] ${prefixText}${chalk2.bold(fileName)} ${chalk2.gray.italic(`(${dirPath})`)}`;
    console.log(chalk2[color](msg));
  }
  banner(name, config) {
    console.log(chalk2.bgCyan.black.bold(`${this.symbols.startup} ${name} Starting
`));
    const httpProtocol = config.tls ? "https" : "http";
    const wsProtocol = config.tls ? "wss" : "ws";
    const lines = [
      [config.httpServer, "blue", `${this.symbols.startup} ${httpProtocol.toUpperCase()} server started on ${httpProtocol}://localhost:${config.port}`],
      [config.websocket, "blue", `${this.symbols.startup} WebSocket HMR on ${wsProtocol}://localhost:${config.port}${config.wsPath}`],
      [config.corsProxy, "cyan", `${this.symbols.corsProxy} CORS proxy available at ${config.corsProxy.path}`],
      [config.wsProxy, "cyan", `${this.symbols.wsProxy} WS proxy available at ${config.wsProxy.path}`],
      [config.injectLoader, "magenta", `${this.symbols.inject} Injecting loader into index.html (${config.loaderPath})`],
      [!config.injectLoader && config.loaderPath, "yellow", `${this.symbols.warning} Loader file not found at "${config.loaderPath}" -> injection disabled`],
      [config.logFiles, "yellow", `${this.symbols.config} File logging enabled`],
      [config.logProxy?.cors, "yellow", `${this.symbols.config} CORS proxy logging enabled`],
      [config.logProxy?.ws, "yellow", `${this.symbols.config} WS proxy logging enabled`]
    ];
    for (const [condition, color, message] of lines) {
      if (condition) console.log(chalk2[color](message));
    }
    const lists = [
      [config.watch, "cyan", `
${this.symbols.glob} Watching`],
      [config.ignore, "gray", `${this.symbols.glob} Ignoring`],
      [config.cold, "blue", `${this.symbols.glob} Cold files`]
    ];
    for (const [arr, color, label] of lists) {
      if (arr && arr.length > 0) {
        console.log(chalk2[color](`${label}: ${arr.join(", ")}`));
      }
    }
  }
  // reqBody / resBody are optional short previews (caller truncates)
  corsProxyRequest(method, url, { reqBody, status, statusText, resBody } = {}) {
    const sym = this.symbols.corsProxy;
    const time = formatTime();
    const statusColor = status >= 500 ? "red" : status >= 400 ? "yellow" : "green";
    console.log(chalk2.cyan(`${sym} [${time}] ${method} ${url}`));
    const rows = [];
    if (reqBody) rows.push({ label: "Request body", value: reqBody });
    rows.push({ label: "Response status", value: `${chalk2[statusColor](status)} ${statusText}` });
    if (resBody) rows.push({ label: "Response body", value: resBody });
    rows.forEach((row, i) => {
      const branch = i === rows.length - 1 ? "\u2514\u2500" : "\u251C\u2500";
      console.log(chalk2.gray(`  ${branch} ${row.label}: `) + chalk2.white(row.value));
    });
  }
  // listing every sent header on new ws proxy connection
  wsProxyConnect(id, url, headers) {
    const sym = this.symbols.wsProxy;
    const time = formatTime();
    const entries = Object.entries(headers);
    console.log(chalk2.cyan(`${sym} [${time}] [${id}] Connected ${url}`));
    if (entries.length === 0) return;
    entries.forEach(([k, v], i) => {
      const branch = i === entries.length - 1 ? "\u2514\u2500" : "\u251C\u2500";
      console.log(chalk2.gray(`  ${branch} `) + chalk2.yellow(k) + chalk2.gray(": ") + chalk2.white(v));
    });
  }
  shutdown() {
    console.log(chalk2.bgRed.white.bold(`
 ${this.symbols.shutdown} Shutting down... `));
  }
  watcherStart(paths) {
    const pathsDisplay = paths.join(", ");
    console.log(chalk2.cyan(`
${this.symbols.watch} Starting file watcher for: ${pathsDisplay}`));
    console.log(chalk2.grey(`${this.symbols.watch} Enabling hot directory detection`));
  }
  logInitFile(filePath, ignored, reason = "") {
    if (ignored) {
      const reasonText = reason ? ` (${reason})` : "";
      console.log(chalk2.red(`  ${this.symbols.error} ${filePath}${reasonText}`));
    } else {
      console.log(chalk2.green(`  ${this.symbols.success} ${filePath}`));
    }
  }
  watcherNoFiles(patterns, extensions) {
    console.log(chalk2.yellow(`
${this.symbols.warning} Warning: No files found matching watch patterns!`));
    console.log(chalk2.yellow(`  Patterns: ${patterns.join(", ")}`));
    console.log(chalk2.yellow(`  Check that:`));
    console.log(chalk2.yellow(`    \u2022 Paths exist`));
    console.log(chalk2.yellow(`    \u2022 File extensions match: ${extensions.join(", ")}`));
    console.log(chalk2.yellow(`    \u2022 Ignore patterns aren't too broad
`));
  }
};

// src/server/routes.js
import path2 from "path";
async function handleRoutes(req, server) {
  const url = new URL(req.url);
  if (server.configEndpoint && url.pathname === server.configEndpoint) {
    return Response.json(server.getConfig());
  }
  if (server.filesEndpoint && url.pathname === server.filesEndpoint) {
    return handleFilesEndpoint(server);
  }
  if (server.corsProxy) {
    const response = await handleCORSProxy(req, url, server);
    if (response) return response;
  }
  if (server.injectLoader && url.pathname === "/") {
    return handleIndexInjection(req, server);
  }
  if (server.staticDir) {
    return handleStaticFile(url, server);
  }
  return new Response("Not Found", { status: 404 });
}
function handleFilesEndpoint(server) {
  try {
    const files = server.getFilesCallback ? server.getFilesCallback() : server.watcher.getWatchedFiles();
    return Response.json(files);
  } catch (error) {
    server.logger.error(`Error getting files: ${error.message}`);
    return Response.json([], { status: 500 });
  }
}
async function handleCORSProxy(req, url, server) {
  const config = server.corsProxy;
  const urlPath = url.pathname;
  let matches = false;
  if (typeof config.path === "string") {
    matches = urlPath.startsWith(config.path + "/");
  } else if (config.path instanceof RegExp) {
    matches = config.path.test(urlPath);
  }
  if (!matches) return null;
  const targetUrl = typeof config.path === "string" ? urlPath.slice(config.path.length + 1) : urlPath.replace(config.path, "");
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    return new Response("Invalid target URL", { status: 400 });
  }
  try {
    const outboundHeaders = config.getHeaders ? config.getHeaders(targetUrl, req) : {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": req.headers.get("content-type") || "text/plain"
    };
    let fetchBody;
    let reqBodyPreview;
    if (server.logProxy.cors && !["GET", "HEAD"].includes(req.method)) {
      reqBodyPreview = (await req.text()).slice(0, 200);
      fetchBody = reqBodyPreview;
    } else {
      fetchBody = ["GET", "HEAD"].includes(req.method) ? void 0 : req.body;
    }
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: outboundHeaders,
      body: fetchBody
    });
    const finalResponse = config.transformResponse ? await config.transformResponse(response) : response;
    const responseHeaders = new Headers(finalResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: responseHeaders });
    }
    if (server.logProxy.cors) {
      const resText = await finalResponse.text();
      server.logger.corsProxyRequest(req.method, targetUrl, {
        reqBody: reqBodyPreview,
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        resBody: resText.slice(0, 200)
      });
      return new Response(resText, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: responseHeaders
      });
    }
    return new Response(finalResponse.body, {
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    server.logger.error(`CORS proxy error: ${error.message}`);
    return new Response("0", { status: 500 });
  }
}
async function handleIndexInjection(req, server) {
  try {
    const indexFile = server.indexPath || "index.html";
    if (server.staticDir && path2.isAbsolute(indexFile)) {
      server.logger.error(`indexPath must be relative when staticDir is set, got: "${indexFile}"`);
      return new Response("Server configuration error", { status: 500 });
    }
    const resolved = server.staticDir ? path2.resolve(server.staticDir, indexFile) : path2.resolve(indexFile);
    const file = Bun.file(resolved);
    const html = await file.text();
    if (!server.loaderPath) {
      return new Response(html, {
        headers: { "Content-Type": "text/html" }
      });
    }
    const requestHost = req.headers.get("host");
    const protocol = server.tls ? "https" : "http";
    const loaderUrl = `${protocol}://${requestHost}/` + server.loaderPath.replace(/\\/g, "/").replace(/^\.\//, "");
    const isModule = loaderUrl.endsWith(".mjs");
    const typeAttr = isModule ? ' type="module"' : "";
    const injectedHtml = html.replace(
      "</head>",
      `<script${typeAttr} src="${loaderUrl}"></script></head>`
    );
    return new Response(injectedHtml, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    server.logger.error(`Error loading index.html: ${error.message}`);
    return new Response("Error loading index.html", { status: 500 });
  }
}
var MIME_TYPES = {
  // HTML, JS, CSS, JSON, source maps
  ".html": "text/html",
  ".js": "application/javascript",
  ".cjs": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  // Fonts
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  // Video & Audio
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};
async function handleStaticFile(url, server) {
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  if (url.pathname === "/" && server.indexPath) {
    filePath = "/" + server.indexPath.replace(/^\//, "");
  }
  const baseResolved = path2.resolve(server.staticDir);
  const resolved = path2.resolve(baseResolved, "." + filePath);
  if (!resolved.startsWith(baseResolved + path2.sep)) {
    return new Response("Forbidden", { status: 403 });
  }
  let file = Bun.file(resolved);
  if (!await file.exists()) {
    const indexPath = path2.join(resolved, "index.html");
    file = Bun.file(indexPath);
    if (!await file.exists()) {
      return new Response("Not Found", { status: 404 });
    }
  }
  const ext = path2.extname(file.name).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

// src/server/ws-proxy.js
function handleWSProxy(client, path3, config, logger, logProxy) {
  const targetUrl = path3.slice(config.path.length + 1);
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      throw new Error(`Invalid protocol: ${parsed.protocol}`);
    }
  } catch (e) {
    logger.custom("wsProxy", `Invalid WS proxy target: ${e.message}`, "red");
    client.close(1002, "Invalid target URL");
    return null;
  }
  client.data.isProxy = true;
  const id = Math.random().toString(36).slice(2, 7);
  const tag = `[${id}]`;
  let headers = {};
  if (config.forwardHeaders && client.data.headers) {
    if (config.forwardHeaders === true) {
      headers = { ...client.data.headers };
    } else if (Array.isArray(config.forwardHeaders)) {
      for (const name of config.forwardHeaders) {
        const value = client.data.headers?.[name.toLowerCase()];
        if (value !== void 0) {
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
    logger.custom("wsProxy", `${tag} Failed to create upstream WebSocket: ${error.message}`, "red");
    client.close(1011, "Upstream connection failed");
    return;
  }
  client.data.upstream = upstream;
  let closed = false;
  const closeBoth = () => {
    if (closed) return;
    closed = true;
    clientOpen = false;
    upstreamReady = false;
    try {
      client.close();
    } catch {
    }
    try {
      upstream.close();
    } catch {
    }
    if (logProxy) logger.custom("wsProxy", `${tag} Closed ${targetUrl}`, "gray");
  };
  const pendingClientMessages = [];
  const MAX_PENDING = 512;
  let clientOpen = true;
  let upstreamReady = false;
  const clientMessageHandler = config.onClientMessage || ((message, _client, upstream2) => {
    if (logProxy && typeof message === "string") {
      logger.custom("wsProxy", `${tag} -> ${message.slice(0, 200)}`, "gray");
    }
    if (upstreamReady) {
      upstream2.send(message);
    } else {
      if (pendingClientMessages.length >= MAX_PENDING) {
        pendingClientMessages.shift();
      }
      pendingClientMessages.push(message);
    }
  });
  const upstreamMessageHandler = config.onUpstreamMessage || ((message, client2, _upstream) => {
    if (logProxy && typeof message === "string") {
      logger.custom("wsProxy", `${tag} <- ${message.slice(0, 200)}`, "gray");
    }
    if (clientOpen && client2.readyState === WebSocket.OPEN) {
      try {
        client2.send(message);
      } catch {
      }
    }
  });
  upstream.onmessage = (event) => {
    upstreamMessageHandler(event.data, client, upstream);
  };
  upstream.onclose = closeBoth;
  upstream.onerror = (event) => {
    const message = event instanceof ErrorEvent ? event.message : "Connection failed";
    if (logProxy) logger.custom("wsProxy", `${tag} Upstream error: ${message}`, "red");
    closeBoth();
  };
  upstream.onopen = () => {
    upstreamReady = true;
    if (logProxy) logger.wsProxyConnect(id, targetUrl, headers);
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

// src/server/hmr-server.js
var HMRServer = class {
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
    this.port = options.port || DEFAULT_PORT;
    this.bindHost = options.bindHost ?? "localhost";
    this.wsPath = options.wsPath || "/hmr";
    this.watchFiles = options.watchFiles ?? true;
    this.watchPaths = options.watch || ["src"];
    this.ignorePaths = options.ignore || [];
    this.coldPatterns = options.cold || [];
    this.extensions = (options.extensions || WATCHABLE_EXTENSIONS).map((e) => e.toLowerCase());
    this.onConnectCallback = options.onConnect || this.defaultOnConnect.bind(this);
    this.onDisconnectCallback = options.onDisconnect || (() => {
    });
    this.logFiles = options.logFiles || false;
    const lp = options.logProxy;
    if (lp === true) {
      this.logProxy = { cors: true, ws: true };
    } else if (lp && typeof lp === "object") {
      this.logProxy = { cors: !!lp.cors, ws: !!lp.ws };
    } else {
      this.logProxy = { cors: false, ws: false };
    }
    this.logger = new Logger();
    this.watcher = null;
    this.server = null;
    this.clients = /* @__PURE__ */ new Set();
    this.staticDir = options.static === false ? null : options.static ?? ".";
    this.getFilesCallback = options.getFiles || null;
    this.filesEndpoint = resolveEndpoint(options.filesEndpoint, DEFAULT_FILES_ENDPOINT);
    this.configEndpoint = resolveEndpoint(options.configEndpoint, DEFAULT_CONFIG_ENDPOINT);
    const proxyConfig = options.corsProxy;
    if (proxyConfig === true) {
      this.corsProxy = { path: DEFAULT_CORS_PROXY_PATH };
    } else if (typeof proxyConfig === "string") {
      this.corsProxy = { path: normalizeProxyPath(proxyConfig, DEFAULT_CORS_PROXY_PATH) };
    } else if (proxyConfig && typeof proxyConfig === "object") {
      const { path: proxyPath, getHeaders, transformResponse, ...rest } = proxyConfig;
      if (Object.keys(rest).length > 0) {
        this.logger.warning(`corsProxy received unknown options: ${Object.keys(rest).join(", ")}, these will be ignored`);
      }
      this.corsProxy = {
        path: normalizeProxyPath(proxyPath, DEFAULT_CORS_PROXY_PATH),
        getHeaders: getHeaders || null,
        transformResponse: transformResponse || null
      };
    } else {
      this.corsProxy = null;
    }
    if (options.wsProxy) {
      this.wsProxy = {
        ...options.wsProxy,
        path: normalizeProxyPath(options.wsProxy.path, DEFAULT_WS_PROXY_PATH)
      };
    } else {
      this.wsProxy = null;
    }
    if (options.injectLoader !== void 0 && options.injectLoader !== null) {
      if (typeof options.injectLoader !== "string" || options.injectLoader.trim().length === 0) {
        throw new Error("injectLoader must be a non-empty string path");
      }
      this.loaderPath = options.injectLoader.trim();
    } else {
      this.loaderPath = null;
    }
    this.injectLoader = this.loaderPath !== null;
    this.indexPath = options.indexPath || "index.html";
    this.tls = options.tls || null;
    const DEFAULT_SIGNALS = ["SIGINT", "SIGTERM"];
    this.handleSignals = options.handleSignals === false ? false : Array.isArray(options.handleSignals) ? options.handleSignals : DEFAULT_SIGNALS;
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
      console.log(chalk3.yellow(`
${this.logger.symbols.config} WatchFiles disabled - globbing: ${this.watchPaths.join(", ")}`));
      const files = [];
      const extPatterns = this.extensions.map((ext) => `**/*${ext}`);
      for (const pattern of this.watchPaths) {
        const globPattern = pattern.endsWith("*") ? pattern : `${pattern}/**/*`;
        const glob = new Bun.Glob(globPattern);
        for await (const file of glob.scan({ onlyFiles: true })) {
          if (matchGlob(file, extPatterns) && !matchGlob(file, this.ignorePaths)) {
            files.push(file);
          }
        }
      }
      console.log(chalk3.cyan(`${this.logger.symbols.watch} Found ${files.length} file${files.length !== 1 ? "s" : ""} (static snapshot, no watcher running)
`));
      this.staticFiles = files;
      this.getFilesCallback = () => this.staticFiles;
      return;
    }
    const watcherOptions = {
      logger: this.logger,
      paths: this.watchPaths,
      ignore: this.ignorePaths,
      logFiles: this.logFiles,
      onChange: (path3) => {
        if (this.isColdFile(path3)) {
          this.logger.file("change", path3, "cyanBright", "Cold file");
          this.broadcast(HMR_ACTIONS.RELOAD, path3, { cold: true });
          return;
        }
        this.logger.file("change", path3, "yellow", "File changed");
        this.broadcast(HMR_ACTIONS.RELOAD, path3);
      },
      onAdd: (path3) => {
        this.logger.file("add", path3, "greenBright", "File added");
        this.broadcast(HMR_ACTIONS.ADD, path3);
      },
      onRemove: (path3) => {
        this.logger.file("remove", path3, "red", "File removed");
        this.broadcast(HMR_ACTIONS.REMOVE, path3);
      },
      onAddDir: (path3) => {
        this.logger.file("dirAdd", path3, "cyan", "Directory added");
      },
      onRemoveDir: (path3) => {
        this.logger.file("dirRemove", path3, "red", "Directory removed");
      },
      onReady: () => {
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
    if (sentCount > 1) {
      console.log(chalk3.gray(`  \u2514\u2500 Broadcasted to ${sentCount} client${sentCount !== 1 ? "s" : ""}`));
    }
  }
  handleHMRConnection(client) {
    this.clients.add(client);
    const browser = getBrowserFromUA(client.data?.headers?.["user-agent"]);
    this.logger.custom(
      "connect",
      `HMR client connected (${this.clients.size} total) - ${browser}`,
      "green"
    );
    const files = this.getFilesCallback ? this.getFilesCallback() : this.watcher ? this.watcher.getWatchedFiles() : [];
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
      "disconnect",
      `HMR client disconnected (${this.clients.size} remaining)`,
      "red"
    );
    this.onDisconnectCallback(client);
  }
  getWebSocketConfig() {
    return {
      open: (client) => {
        const path3 = client.data?.path || "/";
        if (this.wsProxy && path3.startsWith(this.wsProxy.path + "/")) {
          const proxyHandlers = handleWSProxy(client, path3, this.wsProxy, this.logger, this.logProxy.ws);
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
    if (this.loaderPath) {
      const loaderFile = Bun.file(this.loaderPath);
      if (!await loaderFile.exists()) {
        this.injectLoader = false;
      }
    }
    let tlsConfig = null;
    if (this.tls) {
      try {
        tlsConfig = {
          key: await Bun.file(this.tls.key).text(),
          cert: await Bun.file(this.tls.cert).text()
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
    const httpProtocol = tlsConfig ? "https" : "http";
    const wsProtocol = tlsConfig ? "wss" : "ws";
    this.logger.banner("HMR Server", {
      ...this.getConfig(),
      httpServer: !!(this.staticDir || this.corsProxy),
      websocket: true,
      protocol: httpProtocol,
      wsProtocol
    });
    await this.setupWatcher();
    const serverConfig = {
      port: this.port,
      hostname: this.bindHost,
      fetch: async (req, server) => {
        const url = new URL(req.url);
        const isHMRPath = url.pathname === this.wsPath;
        const isWSProxyPath = this.wsProxy && url.pathname.startsWith(this.wsProxy.path + "/");
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
        const headers = new Headers(response.headers);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
      this.server.stop(true);
    }
    if (this.watcher) {
      await this.watcher.stop();
    }
    this.clients.clear();
  }
};
export {
  DEFAULT_CONFIG_ENDPOINT,
  DEFAULT_CORS_PROXY_PATH,
  DEFAULT_FILES_ENDPOINT,
  DEFAULT_PORT,
  DEFAULT_WS_PROXY_PATH,
  FileWatcher,
  HMRServer,
  HMR_ACTIONS,
  Logger,
  WATCHABLE_EXTENSIONS,
  WATCHER_CONFIG,
  HMRServer as default,
  formatTime,
  getBrowserFromUA,
  getFileName,
  getFilePath,
  matchGlob,
  normalizeProxyPath,
  normalizeUrl,
  resolveConnectionUrls,
  resolveEndpoint
};
//# sourceMappingURL=index.js.map
