export function stub() {
  const byFile = (tag, file) => document.querySelector(`${tag}[data-file="${CSS.escape(file)}"]`);
  const removeIfExists = (el) => { if (el) el.remove(); };

  const injectScript = (kind, code, file) => {
    removeIfExists(byFile('script', file));
    const script = document.createElement('script');
    if (kind === 'module') script.type = 'module';
    script.textContent = code;
    script.dataset.file = file;
    document.documentElement.appendChild(script);
    script.remove();
  };

  const injectStyle = (code, file) => {
    const existing = byFile('style', file);
    const style = document.createElement('style');
    style.textContent = code;
    style.dataset.file = file;
    document.head.appendChild(style);
    removeIfExists(existing);
  };

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data?.type) return;
    if (data.type === 'hmr:remove') { removeIfExists(document.querySelector(`[data-file="${CSS.escape(data.file)}"]`)); return; }
    if (data.type !== 'hmr:inject') return;
    const { kind, code, file } = data;
    if (kind === 'script' || kind === 'module') injectScript(kind, code, file);
    else if (kind === 'css') injectStyle(code, file);
  });

  // Signal the parent that stub is ready to receive injections
  window.parent.postMessage({ type: 'hmr:ready' }, '*');
}