// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolution for the App.js file
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  App: path.resolve(__dirname, 'App.js'),
};

// Add support for importing from the root directory
config.watchFolders = [path.resolve(__dirname)];

module.exports = config; 