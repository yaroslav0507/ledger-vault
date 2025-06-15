const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'better-sqlite3': path.resolve(__dirname, 'shimEmpty.js'),
    '@nozbe/watermelondb/adapters/sqlite/sqlite-node/Database': path.resolve(__dirname, 'shimEmpty.js'),
  };
  return config;
}; 