import chalk from 'chalk';
import { formatTime, getFileName, getFilePath } from './utils.js';

export class Logger {
  constructor() {
    this.symbols = {
      debug: '◆',
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✖',
      config: '⛭',
      connect: '▶',
      disconnect: '✦',
      change: '⌬',
      add: '⊕',
      remove: '⊖',
      inject: '⎘',
      startup: '⚵',
      shutdown: '⚶',
      corsProxy: '⧉',
      wsProxy: '≍',
      watch: '⚭',
      dirAdd: '⬢',
      dirRemove: '⬡',
      glob: '⁂',
    };
  }

  debug(message) {
    console.log(chalk.gray(`${this.symbols.debug} [${formatTime()}] ${message}`));
  }

  info(message) {
    console.log(chalk.cyan(`${this.symbols.info} [${formatTime()}] ${message}`));
  }

  success(message) {
    console.log(chalk.green(`${this.symbols.success} [${formatTime()}] ${message}`));
  }

  warning(message) {
    console.log(chalk.yellow(`${this.symbols.warning} [${formatTime()}] ${message}`));
  }

  error(message) {
    console.log(chalk.red(`${this.symbols.error} [${formatTime()}] ${message}`));
  }

  custom(symbol, message, color = 'white') {
    const sym = this.symbols[symbol] || symbol;
    const msg = `${sym} [${formatTime()}] ${message}`;
    console.log(chalk[color](msg));
  }

  file(symbol, filePath, color = 'white', prefix = '') {
    const sym = this.symbols[symbol] || symbol;
    const fileName = getFileName(filePath);
    const dirPath = getFilePath(filePath);

    const prefixText = prefix ? `${prefix}: ` : '';
    const msg = `${sym} [${formatTime()}] ${prefixText}${chalk.bold(fileName)} ${chalk.gray.italic(`(${dirPath})`)}`;

    console.log(chalk[color](msg));
  }

  banner(name, config) {
    console.log(chalk.bgCyan.black.bold(`${this.symbols.startup} ${name} Starting\n`));

    const httpProtocol = config.tls ? 'https' : 'http';
    const wsProtocol = config.tls ? 'wss' : 'ws';

    const lines = [
      [config.httpServer, 'blue', `${this.symbols.startup} ${httpProtocol.toUpperCase()} server started on ${httpProtocol}://localhost:${config.port}`],
      [config.websocket, 'blue', `${this.symbols.startup} WebSocket HMR on ${wsProtocol}://localhost:${config.port}${config.wsPath}`],
      [config.corsProxy, 'cyan', `${this.symbols.corsProxy} CORS proxy available at ${config.corsProxy.path}`],
      [config.wsProxy, 'cyan', `${this.symbols.wsProxy} WS proxy available at ${config.wsProxy.path}`],
      [config.injectLoader, 'magenta', `${this.symbols.inject} Injecting loader into index.html (${config.loaderPath})`],
      [!config.injectLoader && config.loaderPath, 'yellow', `${this.symbols.warning} Loader file not found at "${config.loaderPath}" -> injection disabled`],
      [config.logFiles, 'yellow', `${this.symbols.config} File logging enabled`],
      [config.logProxy?.cors, 'yellow', `${this.symbols.config} CORS proxy logging enabled`],
      [config.logProxy?.ws, 'yellow', `${this.symbols.config} WS proxy logging enabled`],
    ];

    for (const [condition, color, message] of lines) {
      if (condition) console.log(chalk[color](message));
    }

    const lists = [
      [config.watch, 'cyan', `\n${this.symbols.glob} Watching`],
      [config.ignore, 'gray', `${this.symbols.glob} Ignoring`],
      [config.cold, 'blue', `${this.symbols.glob} Cold files`],
    ];

    for (const [arr, color, label] of lists) {
      if (arr && arr.length > 0) {
        console.log(chalk[color](`${label}: ${arr.join(', ')}`));
      }
    }
  }

  // reqBody / resBody are optional short previews (caller truncates)
  corsProxyRequest(method, url, { reqBody, status, statusText, resBody } = {}) {
    const sym = this.symbols.corsProxy;
    const time = formatTime();
    const statusColor = status >= 500 ? 'red' : status >= 400 ? 'yellow' : 'green';

    console.log(chalk.cyan(`${sym} [${time}] ${method} ${url}`));

    const rows = [];
    if (reqBody) rows.push({ label: 'Request body', value: reqBody });
    rows.push({ label: 'Response status', value: `${chalk[statusColor](status)} ${statusText}` });
    if (resBody) rows.push({ label: 'Response body', value: resBody });

    rows.forEach((row, i) => {
      const branch = i === rows.length - 1 ? '└─' : '├─';
      console.log(chalk.gray(`  ${branch} ${row.label}: `) + chalk.white(row.value));
    });
  }

  // listing every sent header on new ws proxy connection
  wsProxyConnect(id, url, headers) {
    const sym = this.symbols.wsProxy;
    const time = formatTime();
    const entries = Object.entries(headers);

    console.log(chalk.cyan(`${sym} [${time}] [${id}] Connected ${url}`));

    if (entries.length === 0) return;
    entries.forEach(([k, v], i) => {
      const branch = i === entries.length - 1 ? '└─' : '├─';
      console.log(chalk.gray(`  ${branch} `) + chalk.yellow(k) + chalk.gray(': ') + chalk.white(v));
    });
  }

  shutdown() {
    console.log(chalk.bgRed.white.bold(`\n ${this.symbols.shutdown} Shutting down... `));
  }

  watcherStart(paths) {
    const pathsDisplay = paths.join(', ');
    console.log(chalk.cyan(`\n${this.symbols.watch} Starting file watcher for: ${pathsDisplay}`));
    console.log(chalk.grey(`${this.symbols.watch} Enabling hot directory detection`));
  }

  logInitFile(filePath, ignored, reason = '') {
    if (ignored) {
      const reasonText = reason ? ` (${reason})` : '';
      console.log(chalk.red(`  ${this.symbols.error} ${filePath}${reasonText}`));
    } else {
      console.log(chalk.green(`  ${this.symbols.success} ${filePath}`));
    }
  }

  watcherNoFiles(patterns, extensions) {
    console.log(chalk.yellow(`\n${this.symbols.warning} Warning: No files found matching watch patterns!`));
    console.log(chalk.yellow(`  Patterns: ${patterns.join(', ')}`));
    console.log(chalk.yellow(`  Check that:`));
    console.log(chalk.yellow(`    • Paths exist`));
    console.log(chalk.yellow(`    • File extensions match: ${extensions.join(', ')}`));
    console.log(chalk.yellow(`    • Ignore patterns aren't too broad\n`));
  }
}