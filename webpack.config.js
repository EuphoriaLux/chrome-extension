// webpack.config.js
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',  // switch to 'production' for your final build

  entry: {
    background: './src/background.js',
    contentScript: './src/contentScript.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    window: './src/window/window.js'  // if used as a separate window
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',  // e.g. background.bundle.js, popup.bundle.js, etc.
    clean: true
  },

  module: {
    rules: [
      // If you want to handle JS with Babel, TypeScript, or CSS in JS,
      // you'd add loaders here.
      // e.g.:
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   use: 'babel-loader'
      // },
      // {
      //   test: /\.css$/,
      //   use: ['style-loader', 'css-loader']
      // }
    ]
  },

  devtool: 'cheap-module-source-map',

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        // Copy manifest.json
        { 
          from: path.resolve(__dirname, 'manifest.json'), 
          to: path.resolve(__dirname, 'dist') 
        },
        // Copy icons
        { 
          from: path.resolve(__dirname, 'src/assets'), 
          to: path.resolve(__dirname, 'dist/assets') 
        },
        // Copy HTML files
        { 
          from: path.resolve(__dirname, 'src/popup/popup.html'), 
          to: path.resolve(__dirname, 'dist/popup.html')
        },
        { 
          from: path.resolve(__dirname, 'src/options/options.html'), 
          to: path.resolve(__dirname, 'dist/options.html')
        },
        { 
          from: path.resolve(__dirname, 'src/window/window.html'), 
          to: path.resolve(__dirname, 'dist/window.html')
        },
        // Copy styles.css
        {
          from: path.resolve(__dirname, './styles.css'),
          to: path.resolve(__dirname, 'dist')
        }
      ]
    })
  ]
};
