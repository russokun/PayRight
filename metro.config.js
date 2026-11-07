const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
 
// inlineRem: 16 → 1rem = 16 px también en nativo (NativeWind usa 14 por defecto), igual que la web:
// así `min-h-11` son los 44 px del objetivo táctil y los tamaños de texto coinciden con payright-web.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 })
