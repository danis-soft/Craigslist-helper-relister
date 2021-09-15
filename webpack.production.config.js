const path = require('path');
const { env } = require('process');
const webpack = require('webpack');
const WebpackObfuscator = require('webpack-obfuscator');

console.log("We are in the production webconfig");
console.log("npm_lifecycle_event =" + env.npm_lifecycle_event);
//console.log(env);

module.exports = {

  entry: {
        content_script: './js/content_script.js',
       // options: './options.js',
        common_defs: '/js/common_defs.js',
        common_storage: '/js/common_storage.js',
        background: './background.js',
        popup: '/js/popup.js'
  },
  output: {
    path: `${__dirname}/webpack_dist`,
      filename: '[name].js',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '@license\n' +
      ' - This file is part of Craigslist Helper chrome extension\n' +
      ' - Copyright (C) 2020 DaniS Software\n' + 
      ' - Chrome Extension to update and repost expired Craigslist listing in bulk\n'
    })
  ]
}

if( env.npm_lifecycle_event === 'production-obfuscated' )
{
  console.log("Adding production obfuscation plugin");

  module.exports.plugins.push(new WebpackObfuscator ({
    rotateStringArray: true
  }, 
  [
      'background.js'
  ]))
}

