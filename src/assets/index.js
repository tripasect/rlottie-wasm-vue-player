/**
 * Asset URL resolver for rlottie-vue-player
 * 
 * This module handles the loading of WASM and JS assets in both development and production environments.
 * In development, it uses Vite's ?url import suffix to get the correct URLs.
 * In production, it assumes assets are in the /assets directory relative to the package.
 */

// In development, use Vite's ?url import suffix
let rlottieWasmUrl;
let rlottieWasmBinaryUrl;
let rlottieModuleUrl;
let rlottieHandlerUrl;

try {
  // Dynamic imports for development with Vite
  const wasmJsModule = new URL('./rlottie-wasm.js', import.meta.url);
  const wasmBinaryModule = new URL('./rlottie-wasm.wasm', import.meta.url);
  const moduleJsModule = new URL('./rlottie-module.js', import.meta.url);
  const handlerJsModule = new URL('./rlottie-handler.js', import.meta.url);
  
  rlottieWasmUrl = wasmJsModule.href;
  rlottieWasmBinaryUrl = wasmBinaryModule.href;
  rlottieModuleUrl = moduleJsModule.href;
  rlottieHandlerUrl = handlerJsModule.href;
} catch (e) {
  // Fallback for production build
  const basePath = '/assets/';
  rlottieWasmUrl = `${basePath}rlottie-wasm.js`;
  rlottieWasmBinaryUrl = `${basePath}rlottie-wasm.wasm`;
  rlottieModuleUrl = `${basePath}rlottie-module.js`;
  rlottieHandlerUrl = `${basePath}rlottie-handler.js`;
}

export {
  rlottieWasmUrl,
  rlottieWasmBinaryUrl,
  rlottieModuleUrl,
  rlottieHandlerUrl
};

// Helper function to get asset URL by name
export function getAssetUrl(fileName) {
  switch (fileName) {
    case 'rlottie-wasm.js':
      return rlottieWasmUrl;
    case 'rlottie-wasm.wasm':
      return rlottieWasmBinaryUrl;
    case 'rlottie-module.js':
      return rlottieModuleUrl;
    case 'rlottie-handler.js':
      return rlottieHandlerUrl;
    default:
      return null;
  }
}
