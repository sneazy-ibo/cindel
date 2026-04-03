/** Handles loading and hot reloading of JavaScript and CSS files via blob URLs. */
export class FileLoader {
    constructor(httpUrl: any);
    httpUrl: any;
    /**
     * Debounce state per file. Stores { timeout, resolvers[] } so that
     * when a rapid second change clears the first timeout, the first
     * caller's Promise still resolves with the final load result.
     * @type {Map<string, { timeout: number, resolvers: Function[] }>}
     */
    loadQueue: Map<string, {
        timeout: number;
        resolvers: Function[];
    }>;
    /**
     * Load counter per file used for cache busting.
     * Produces short URLs like Logger.js?v=3 which keeps
     * browser stack traces readable.
     * @type {Map<string, number>}
     */
    versions: Map<string, number>;
    loadFile(path: any): Promise<any>;
    loadCSS(path: any): Promise<any>;
    loadModule(path: any): Promise<boolean>;
    loadScript(path: any): Promise<any>;
    reloadFile(path: any): Promise<any>;
    _flushReload(path: any): Promise<void>;
    removeFile(path: any): Promise<void>;
    makeUrl(path: any): string;
}
//# sourceMappingURL=file-loader.d.ts.map