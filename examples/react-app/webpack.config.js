const { merge } = require('webpack-merge')
const singleSpaDefaults = require('webpack-config-single-spa-react-ts')
const { name } = require('./package.json')

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: 'wayne',
    projectName: 'react-app',
    webpackConfigEnv,
    argv,
  })

  return merge(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
    output: {
      // filename: 'index.js',
      library: {
        // name: 'wtf',
        type: 'system',
      },
    },
    devtool: 'source-map',
    externals: ['react', 'react-dom', 'react-router-dom'],
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            // 将 JS 字符串生成为 style 节点
            'style-loader',
            // 将 CSS 转化成 CommonJS 模块
            'css-loader',
            // 将 Sass 编译成 CSS
            'sass-loader',
          ],
        },
      ],
    },
  })
}
