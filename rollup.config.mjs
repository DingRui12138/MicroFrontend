import path from 'path'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
// import commonjs from '@rollup/plugin-commonjs'

const isDev = () => {
  return process.env.NODE_ENV === 'development'
}

// https://rollupjs.org/command-line-interface/#bundleconfigascjs
export default {
  input: './src/index.ts',
  output: {
    // file: path.resolve(__dirname, './lib/index.js'),
    name: 'singleSpa',
    dir: './dist',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    // commonjs({
    //   include: /node_module/,
    // }),
    typescript(
      // { compilerOptions: {lib: ["es5", "es6", "dom"], target: "es5"}}
    ),
    terser({
      compress: {
        drop_console: !isDev(),
      },
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    nodeResolve(),
    isDev() && livereload(),
    isDev() &&
      serve({
        open: true,
        openPage: '/index.html',
      }),
  ],
}
