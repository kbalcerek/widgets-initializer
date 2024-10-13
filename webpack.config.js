const path = require('path');
  
module.exports = (env) => {
  const serverConfig = {
    target: 'node',
    entry: './src/index.js',
    mode: env.dev ? 'development' : 'production',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.node.js',
      
      library: {
        type: 'commonjs-static',
      },
    },
  };
  
  const clientConfig = {
    target: 'web',
    entry: './src/index.js',
    mode: env.dev ? 'development' : 'production',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.js',
      
      library: {
        type: 'commonjs-static',
      },
    },
  };
  
  const scriptConfig = {
    target: 'web',
    entry: './src/index.js',
    mode: env.dev ? 'development' : 'production',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'lib.script.js',
  
      library: 'MyLibrary',
    },
  };

  return [serverConfig, clientConfig, scriptConfig];
}