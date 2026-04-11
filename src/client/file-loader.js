/** Handles loading and hot reloading of JavaScript and CSS files via blob URLs. */
export class FileLoader {
  constructor(httpUrl, { iframeTarget = null, iframeOrigin = '*', css = 'iframe' } = {}) {
    this.httpUrl = httpUrl;
    /**
     * When set, JS and module files are fetched in the parent context and forwarded
     * to this window via postMessage instead of being injected as DOM elements.
     * CSS routing is controlled separately by the `css` option.
     * @type {Window | null}
     */
    this.iframeTarget = iframeTarget;
    /** @type {string} */
    this.iframeOrigin = iframeOrigin;
    /**
     * Controls where CSS files go when `iframeTarget` is set.
     * - `'iframe'` -> forward only, skip parent injection (default)
     * - `'parent'` -> load normally in parent, do not forward
     * - `'both'`   -> load in parent via `<link>` and forward to iframe
     * @type {'iframe' | 'parent' | 'both'}
     */
    this.css = css;
    /**
     * Debounce state per file. Stores { timeout, resolvers[] } so that
     * when a rapid second change clears the first timeout, the first
     * caller's Promise still resolves with the final load result.
     * @type {Map<string, { timeout: number, resolvers: Function[] }>}
     */
    this.loadQueue = new Map();
    /**
     * Load counter per file used for cache busting.
     * Produces short URLs like Logger.js?v=3 which keeps
     * browser stack traces readable.
     * @type {Map<string, number>}
     */
    this.versions = new Map();
  }

  async loadFile(path) {
    const isCSS = path.endsWith('.css');
    const isModule = path.endsWith('.mjs');

    if (isCSS) return await this.loadCSS(path);
    if (isModule) return await this.loadModule(path);
    return await this.loadScript(path);
  }

  // Load CSS atomically: append new <link>, wait for it to load, then remove
  // the old one. This fixes the brief flash of unstyled content that
  // happens when you remove the old sheet before the new one is parsed.
  async loadCSS(path) {
    const url = this.makeUrl(path);
    const toIframe = this.iframeTarget && this.css !== 'parent';
    const toParent = !this.iframeTarget || this.css !== 'iframe';

    const ops = [];

    if (toIframe) {
      ops.push(
        fetch(url).then(r => {
          if (!r.ok) throw new Error(`Failed to fetch CSS: ${path} (${r.status})`);
          return r.text();
        }).then(code => this._inject('css', code, path))
      );
    }

    if (toParent) {
      ops.push(this._loadCSSInParent(path, url));
    }

    const results = await Promise.allSettled(ops);
    const failed = results.find(r => r.status === 'rejected');
    if (failed) throw failed.reason;
    return true;
  }

  _loadCSSInParent(path, url) {
    const existing = document.querySelector(`link[data-file="${path}"]`);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-file', path);

    return new Promise((resolve, reject) => {
      link.onload = () => {
        if (existing) existing.remove();
        resolve(true);
      };
      link.onerror = () => {
        link.remove();
        reject(new Error(`Failed to load CSS: ${path}`));
      };
      document.head.appendChild(link);
    });
  }

  async loadModule(path) {
    const url = this.makeUrl(path);

    if (this.iframeTarget) {
      const code = await fetch(url).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch module: ${path} (${r.status})`);
        return r.text();
      });
      await this._inject('module', code, path);
      return true;
    }

    await import(url);
    return true;
  }

  async loadScript(path) {
    const url = this.makeUrl(path);

    const existing = document.querySelector(`script[data-file="${path}"]`);
    if (existing) existing.remove();

    if (this.iframeTarget) {
      const code = await fetch(url).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch script: ${path} (${r.status})`);
        return r.text();
      });
      await this._inject('script', code, path);
      return true;
    }

    const script = document.createElement('script');
    script.src = url;
    script.setAttribute('data-file', path);

    return new Promise((resolve, reject) => {
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to load script: ${path}`));
      document.head.appendChild(script);
    });
  }

  // Debounce reloads within 100ms.
  // Calls in the same window share a single load and all receive the result.
  // Fixes prior behavior where only the last caller's Promise resolved.
  async reloadFile(path) {
    return new Promise((resolve, reject) => {
      if (this.loadQueue.has(path)) {
        const entry = this.loadQueue.get(path);
        clearTimeout(entry.timeout);
        entry.resolvers.push({ resolve, reject });
        entry.timeout = setTimeout(() => this._flushReload(path), 100);
      } else {
        const entry = {
          timeout: setTimeout(() => this._flushReload(path), 100),
          resolvers: [{ resolve, reject }]
        };
        this.loadQueue.set(path, entry);
      }
    });
  }

  async _flushReload(path) {
    const entry = this.loadQueue.get(path);
    this.loadQueue.delete(path);

    try {
      const success = await this.loadFile(path);
      for (const { resolve } of entry.resolvers) resolve(success);
    } catch (e) {
      for (const { reject } of entry.resolvers) reject(e);
    }
  }

  async removeFile(path) {
    // Cancel any pending reload debounce for this file
    if (this.loadQueue.has(path)) {
      const entry = this.loadQueue.get(path);
      clearTimeout(entry.timeout);
      for (const { reject } of entry.resolvers) reject(new Error(`File removed: ${path}`));
      this.loadQueue.delete(path);
    }

    if (this.iframeTarget) {
      await this._postAndAwaitAck({ type: 'hmr:remove', file: path });
    } else {
      const el = document.querySelector(`[data-file="${path}"]`);
      if (el) {
        el.remove();
        await Promise.resolve();
      }
    }

    // Reset version so the next load starts from v=1 again
    this.versions.delete(path);
  }

  // Increment the version counter for individual files and return a versioned URL
  makeUrl(path) {
    const v = (this.versions.get(path) ?? 0) + 1;
    this.versions.set(path, v);
    return `${this.httpUrl}${path}?v=${v}`;
  }
  // Post a message and resolve once the stub sends back hmr:ack
  _postAndAwaitAck(message) {
    return new Promise((resolve) => {
      const onAck = (e) => {
        if (e.source !== this.iframeTarget) return;
        let data;
        try { data = JSON.parse(e.data); } catch { return; }
        if (data?.type !== 'hmr:ack') return;
        window.removeEventListener('message', onAck);
        resolve();
      };
      window.addEventListener('message', onAck);
      this.iframeTarget.postMessage(JSON.stringify(message), this.iframeOrigin);
    });
  }

  _inject(kind, code, file) {
    return this._postAndAwaitAck({ type: 'hmr:inject', kind, code, file });
  }
}