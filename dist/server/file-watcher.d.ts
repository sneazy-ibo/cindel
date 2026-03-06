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
    constructor(options: any);
    paths: any;
    ignorePatterns: any;
    extensions: any;
    onChange: any;
    onAdd: any;
    onRemove: any;
    onAddDir: any;
    onRemoveDir: any;
    onReady: any;
    logFiles: any;
    logger: any;
    watcher: import("chokidar").FSWatcher;
    /**
     * Incrementally maintained set of watched files.
     * Avoids rescanning chokidar's full watched map on every /files request.
     * @type {Set<string>}
     */
    _watchedFiles: Set<string>;
    isInitializing: boolean;
    loggedFiles: Set<any>;
    shouldIgnore(filePath: any, stats: any): any;
    normalizePath(filePath: any): string;
    isWatchableFile(filePath: any, extensions: any): any;
    logFile(filePath: any, ignored: any, reason?: string): void;
    getWatchedFiles(): string[];
    logWatchedDirectories(): void;
    start(): Promise<any>;
    stop(): Promise<void>;
}
export type FileWatcherOptions = {
    /**
     * - Paths or glob patterns to watch (from project root)
     */
    paths: string[];
    /**
     * - Glob patterns to ignore (from project root)
     */
    ignore?: string[];
    /**
     * - File extensions to watch
     */
    extensions?: string[];
    /**
     * - Logger instance from HMR server
     */
    logger: import("../shared/logger.js").Logger;
    /**
     * - Called when file changes
     */
    onChange?: (path: string) => void;
    /**
     * - Called when file is added
     */
    onAdd?: (path: string) => void;
    /**
     * - Called when file is removed
     */
    onRemove?: (path: string) => void;
    /**
     * - Called when directory is added
     */
    onAddDir?: (path: string) => void;
    /**
     * - Called when directory is removed
     */
    onRemoveDir?: (path: string) => void;
    /**
     * - Called when watcher is ready
     */
    onReady?: () => void;
    /**
     * - Log watched files during initialization
     */
    logFiles?: boolean;
};
//# sourceMappingURL=file-watcher.d.ts.map