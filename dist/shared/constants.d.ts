export const DEFAULT_PORT: 1338;
export const WATCHABLE_EXTENSIONS: string[];
export const DEFAULT_FILES_ENDPOINT: "/files";
export const DEFAULT_CONFIG_ENDPOINT: "/config";
export const DEFAULT_CORS_PROXY_PATH: "/proxy";
export const DEFAULT_WS_PROXY_PATH: "/proxy";
export namespace WATCHER_CONFIG {
    let persistent: boolean;
    let ignoreInitial: boolean;
    namespace awaitWriteFinish {
        let stabilityThreshold: number;
        let pollInterval: number;
    }
    let usePolling: boolean;
    let alwaysStat: boolean;
    let atomic: boolean;
}
export namespace HMR_ACTIONS {
    let RELOAD: string;
    let ADD: string;
    let REMOVE: string;
    let INIT: string;
}
export const CORS_HEADERS: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Private-Network': string;
};
//# sourceMappingURL=constants.d.ts.map