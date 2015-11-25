var path = require('path');
module.exports = {
  entry: './src/map.module.js',
  output: {
    path: __dirname,
    filename: 'dist/map.js'
  },
  module: {
    loaders: [{
        test: /\.js$/,
        loaders: ['babel-loader', 'ng-annotate']
      }
    ]
  }
};
