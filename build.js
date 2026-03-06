import { build as esbuild } from 'esbuild';
import { execSync } from 'child_process';

async function build(options) {
  const { label, platform, ...esbuildOptions } = options;

  const start = performance.now();

  const result = await esbuild({
    metafile: true,
    platform,
    ...esbuildOptions,
  });

  // Determine output file size from metafile
  let sizeInfo = '';
  if (esbuildOptions.outfile) {
    const output = result.metafile.outputs[esbuildOptions.outfile];
    if (output?.bytes != null) sizeInfo = ` • ${(output.bytes / 1024).toFixed(1)} kB`;
  }

  console.log(`${label ?? esbuildOptions.outfile} (${Math.round(performance.now() - start)} ms${sizeInfo})`);
  return result;
}

async function main() {
  // Build all bundles in parallel
  await Promise.all([
    build({
      label: 'Main (Node ESM)',
      entryPoints: ['src/index.js'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/index.js',
      external: ['chokidar', 'chalk', 'picomatch'],
      sourcemap: true,
    }),
    build({
      label: 'Client ESM',
      entryPoints: ['src/client.js'],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      outfile: 'dist/client.js',
      sourcemap: true,
    }),
    build({
      label: 'Client IIFE',
      entryPoints: ['src/client.js'],
      bundle: true,
      platform: 'browser',
      format: 'iife',
      globalName: 'HMR',
      outfile: 'dist/client.iife.js',
      sourcemap: true,
    }),
    build({
      label: 'Client IIFE (minified)',
      entryPoints: ['src/client.js'],
      bundle: true,
      platform: 'browser',
      format: 'iife',
      globalName: 'HMR',
      minify: true,
      outfile: 'dist/client.iife.min.js',
      sourcemap: true,
    }),
  ]);

  // Generate TypeScript declaration files from JSDoc annotations.
  // esbuild strips all JSDoc during bundling, so tsc handles declarations separately.
  // This preserves @example, @param, and @typedef blocks so IDEs can surface them via IntelliSense.
  const tscStart = performance.now();
  execSync('tsc --project tsconfig.json', { stdio: 'inherit' });
  console.log(`\nType declarations (${Math.round(performance.now() - tscStart)} ms)`);
}

main().catch(() => {
  console.error('\nBuild failed');
  process.exit(1);
});