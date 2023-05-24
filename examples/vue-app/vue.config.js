const { defineConfig } = require('@vue/cli-service')
const { name } = require('./package.json')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  configureWebpack: {
    output: {
      // library: `${name}-[name]`,
      libraryTarget: 'system',
      chunkLoadingGlobal: `webpackJsonp_${name}`,
    },
    // externals: ['vue', 'vue-router'],
  },
})
