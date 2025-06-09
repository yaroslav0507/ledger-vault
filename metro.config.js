const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@/shared': path.resolve(__dirname, 'src/shared'),
  '@/features': path.resolve(__dirname, 'src/features'),
  '@/app': path.resolve(__dirname, 'src/app'),
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

module.exports = config; 