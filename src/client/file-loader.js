/** Handles loading and hot reloading of JavaScript and CSS files via blob URLs. */
export class FileLoader {
  constructor(httpUrl) {
    this.httpUrl = httpUrl;
    /**
     * Debounce state per file. Stores { timeout, resolvers[] } so that
     * when a rapid second change clears the first timeout, the first
     * caller's Promise still resolves with the final load result.
     * @type {Map<string, { timeout: number, resolvers: Function[] }>}
     */
    this.loadQueue = new Map();
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
    const existing = document.querySelector(`link[data-file="${path}"]`);
    const url = this.makeUrl(path);

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

  // Replace the existing module script with a cache busted URL.
  // Changing the URL makes the browser treat it as a new module
  // and execute it from scratch.
  async loadModule(path) {
    const url = this.makeUrl(path);

    const existing = document.querySelector(`script[data-file="${path}"]`);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    script.setAttribute('data-file', path);

    return new Promise((resolve, reject) => {
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to execute module: ${path}`));
      document.head.appendChild(script);
    });
  }

  async loadScript(path) {
    const url = this.makeUrl(path);

    const existing = document.querySelector(`script[data-file="${path}"]`);
    if (existing) existing.remove();

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

    const el = document.querySelector(`[data-file="${path}"]`);
    if (el) {
      el.remove();
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Cache bust with timestamp + random to avoid duplicate URLs on rapid reloads.
  makeUrl(path) {
    const cb = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    return `${this.httpUrl}${path}?cb=${cb}`;
  }
}