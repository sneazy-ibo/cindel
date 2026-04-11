export function stub() {
  const byFile = (tag, file) => document.querySelector(`${tag}[data-file="${CSS.escape(file)}"]`);
  const removeIfExists = (el) => { if (el) el.remove(); };

  const injectScript = async (kind, code, file) => {
    const url = URL.createObjectURL(new Blob([code + `\n//# sourceURL=${file}`], { type: 'text/javascript' }));
    try {
      if (kind === 'module') {
        // await import() so the module fully evaluates before the ack is sent,
        // preserving the sequential load order the parent relies on
        await import(url);
      } else {
        const script = document.createElement('script');
        script.src = url;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Failed to execute script: ${file}`));
          document.documentElement.appendChild(script);
        });
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const injectStyle = async (code, file) => {
    const existing = byFile('link', file);
    const url = URL.createObjectURL(new Blob([code + `\n/*# sourceURL=${file} */`], { type: 'text/css' }));
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.file = file;
    await new Promise((resolve, reject) => {
      link.onload = () => { URL.revokeObjectURL(url); resolve(); };
      link.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Failed to load CSS: ${file}`)); };
      document.head.appendChild(link);
    });
    // Atomic swap: remove old sheet only after new one has parsed
    removeIfExists(existing);
  };

  window.addEventListener('message', async (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    if (!data?.type) return;

    // Sandboxed iframes may expose e.origin as 'null' (opaque origin)
    const ackOrigin = e.origin && e.origin !== 'null' ? e.origin : '*';
    const ack = () => e.source?.postMessage(JSON.stringify({ type: 'hmr:ack' }), ackOrigin);

    if (data.type === 'hmr:remove') {
      removeIfExists(document.querySelector(`[data-file="${CSS.escape(data.file)}"]`));
      ack();
      return;
    }

    if (data.type !== 'hmr:inject') return;

    const { kind, code, file } = data;
    try {
      if (kind === 'script' || kind === 'module') await injectScript(kind, code, file);
      else if (kind === 'css') await injectStyle(code, file);
    } catch (err) {
      console.error(`Failed to inject ${file}:`, err.message ?? err, '\n' + err.stack);
      // Ack even on failure so the parent's Promise doesn't hang
    }
    ack();
  });

  window.parent.postMessage(JSON.stringify({ type: 'hmr:ready' }), '*');
}