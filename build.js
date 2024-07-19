import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'esm',
  outfile: 'emjay.js',
  alias: {
    'assert' : './assert.js',
  },
})
