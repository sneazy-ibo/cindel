import picomatch from 'picomatch';

// Cache compiled matchers so same patterns aren't recompiled on every call
const matcherCache = new Map();

export function matchGlob(file, patterns) {
  return patterns.some(pattern => {
    if (!matcherCache.has(pattern)) matcherCache.set(pattern, picomatch(pattern));
    return matcherCache.get(pattern)(file);
  });
}

export function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function getBrowserFromUA(userAgent) {
  if (!userAgent) return 'Unknown';

  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Edge/')) return 'Edge';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';

  return 'Unknown';
}

export function getFileName(path) {
  return path.split('/').pop();
}

export function getFilePath(path) {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '.';
}

export function normalizeUrl(url) {
  return url.endsWith('/') ? url : url + '/';
}

export function normalizeProxyPath(path, defaultPath) {
  return (path || defaultPath).replace(/^(?!\/)/, '/').replace(/\/+$/, '');
}

export function resolveEndpoint(value, defaultPath) {
  if (!value) return null;
  if (value === true) return defaultPath;
  return value.startsWith('/') ? value : `/${value}`;
}

/**
 * Resolve HMR connection URLs from various input formats
 * @param {string|number|Object} options - Connection options
 * @returns {{ wsUrl: string, httpUrl: string }}
 * 
 * @example
 * resolveConnectionUrls(1338)
 * // => { wsUrl: 'ws://localhost:1338', httpUrl: 'http://localhost:1338/' }
 * 
 * @example
 * resolveConnectionUrls('ws://192.168.1.100:1338')
 * // => { wsUrl: 'ws://192.168.1.100:1338', httpUrl: 'http://192.168.1.100:1338/' }
 * 
 * @example
 * resolveConnectionUrls({ host: 'dev.example.com', port: 1338, secure: true })
 * // => { wsUrl: 'wss://dev.example.com:1338', httpUrl: 'https://dev.example.com:1338/' }
 */
function wsUrlToHttpUrl(wsUrl) {
  const u = new URL(wsUrl);
  return `${u.protocol === 'wss:' ? 'https' : 'http'}://${u.host}/`;
}

function httpUrlToWsUrl(httpUrl, wsPath) {
  const u = new URL(httpUrl);
  return `${u.protocol === 'https:' ? 'wss' : 'ws'}://${u.host}${wsPath}`;
}

export function resolveConnectionUrls(options, wsPath = '/hmr') {
  if (typeof options === 'string') {
    return { wsUrl: options, httpUrl: wsUrlToHttpUrl(options) };
  }

  if (typeof options === 'number') {
    options = { port: options };
  }

  if (typeof options !== 'object' || options === null) {
    throw new Error('Options must be a string, number, or object');
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
    const host = options.host || 'localhost';
    const secure = options.secure || false;
    const wsProtocol = secure ? 'wss' : 'ws';
    const httpProtocol = secure ? 'https' : 'http';

    const wsUrl = `${wsProtocol}://${host}:${options.port}${wsPath}`;
    const httpUrl = normalizeUrl(`${httpProtocol}://${host}:${options.port}`);

    return { wsUrl, httpUrl };
  }

  throw new Error('Must provide wsUrl, httpUrl, port, or host+port');
}