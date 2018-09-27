const webpack = require('webpack')
const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    server: './server.js'
  },
  devtool: 'inline-source-map',
  plugins: [
    new Dotenv({
    	path: './.env'
    })
  ]
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};