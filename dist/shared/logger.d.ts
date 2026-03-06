export class Logger {
    symbols: {
        debug: string;
        info: string;
        success: string;
        warning: string;
        error: string;
        config: string;
        connect: string;
        disconnect: string;
        change: string;
        add: string;
        remove: string;
        inject: string;
        startup: string;
        shutdown: string;
        corsProxy: string;
        wsProxy: string;
        watch: string;
        dirAdd: string;
        dirRemove: string;
        glob: string;
    };
    debug(message: any): void;
    info(message: any): void;
    success(message: any): void;
    warning(message: any): void;
    error(message: any): void;
    custom(symbol: any, message: any, color?: string): void;
    file(symbol: any, filePath: any, color?: string, prefix?: string): void;
    banner(name: any, config: any): void;
    corsProxyRequest(method: any, url: any, { reqBody, status, statusText, resBody }?: {}): void;
    wsProxyConnect(id: any, url: any, headers: any): void;
    shutdown(): void;
    watcherStart(paths: any): void;
    logInitFile(filePath: any, ignored: any, reason?: string): void;
    watcherNoFiles(patterns: any, extensions: any): void;
}
//# sourceMappingURL=logger.d.ts.map