import { HMRClient } from '../dist/client.js';

const hmr = new HMRClient({
  port: 2000,
  secure: true,
  cold: ['**/*.cold.js'],

  getOverrideTarget: (file, allFiles) => {
    const name = file.split('/').pop();
    const match = name.match(/^override\.(.+)$/);
    if (!match) return null;

    const target = file.replace(name, match[1]);
    return allFiles?.includes(target) ? target : null;
  },
});

hmr.on('cold', (file) => {
  console.log(`Cold file changed: ${file} -> forcing hard reload`);
  window.location.reload();
});

await hmr.connect();