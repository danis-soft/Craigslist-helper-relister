const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
      content_script: './js/content_script.js',
    // options: './options.js',
      common_defs: '/js/common_defs.js',
      common_storage: '/js/common_storage.js',
      background: './background.js',
      popup: '/js/popup.js'
  },
  mode: 'development',
 /// devtool: "inline-source-map",
  devtool: 'cheap-module-source-map',
  output: {
	path: `${__dirname}/webpack_dist`,
    filename: '[name].js',
  },
};