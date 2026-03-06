import path from 'path';

export async function handleRoutes(req, server) {
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

  if (server.injectLoader && url.pathname === '/') {
    return handleIndexInjection(req, server);
  }

  if (server.staticDir) {
    return handleStaticFile(url, server);
  }

  return new Response('Not Found', { status: 404 });
}

function handleFilesEndpoint(server) {
  try {
    const files = server.getFilesCallback
      ? server.getFilesCallback()
      : server.watcher.getWatchedFiles();
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
  if (typeof config.path === 'string') {
    matches = urlPath.startsWith(config.path + '/');
  } else if (config.path instanceof RegExp) {
    matches = config.path.test(urlPath);
  }

  if (!matches) return null;

  const targetUrl = typeof config.path === 'string'
    ? urlPath.slice(config.path.length + 1)
    : urlPath.replace(config.path, '');

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return new Response('Invalid target URL', { status: 400 });
  }

  try {
    const outboundHeaders = config.getHeaders
      ? config.getHeaders(targetUrl, req)
      : {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': req.headers.get('content-type') || 'text/plain'
      };

    // When logging, buffer the request body so we can both log and forward it.
    // Streaming is preserved for the non-logging path.
    let fetchBody;
    let reqBodyPreview;
    if (server.logProxy.cors && !['GET', 'HEAD'].includes(req.method)) {
      reqBodyPreview = (await req.text()).slice(0, 200);
      fetchBody = reqBodyPreview;
    } else {
      fetchBody = ['GET', 'HEAD'].includes(req.method) ? undefined : req.body;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: outboundHeaders,
      body: fetchBody
    });

    const finalResponse = config.transformResponse
      ? await config.transformResponse(response)
      : response;

    // Clone upstream headers directly instead of spreading into a plain object
    // to avoid unnecessary allocations on every proxied response.
    const responseHeaders = new Headers(finalResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: responseHeaders });
    }

    if (server.logProxy.cors) {
      // Buffer the response body so we can log a preview and still return it.
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
    return new Response('0', { status: 500 });
  }
}

async function handleIndexInjection(req, server) {
  try {
    const indexFile = server.indexPath || 'index.html';

    // If indexPath is absolute and a staticDir is set, it would escape the
    // static root since path.resolve treats absolute segments as a new root.
    if (server.staticDir && path.isAbsolute(indexFile)) {
      server.logger.error(`indexPath must be relative when staticDir is set, got: "${indexFile}"`);
      return new Response('Server configuration error', { status: 500 });
    }

    const resolved = server.staticDir
      ? path.resolve(server.staticDir, indexFile)
      : path.resolve(indexFile);

    const file = Bun.file(resolved);
    const html = await file.text();

    if (!server.loaderPath) {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const requestHost = req.headers.get('host');
    const protocol = server.tls ? 'https' : 'http';
    const loaderUrl = `${protocol}://${requestHost}/` + server.loaderPath
      .replace(/\\/g, '/')
      .replace(/^\.\//, '');

    const isModule = loaderUrl.endsWith('.mjs');
    const typeAttr = isModule ? ' type="module"' : '';

    const injectedHtml = html.replace(
      '</head>',
      `<script${typeAttr} src="${loaderUrl}"></script></head>`
    );

    return new Response(injectedHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    server.logger.error(`Error loading index.html: ${error.message}`);
    return new Response('Error loading index.html', { status: 500 });
  }
}

const MIME_TYPES = {
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
  ".wav": "audio/wav",
};

async function handleStaticFile(url, server) {
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;

  if (url.pathname === "/" && server.indexPath) {
    filePath = "/" + server.indexPath.replace(/^\//, "");
  }

  const baseResolved = path.resolve(server.staticDir);

  // Guard against path traversal (e.g. /../../../etc/pwd).
  // Path traversal seems to get collapsed already but I kept the guard in just in case.
  const resolved = path.resolve(baseResolved, "." + filePath);

  if (!resolved.startsWith(baseResolved + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  let file = Bun.file(resolved);

  if (!(await file.exists())) {
    // Try treating the path as a directory and look for its index.html
    const indexPath = path.join(resolved, "index.html");
    file = Bun.file(indexPath);

    if (!(await file.exists())) {
      return new Response("Not Found", { status: 404 });
    }
  }

  const ext = path.extname(file.name).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}