var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

//var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

module.exports = {
  context: __dirname + '/src/',
  entry: {
    index: './static/js/index.js',
    resume: './static/js/resume.js'
    //photos: './static/js/photos.js'
  },
  output: {
    path: 'src/build/js/',
    filename: '[name].js',
    publicPath: '/src/build/js/'
  },
  module: {
    loaders: [
      //{ test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') },
      { test: /\.(png|jpg|svg|otf|eot|ttf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=8192' }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      _: 'underscore'
    }),
    new ExtractTextPlugin('[name].css')
  ]
};
