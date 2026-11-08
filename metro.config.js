const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite procesar archivos WebAssembly de expo-sqlite
config.resolver.assetExts.push('wasm');

module.exports = config;