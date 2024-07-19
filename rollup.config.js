import path from 'node:path'

import {nodeResolve} from '@rollup/plugin-node-resolve'
import commonjs      from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import unassert      from 'rollup-plugin-unassert'
import terser        from '@rollup/plugin-terser'
// import alias         from '@rollup/plugin-alias'

import Package from './package.json' with {type: 'json'}

export default /** @type {import('rollup').RollupOptions}*/ [
  {
    input   : './index.js',
    output  : {format: 'umd', file: Package.browser, name: 'pug'},
    plugins : [
      nodeResolve(),
      commonjs(),
      nodePolyfills(),
      unassert(),
      terser(),
      // alias({
      //   find: 'assert',
      //   replacement: path.resolve(path.resolve(), 'assert.js')
      // }),
    ],
  },

  {
    input   : './index.js',
    output  : [
            {format: 'es',  file: Package.module },
            {format: 'cjs', file: Package.main   },
    ],
  },
]
