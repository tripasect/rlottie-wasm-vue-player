import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';
import path from 'path';

// Custom plugin to handle WASM and JS assets
function handleWasmAssets() {
  return {
    name: 'handle-wasm-assets',
    // Use buildStart hook to ensure this runs before the build
    buildStart() {
      // Define the files we need to handle
      const files = [
        'rlottie-wasm.js',
        'rlottie-wasm.wasm',
        'rlottie-module.js',
        'rlottie-handler.js'
      ];
      
      // Add the files to the build as assets
      files.forEach(file => {
        const filePath = resolve(__dirname, 'src/assets', file);
        if (fs.existsSync(filePath)) {
          this.emitFile({
            type: 'asset',
            fileName: `assets/${file}`,
            source: fs.readFileSync(filePath)
          });
          console.log(`Added ${file} as a build asset`);
        } else {
          console.warn(`File ${filePath} not found`);
        }
      });
    },
    // Clean up duplicated files after the build
    closeBundle() {
      // List of files to remove from root directory
      const filesToRemove = [
        'rlottie-wasm.js',
        'rlottie-wasm.wasm',
        'rlottie-module.js',
        'rlottie-handler.js',
        'index.js',
        'main.js',
        'sample.json',
        'style.css'
      ];
      
      filesToRemove.forEach(file => {
        const filePath = resolve(__dirname, 'dist', file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Removed duplicate file: ${file}`);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), handleWasmAssets()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'RlottieVuePlayer',
      fileName: (format) => `rlottie-vue-player.${format}.js`
    },
    rollupOptions: {
      // Make sure to externalize dependencies that should not be bundled
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        globals: {
          vue: 'Vue'
        }
      }
    },
    // Copy necessary assets to dist folder
    assetsDir: 'assets',
    // Make sure to generate source maps for debugging
    sourcemap: true
  }
});
