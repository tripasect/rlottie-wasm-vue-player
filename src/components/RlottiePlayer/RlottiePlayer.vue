<template>
  <div 
    class="rlottie-player-container" 
    :style="containerStyle"
    ref="container"
  >
    <canvas 
      ref="canvas" 
      :style="canvasStyle"
    ></canvas>
  </div>
</template>

<script>
import { markRaw } from 'vue';

// Import asset URLs from centralized location
import { getAssetUrl } from '../../assets/index.js';

export default {
  name: 'RlottiePlayer',
  props: {
    // Animation source - stringified JSON or URL to JSON file
    src: {
      type: [String, Object],
      required: true
    },
    // Width of the player
    width: {
      type: [Number, String],
      default: 300
    },
    // Height of the player
    height: {
      type: [Number, String],
      default: 300
    },
    // Whether to autoplay the animation
    autoplay: {
      type: Boolean,
      default: false
    },
    // Whether to loop the animation
    loop: {
      type: Boolean,
      default: true
    },
    // Playback speed (1 is normal speed)
    speed: {
      type: Number,
      default: 1
    },
    // Background color
    background: {
      type: String,
      default: 'transparent'
    },
    // Layer customizations - format: {keypath: {color: {r, g, b}, opacity: number, strokeWidth: number, position: {x, y}, scale: {width, height}, rotation: number}}
    layers: {
      type: Object,
      default: () => ({})
    },
    // Optional custom canvas ID
    canvasId: {
      type: String,
      default: null
    },
    // Path to asset files (rlottie-wasm.js, rlottie-module.js, rlottie-handler.js)
    assetPath: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isInitialized: false,
      isLoaded: false,
      isPlaying: false,
      rlottieHandler: null,
      modulesLoaded: {
        rlottieWasm: false,
        rlottieModule: false,
        rlottieHandler: false
      },
      totalFrames: 0,
      currentFrame: 0,
      animationData: null,
      loadFailed: false,
      loadFailureReason: '',
      frameRequestId: null,
      canvasId_internal: null // Will be set in created hook
    };
  },
  
  created() {
    // Generate a unique canvas ID based on the canvasId prop or a timestamp
    this.canvasId_internal = this.canvasId || `rlottie-canvas-${Date.now()}`;
    console.log(`Canvas ID initialized to: ${this.canvasId_internal}`);
  },
  computed: {
    containerStyle() {
      return {
        width: typeof this.width === 'number' ? `${this.width}px` : this.width,
        height: typeof this.height === 'number' ? `${this.height}px` : this.height,
        overflow: 'hidden',
        background: this.background,
        position: 'relative'
      };
    },
    canvasStyle() {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      };
    },
    numericWidth() {
      return typeof this.width === 'number' ? this.width : parseInt(this.width, 10);
    },
    numericHeight() {
      return typeof this.height === 'number' ? this.height : parseInt(this.height, 10);
    }
  },
  watch: {
    src: {
      handler: 'loadAnimation',
      immediate: false
    },
    speed(newSpeed) {
      if (this.rlottieHandler) {
        this.rlottieHandler.setPlaySpeed(newSpeed);
      }
    },
    width() {
      this.updatePlayerSize();
    },
    height() {
      this.updatePlayerSize();
    },
    layers: {
      handler: 'applyLayerCustomizations',
      deep: true
    }
  },
  mounted() {
    // Start loading the required modules when component is mounted
    this.loadModules().then(() => {
      this.initializePlayer();
      this.loadAnimation();
    }).catch(error => {
      console.error('Failed to load rlottie modules:', error);
      this.loadFailed = true;
      this.loadFailureReason = error.message || 'Failed to load required modules';
      this.$emit('error', { message: this.loadFailureReason });
    });
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    loadModules() {
      return new Promise((resolve, reject) => {
        // Configure the Emscripten Module to use our WASM file
        window.Module = window.Module || {};
        window.Module.locateFile = (path) => {
          if (path.endsWith('.wasm')) {
            return this.getAssetPath('rlottie-wasm.wasm');
          }
          return path;
        };
        
        const scriptsConfig = [
          { src: this.getAssetPath('rlottie-wasm.js'), global: 'Module', prop: 'rlottieWasm', name: 'rlottie-wasm.js', type: 'emscripten' },
          { src: this.getAssetPath('rlottie-module.js'), global: 'RLottieModule', prop: 'rlottieModule', name: 'rlottie-module.js', type: 'dependent' },
          { src: this.getAssetPath('rlottie-handler.js'), global: 'RLottieHandler', prop: 'rlottieHandler', name: 'rlottie-handler.js', type: 'dependent' }
        ];

        const timeoutDuration = 15000; // 15 seconds
        let overallTimeout = setTimeout(() => {
          console.error('Overall timeout: Failed to load rlottie modules within the specified time.');
          reject(new Error('Overall timeout loading rlottie modules'));
        }, timeoutDuration);

        const loadScript = (index) => {
          if (index >= scriptsConfig.length) {
            clearTimeout(overallTimeout);
            const allGlobalsDefined = scriptsConfig.every(sc => {
              if (typeof window[sc.global] === 'undefined') {
                console.error(`CRITICAL FINAL CHECK: Global ${sc.global} for ${sc.name} is undefined after all loading attempts.`);
                return false;
              }
              return true;
            });

            if (allGlobalsDefined) {
              console.log('All rlottie modules successfully loaded and globals confirmed.');
              resolve();
            } else {
              console.error('One or more rlottie globals were not defined by the end of the loading sequence.');
              reject(new Error('Failed to define all required rlottie globals.'));
            }
            return;
          }

          const scriptConfig = scriptsConfig[index];

          if (window[scriptConfig.global]) {
            // For Emscripten, also check if it's initialized if Module exists
            if (scriptConfig.type === 'emscripten' && window.Module && !window.Module.calledRun) {
                console.log(`${scriptConfig.name} global ${scriptConfig.global} found, but Emscripten runtime not yet initialized. Proceeding with load logic.`);
            } else {
                console.log(`${scriptConfig.name} already loaded (global ${scriptConfig.global} found and initialized if Emscripten).`);
                this.modulesLoaded[scriptConfig.prop] = true;
                loadScript(index + 1);
                return;
            }
          }
          
          console.log(`Attempting to load ${scriptConfig.name} from ${scriptConfig.src}...`);
          const scriptElement = document.createElement('script');
          scriptElement.src = scriptConfig.src;
          // scriptElement.async = false; // Sequential loading is handled by callbacks

          scriptElement.onload = () => {
            console.log(`${scriptConfig.name} onload event fired.`);
            
            if (scriptConfig.type === 'emscripten') {
              if (typeof window.Module === 'undefined') {
                console.error('window.Module is undefined after rlottie-wasm.js onload. This is unexpected.');
                clearTimeout(overallTimeout);
                reject(new Error('window.Module is undefined after rlottie-wasm.js loaded.'));
                return;
              }

              let emscriptenInitProcessed = false;
              const onEmscriptenRuntimeInitialized = () => {
                if (emscriptenInitProcessed) return;
                emscriptenInitProcessed = true;

                console.log('Emscripten runtime initialized (Module.onRuntimeInitialized callback or calledRun check).');
                if (typeof window.Module === 'undefined') { 
                    console.error('window.Module is undefined at the point of supposed Emscripten initialization!');
                    clearTimeout(overallTimeout);
                    reject(new Error('window.Module vanished during Emscripten initialization.'));
                    return;
                }
                this.modulesLoaded[scriptConfig.prop] = true;
                console.log(`Module ${scriptConfig.global} (${scriptConfig.name}) confirmed loaded and initialized.`);

                if (typeof window.Module.RlottieWasm !== 'function') {
                  console.error('CRITICAL: window.Module.RlottieWasm is not a function even after Emscripten runtime initialization.');
                  clearTimeout(overallTimeout);
                  reject(new Error('window.Module.RlottieWasm is not available after Emscripten runtime initialized.'));
                  return;
                }
                console.log('window.Module.RlottieWasm confirmed to be a function. Preparing to load next script with a micro-delay.');

                setTimeout(() => {
                  loadScript(index + 1);
                }, 0);
              };

              if (window.Module.calledRun) {
                console.log('Emscripten runtime (Module.calledRun) is already true. Proceeding.');
                onEmscriptenRuntimeInitialized();
              } else {
                console.log('Emscripten runtime (Module.calledRun) is false. Setting onRuntimeInitialized callback.');
                window.Module.onRuntimeInitialized = onEmscriptenRuntimeInitialized;
              }

            } else if (scriptConfig.type === 'dependent') {
              if (typeof window[scriptConfig.global] === 'undefined') {
                console.error(`Global ${scriptConfig.global} for ${scriptConfig.name} is undefined after onload.`);
                clearTimeout(overallTimeout);
                reject(new Error(`Global ${scriptConfig.global} for ${scriptConfig.name} is undefined after onload.`));
                return;
              }
              console.log(`Global ${scriptConfig.global} for ${scriptConfig.name} is defined.`);
              this.modulesLoaded[scriptConfig.prop] = true;

              // If the script just loaded was rlottie-module.js, check its global before proceeding to rlottie-handler.js
              if (scriptConfig.prop === 'rlottieModule') {
                if (typeof window.RLottieModule !== 'function') {
                  console.error('CRITICAL: window.RLottieModule is not a function after rlottie-module.js loaded and before loading rlottie-handler.js.');
                  clearTimeout(overallTimeout);
                  reject(new Error('window.RLottieModule is not available for rlottie-handler.js.'));
                  return;
                }
                console.log('window.RLottieModule confirmed to be a function. Proceeding to load rlottie-handler.js.');
              }

              loadScript(index + 1);
            }
          };

          scriptElement.onerror = (event) => {
            console.error(`Failed to load script: ${scriptConfig.name} from ${scriptConfig.src}`, event);
            clearTimeout(overallTimeout);
            reject(new Error(`Failed to load script: ${scriptConfig.name} from ${scriptConfig.src}`));
          };

          document.head.appendChild(scriptElement);
        };

        loadScript(0);
      });
    },
    
    // Helper to get asset path, using the prop, global plugin configuration, or imported assets
    getAssetPath(fileName) {
      // First priority: component prop
      if (this.assetPath) {
        const path = this.assetPath.endsWith('/') ? this.assetPath : `${this.assetPath}/`;
        return `${path}${fileName}`;
      }
      // Second priority: global plugin configuration
      if (this.$rlottieWasmPath) {
        return this.$rlottieWasmPath(fileName);
      }
      // Third priority: use the imported assets from the centralized location
      const assetUrl = getAssetUrl(fileName);
      if (assetUrl) {
        return assetUrl;
      }
      // Fallback to root-relative path
      return `/${fileName}`;
    },
    
    initializePlayer() {
      console.log('Initializing player...');

      // Perform checks in order of dependency
      if (typeof window.Module === 'undefined') {
        console.error('window.Module is undefined. rlottie-wasm.js might have failed.');
        throw new Error('Emscripten Module is not defined. Ensure rlottie-wasm.js loaded correctly.');
      }
      if (typeof window.RLottieModule === 'undefined') {
        console.error('window.RLottieModule is undefined. rlottie-module.js might have failed or depends on an uninitialized Module.');
        throw new Error('RLottieModule is not defined. Ensure rlottie-module.js loaded correctly.');
      }
      if (typeof window.RLottieHandler === 'undefined') {
        console.error('window.RLottieHandler is undefined. rlottie-handler.js might have failed or depends on RLottieModule.');
        throw new Error('RLottieHandler is not defined. Ensure rlottie-handler.js loaded correctly.');
      }
      console.log('All required globals (Module, RLottieModule, RLottieHandler) are defined.');

      const initHandler = () => {
        console.log('Emscripten runtime initialized (or was already). Running initHandler.');
        try {
          if (!this.$refs.canvas) {
            console.error("Canvas element (this.$refs.canvas) not found during initHandler.");
            throw new Error("Canvas element not found for Rlottie player.");
          }
          // HACK: Set canvas ID to what RLottieHandler (version from original project) expects.
          // RLottieHandler(1) makes RLottieModule look for "myCanvas1".
          // A proper fix would be to refactor RLottieHandler to accept a canvas element or ID.
          this.$refs.canvas.id = this.canvasId_internal; 
          console.log(`Canvas ID set to: ${this.$refs.canvas.id}`);
          
          this.rlottieHandler = markRaw(new window.RLottieHandler(this.canvasId_internal)); 
          console.log('RLottieHandler instance created.');
          
          this.rlottieHandler.setPlaySpeed(this.speed);
          this.startRenderLoop();
          this.isInitialized = true;
          this.$emit('init', { handler: this.rlottieHandler });
          this.updatePlayerSize();
          console.log('Player initialized successfully.');
        } catch (error) {
          console.error('Error during player actual initialization (initHandler):', error);
          throw new Error(`Player initialization failed: ${error.message}`);
        }
      };

      // Check if Emscripten runtime is already initialized
      if (window.Module.calledRun) {
        console.log('Emscripten runtime already initialized. Calling initHandler directly.');
        initHandler();
      } else {
        console.log('Emscripten runtime not yet initialized. Setting Module.onRuntimeInitialized callback.');
        window.Module.onRuntimeInitialized = initHandler;
      }
    },
    
    startRenderLoop() {
      const update = () => {
        if (this.rlottieHandler) {
          this.rlottieHandler.render();
          
          // Update current frame data
          if (this.rlottieHandler.rlottieModule && this.rlottieHandler.rlottieModule.length > 0) {
            this.currentFrame = this.rlottieHandler.curFrame;
            
            // Handle looping based on loop prop
            if (!this.loop && this.currentFrame >= this.totalFrames - 1) {
              this.pause();
              this.$emit('complete');
            }
          }
          
          // Continue the loop if playing
          if (this.isPlaying) {
            this.frameRequestId = requestAnimationFrame(update);
          }
        }
      };
      
      if (this.isPlaying) {
        this.frameRequestId = requestAnimationFrame(update);
      }
    },
    
    async loadAnimation() {
      if (!this.isInitialized || !this.src) return;
      
      try {
        let jsonData;
        
        // Handle both string (URL) and object inputs
        if (typeof this.src === 'string') {
          // Check if it's a URL or already a JSON string
          if (this.src.startsWith('http') || this.src.startsWith('/')) {
            // It's a URL, fetch it
            const response = await fetch(this.src);
            if (!response.ok) {
              throw new Error(`Failed to fetch animation: ${response.status} ${response.statusText}`);
            }
            jsonData = await response.text();
          } else {
            // Assume it's already a JSON string
            jsonData = this.src;
          }
        } else {
          // It's an object, stringify it
          jsonData = JSON.stringify(this.src);
        }
        
        // Validate JSON format
        JSON.parse(jsonData); // Will throw if invalid
        
        // Load the animation
        if (this.rlottieHandler) {
          this.rlottieHandler.reload(jsonData);
          this.animationData = jsonData;
          this.totalFrames = this.rlottieHandler.totalFrame;
          this.isLoaded = true;
          
          // Apply any layer customizations
          this.applyLayerCustomizations();
          
          // Autoplay if needed
          if (this.autoplay) {
            this.play();
          }
          
          this.$emit('load', {
            totalFrames: this.totalFrames,
            animationData: jsonData
          });
        }
      } catch (error) {
        console.error('Error loading animation:', error);
        this.loadFailed = true;
        this.loadFailureReason = error.message || 'Failed to load animation';
        this.$emit('error', { message: this.loadFailureReason });
      }
    },
    
    updatePlayerSize() {
      if (!this.rlottieHandler) return;
      
      const width = this.numericWidth;
      const height = this.numericHeight;
      
      // Ensure the canvas dimensions match the container
      this.$refs.canvas.width = width;
      this.$refs.canvas.height = height;
      
      // Notify the handler of size change
      this.rlottieHandler.resize(width, height);
    },
    
    applyLayerCustomizations() {
      if (!this.isLoaded || !this.rlottieHandler) return;
      
      // Apply customizations for each layer
      Object.entries(this.layers).forEach(([keypath, customization]) => {
        // Apply color if specified
        if (customization.color) {
          const { r, g, b } = customization.color;
          this.rlottieHandler.setLayerColor(keypath, r, g, b);
        }
        
        // Apply opacity if specified (0-1)
        if (typeof customization.opacity === 'number') {
          this.rlottieHandler.setLayerOpacity(keypath, customization.opacity);
        }
        
        // Apply stroke width if specified
        if (typeof customization.strokeWidth === 'number') {
          this.rlottieHandler.setStrokeWidth(keypath, customization.strokeWidth);
        }
        
        // Apply position if specified
        if (customization.position) {
          const { x, y } = customization.position;
          this.rlottieHandler.setPosition(keypath, x, y);
        }
        
        // Apply scale if specified
        if (customization.scale) {
          const { width, height } = customization.scale;
          this.rlottieHandler.setScale(keypath, width, height);
        }
        
        // Apply rotation if specified
        if (typeof customization.rotation === 'number') {
          this.rlottieHandler.setRotation(keypath, customization.rotation);
        }
      });
    },
    
    // Public methods exposed to parent components
    play() {
      if (!this.isLoaded) return;
      
      this.isPlaying = true;
      if (this.rlottieHandler) {
        this.rlottieHandler.play();
      }
      // Ensure render loop is running
      if (!this.frameRequestId) {
        this.startRenderLoop();
      }
      this.$emit('play');
    },
    
    pause() {
      this.isPlaying = false;
      if (this.rlottieHandler) {
        this.rlottieHandler.pause();
      }
      // Cancel the animation frame
      if (this.frameRequestId) {
        cancelAnimationFrame(this.frameRequestId);
        this.frameRequestId = null;
      }
      this.$emit('pause');
    },
    
    stop() {
      this.isPlaying = false;
      if (this.rlottieHandler) {
        this.rlottieHandler.stop();
      }
      // Cancel the animation frame
      if (this.frameRequestId) {
        cancelAnimationFrame(this.frameRequestId);
        this.frameRequestId = null;
      }
      this.$emit('stop');
    },
    
    seek(percentage) {
      if (!this.isLoaded) return;
      
      const frameIndex = Math.floor((percentage / 100) * this.totalFrames);
      if (this.rlottieHandler) {
        this.rlottieHandler.seek(frameIndex);
        this.currentFrame = frameIndex;
        this.$emit('seek', { frame: frameIndex, percentage });
      }
    },
    
    getProperties() {
      if (!this.rlottieHandler) return null;
      
      return this.rlottieHandler.getAnimationProperties();
    },
    
    cleanup() {
      // Clean up resources
      if (this.frameRequestId) {
        cancelAnimationFrame(this.frameRequestId);
        this.frameRequestId = null;
      }
      
      this.isPlaying = false;
      this.isLoaded = false;
      
      // If there's a way to destroy the rlottie instance, do it here
      // For example: if (this.rlottieHandler && this.rlottieHandler.destroy) this.rlottieHandler.destroy();
      
      // Remove the canvas ID
      if (this.$refs.canvas) {
        this.$refs.canvas.id = '';
      }
    }
  }
};
</script>

<style scoped>
.rlottie-player-container {
  display: inline-block;
  position: relative;
}
</style>
