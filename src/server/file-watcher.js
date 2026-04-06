import chokidar from 'chokidar';
import chalk from 'chalk';
import path from 'path';
import { matchGlob } from '../shared/utils.js';
import { WATCHER_CONFIG } from '../shared/constants.js';

/**
 * @typedef {Object} FileWatcherOptions
 * @property {string[]} paths - Paths or glob patterns to watch (from project root)
 * @property {string[]} [ignore] - Glob patterns to ignore (from project root)
 * @property {string[]} [extensions] - File extensions to watch
 * @property {import('../shared/logger.js').Logger} logger - Logger instance from HMR server
 * @property {(path: string) => void} [onChange] - Called when file changes
 * @property {(path: string) => void} [onAdd] - Called when file is added
 * @property {(path: string) => void} [onRemove] - Called when file is removed
 * @property {(path: string) => void} [onAddDir] - Called when directory is added
 * @property {(path: string) => void} [onRemoveDir] - Called when directory is removed
 * @property {() => void} [onReady] - Called when watcher is ready
 * @property {boolean} [logFiles=false] - Log watched files during initialization
 */

/** File watcher using chokidar with picomatch glob filtering */
export class FileWatcher {
  constructor(options) {
    this.paths = options.paths || [];
    this.ignorePatterns = options.ignore || [];
    this.extensions = options.extensions || [];
    this.onChange = options.onChange || (() => { });
    this.onAdd = options.onAdd || (() => { });
    this.onRemove = options.onRemove || (() => { });
    this.onAddDir = options.onAddDir || (() => { });
    this.onRemoveDir = options.onRemoveDir || (() => { });
    this.onReady = options.onReady || (() => { });
    this.logFiles = options.logFiles || false;

    this.logger = options.logger;
    this.watcher = null;

    /**
     * Incrementally maintained set of watched files.
     * Avoids rescanning chokidar's full watched map on every /files request.
     * @type {Set<string>}
     */
    this._watchedFiles = new Set();

    // Only used during initialization for file logging
    this.isInitializing = true;
    this.loggedFiles = new Set();
  }

  shouldIgnore(filePath, stats) {
    const normalized = this.normalizePath(filePath);

    // Always allow directories to be traversed (unless they match ignore patterns)
    if (stats && stats.isDirectory()) {
      return matchGlob(normalized, this.ignorePatterns);
    }

    if (matchGlob(normalized, this.ignorePatterns)) {
      this.logFile(filePath, true, 'ignored pattern');
      return true;
    }

    if (stats && stats.isFile() && !this.isWatchableFile(normalized, this.extensions)) {
      this.logFile(filePath, true, 'non-watchable extension');
      return true;
    }

    if (stats && stats.isFile()) {
      this.logFile(filePath, false);
    }

    return false;
  }

  normalizePath(filePath) {
    return path.relative('.', filePath).replace(/\\/g, '/');
  }

  isWatchableFile(filePath, extensions) {
    const ext = path.extname(filePath).toLowerCase();
    return extensions.includes(ext);
  }

  logFile(filePath, ignored, reason = '') {
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
    const watchRoots = this.paths.map(p => this.normalizePath(p));
    const relevantDirs = new Set();

    for (const [dir, files] of Object.entries(watched)) {
      const normalized = this.normalizePath(dir);

      const isWithinWatchRoot = watchRoots.some(root =>
        normalized === root || normalized.startsWith(root + '/')
      );

      if (!isWithinWatchRoot || normalized === '.') continue;

      const hasWatchableFiles = files.some(file => {
        const fullPath = `${dir}/${file}`.replace(/\\/g, '/');
        const normalizedFile = this.normalizePath(fullPath);
        return this.isWatchableFile(normalizedFile, this.extensions) &&
          !matchGlob(normalizedFile, this.ignorePatterns);
      });

      if (hasWatchableFiles) {
        // Add the directory's full normalized path and every ancestor up to
        // (but not including) the watch root so the printed tree is complete.
        relevantDirs.add(normalized);
        for (const root of watchRoots) {
          if (normalized.startsWith(root + '/')) {
            // Walk up the ancestors between root and this dir
            const parts = normalized.substring(root.length + 1).split('/');
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

    console.log(chalk.cyan(`\n${this.logger.symbols.watch} Watching directories:`));
    sortedDirs.forEach(dir => {
      console.log(chalk.green(`  ${this.logger.symbols.success} ${dir}`));
    });
  }

  async start() {
    if (this.watcher) {
      this.logger.warning('Watcher already started');
      return;
    }

    if (this.paths.length === 0) {
      this.logger.warning('No paths to watch');
      return;
    }

    this.logger.watcherStart(this.paths);
    this.isInitializing = true;

    let resolveReady;
    const readyPromise = new Promise(resolve => { resolveReady = resolve; });

    this.watcher = chokidar.watch(this.paths, {
      ...WATCHER_CONFIG,
      ignored: (filePath, stats) => this.shouldIgnore(filePath, stats)
    });

    this.watcher
      .on('change', (filePath) => {
        const normalized = this.normalizePath(filePath);
        this.onChange(normalized);
      })
      .on('add', (filePath) => {
        const normalized = this.normalizePath(filePath);
        this._watchedFiles.add(normalized);
        this.onAdd(normalized);
      })
      .on('unlink', (filePath) => {
        const normalized = this.normalizePath(filePath);
        this._watchedFiles.delete(normalized);
        this.onRemove(normalized);
      })
      .on('addDir', (dirPath) => {
        const normalized = this.normalizePath(dirPath);
        this.onAddDir(normalized);
      })
      .on('unlinkDir', (dirPath) => {
        const normalized = this.normalizePath(dirPath);
        this.onRemoveDir(normalized);
      })
      .on('error', (error) => {
        this.logger.error(`Watcher error: ${error.message}`);
      })
      .on('ready', () => {
        if (!this.isInitializing) return;
        this.isInitializing = false;
        this.loggedFiles.clear();

        // Populate the incremental cache from chokidar's initial scan,
        // since add events were suppressed by ignoreInitial during startup.
        const watched = this.watcher.getWatched();
        const watchRoots = this.paths.map(p => this.normalizePath(p));

        let actualFileCount = 0;
        let actualDirCount = 0;

        for (const [dir, files] of Object.entries(watched)) {
          const normalized = this.normalizePath(dir);

          const isWithinWatchRoot = watchRoots.some(root =>
            normalized === root || normalized.startsWith(root + '/')
          );

          if (!isWithinWatchRoot || normalized === '.') continue;

          let hasWatchableFiles = false;
          for (const file of files) {
            const fullPath = `${dir}/${file}`.replace(/\\/g, '/');
            const normalizedFile = this.normalizePath(fullPath);
            if (this.isWatchableFile(normalizedFile, this.extensions) &&
              !matchGlob(normalizedFile, this.ignorePatterns)) {
              this._watchedFiles.add(normalizedFile);
              actualFileCount++;
              hasWatchableFiles = true;
            }
          }

          if (hasWatchableFiles) actualDirCount++;
        }

        this.logWatchedDirectories();

        console.log(chalk.green(`\n${this.logger.symbols.watch} Chokidar is ready`));
        console.log(chalk.cyan(`${this.logger.symbols.watch} Watching ${actualFileCount} files across ${actualDirCount} ${actualDirCount === 1 ? 'directory' : 'directories'}\n`));

        if (actualFileCount === 0) {
          this.logger.watcherNoFiles(this.paths, this.extensions);
        }

        this.onReady();
        resolveReady();
      });

    return readyPromise;
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this._watchedFiles.clear();
    }
  }
}