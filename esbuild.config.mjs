import process from 'node:process';
import esbuild from 'esbuild';
import info from './package.json' with { type: 'json' };

const banner = '#!/usr/bin/env node';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: ['commitlint'],
  format: 'esm',
  platform: 'node',
  target: 'node2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: `bin/${info.name}.js`,
  minify: prod,
  minifySyntax: prod,
  minifyIdentifiers: prod,
  minifyWhitespace: prod,
  define: {
    'process.env.VERSION': `'${info.version}'`,
  },
  packages: 'external', // This will make esbuild treat all packages in node_modules as external
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
