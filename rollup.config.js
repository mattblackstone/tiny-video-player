import preset from '@babel/preset-env';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const isBrowser = String(process.env.NODE_ENV).includes('browser');
const isMinified = String(process.env.NODE_ENV).includes('min');

const output = isBrowser ? [
  {
    file: 'index.js',
    format: 'iife',
    name: 'TinyVideoPlayer',
    strict: false
  }
] : [
  {
    file: 'index.cjs',
    format: 'cjs',
    strict: false
  }
];

const plugins = [
  babel({
    babelrc: false,
    presets: [
      [preset, {
        corejs: 3,
        loose: true,
        modules: false,
        useBuiltIns: 'entry'
      }]
    ]
  })
].concat(isMinified ? terser() : []);

export default {
  input: 'index.mjs',
  output,
  plugins
};