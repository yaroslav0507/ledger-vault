const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const os = require('os');

// Workaround for availableParallelism
if (!os.availableParallelism) {
  os.availableParallelism = () => os.cpus().length;
}

const config = getDefaultConfig(__dirname);

// Add support for path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/shared': path.resolve(__dirname, 'src/shared'),
  '@/features': path.resolve(__dirname, 'src/features'),
  '@/app': path.resolve(__dirname, 'src/app'),
  'better-sqlite3': path.resolve(__dirname, 'shimEmpty.js'),
  '@nozbe/watermelondb/adapters/sqlite/sqlite-node/Database': path.resolve(__dirname, 'shimEmpty.js'),
};

// GitHub Pages configuration
if (process.env.NODE_ENV === 'production') {
  config.resolver.platforms = ['web', 'native'];
  
  // Add web-specific configuration
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  };
}

const extraModules = config.resolver.extraNodeModules || {};
extraModules['better-sqlite3'] = path.resolve(__dirname, 'shimEmpty.js');
extraModules['@nozbe/watermelondb/adapters/sqlite/sqlite-node/Database'] = path.resolve(__dirname, 'shimEmpty.js');
config.resolver.extraNodeModules = extraModules;

module.exports = config; 