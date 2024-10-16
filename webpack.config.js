const path = require('path');
const webpack = require('webpack');
  
module.exports = (env) => {
  const commonConfig = {
    entry: './src/index.js',
    mode: env.dev ? 'development' : 'production',
    // plugins: [
    //   new webpack.DefinePlugin({
    //     WEBPACK_isProd: JSON.stringify(!env.dev),
    //   })
    // ]
  };

  const serverConfig = {
    ...commonConfig,
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.node.js',
      
      library: {
        type: 'commonjs-static',
      },
    },
  };
  
  const clientConfig = {
    ...commonConfig,
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.js',
      
      library: {
        type: 'commonjs-static',
      },
    },
  };
  
  const scriptConfig = {
    ...commonConfig,
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.script.js',
  
      library: 'MyLibrary',
    },
  };

  return [serverConfig, clientConfig, scriptConfig];
}