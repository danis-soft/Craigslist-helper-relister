//NOT USED CURRENTLY - TO BE DELETED
const path = require('path');
const { env } = require('process');
const webpack = require('webpack');
const WebpackObfuscator = require('webpack-obfuscator');


module.exports = (env)=> ({

  entry: {
        content_script: './js/content_script.js',
        options: './options.js',
        common: '/js/common.js'
  },
  output: {
    path: `${__dirname}/webpack_dist`,
      filename: '[name].js',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '@license\n' +
      ' This file is part of Craigslist Helper chrome extension\n' +
      ' - Copyright (C) 2020 DaniS Software\n' + 
      'Chrome Extension to update and repost expired Craigslist listing in bulk\n'
    })
  ]
})

if( env.mode === 'production' )
{
  module.exports.plugins.push(new WebpackObfuscator ({
    rotateStringArray: true
  }, 
  [
    //  'excluded_bundle_name.js'
  ]))
}


