// webpack.config.js
const path = require('path');

module.exports = {
  // Set to "development" or "production"
  mode: 'development',

  // Define multiple entry points if needed
  entry: {
    // This will bundle background.js into "background.bundle.js"
    background: './linkedin-enhancer/src/background.js',
    // If you have a content script or popup, add additional entries here:
    contentScript: './linkedin-enhancer/src/contentScript.js',
  },

  // Output folder and naming
  output: {
    // The absolute path to the folder where bundled files will go
    path: path.resolve(__dirname, 'dist'),
    // [name] will be "background" or "contentScript" from the entry object
    filename: '[name].bundle.js',
  },

  // Module rules/loaders go here if you need to handle anything other than plain JS
  module: {
    rules: [
      // For example, if you want to transpile ES6/TypeScript:
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   use: {
      //     loader: 'babel-loader',
      //   },
      // },
    ],
  },

  // If your extension does not need source maps, you can omit this
  devtool: 'cheap-module-source-map',
};
