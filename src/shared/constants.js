export const DEFAULT_PORT = 1338;
export const WATCHABLE_EXTENSIONS = ['.js', '.cjs', '.mjs', '.css'];

export const DEFAULT_FILES_ENDPOINT = '/files'
export const DEFAULT_CONFIG_ENDPOINT = '/config'

export const DEFAULT_CORS_PROXY_PATH = '/proxy';
export const DEFAULT_WS_PROXY_PATH = '/proxy';

export const WATCHER_CONFIG = {
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

export const HMR_ACTIONS = {
  RELOAD: 'reload',
  ADD: 'add',
  REMOVE: 'remove',
  INIT: 'init'
};