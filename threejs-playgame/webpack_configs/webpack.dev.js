// utils
const merge = require( 'webpack-merge' );
// configs
const commons = require( './webpack.common.js' );
const path = require('path');

/* --------------------------- main ---------------------------- */
module.exports = [ merge( commons, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      // contentBase: './build',
      contentBase: path.join(__dirname, '../src'),
      // disableHostCheck: true,
      hot: true,
      port: 9200
    }
  } )
];