// Export the RlottiePlayer component
import RlottiePlayer from './RlottiePlayer.vue';

// Import asset URL resolver from centralized location
import { getAssetUrl } from '../../assets/index.js';

// Function to resolve WASM asset paths based on imported assets
function resolveWasmPath(fileName) {
  return getAssetUrl(fileName) || `/${fileName}`;
}

// Export component properties for global plugin use
export { RlottiePlayer };

// Create Vue plugin
const plugin = {
  install(app, options = {}) {
    // Register the component globally
    app.component('RlottiePlayer', RlottiePlayer);
    
    // Make path resolution available globally
    app.config.globalProperties.$rlottieWasmPath = (fileName) => {
      return options.wasmPath ? `${options.wasmPath}/${fileName}` : resolveWasmPath(fileName);
    };
  }
};

// Export the component as default for direct import
export default plugin;
