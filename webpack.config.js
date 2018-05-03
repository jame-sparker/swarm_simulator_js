var path = require('path');

module.exports = {
  entry: './src/js/index.js',
  mode: 'development',
  watch: true,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    contentBase: __dirname + '/src', // `__dirname` is root of the project
  }
};