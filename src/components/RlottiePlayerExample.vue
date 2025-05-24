<template>
  <div class="rlottie-example">
    <h2>RlottiePlayer Example</h2>
    
    <div class="player-section">
      <div class="player-container">
        <RlottiePlayer
          ref="player"
          :src="animationSource"
          :width="width"
          :height="height"
          :autoplay="autoplay"
          :loop="loop"
          :speed="speed"
          :layers="layerCustomizations"
          @load="onAnimationLoaded"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @stop="isPlaying = false"
          @error="onAnimationError"
          @complete="onAnimationComplete"
        />
      </div>
      
      <div class="controls-section">
        <h3>Playback Controls</h3>
        
        <div class="button-group">
          <button @click="play" :disabled="isPlaying">Play</button>
          <button @click="pause" :disabled="!isPlaying">Pause</button>
          <button @click="stop">Stop</button>
        </div>
        
        <div class="seek-control">
          <label>
            Seek:
            <input type="range" min="0" max="100" v-model.number="seekValue" @input="seek" />
            <span>{{ seekValue }}%</span>
          </label>
        </div>
        
        <div class="speed-control">
          <label>
            Speed:
            <input type="number" v-model.number="speed" min="0.1" max="5" step="0.1" />
          </label>
        </div>
        
        <div class="toggle-controls">
          <label>
            <input type="checkbox" v-model="autoplay" /> Autoplay
          </label>
          <label>
            <input type="checkbox" v-model="loop" /> Loop
          </label>
        </div>
        
        <div class="size-controls">
          <h3>Size Controls</h3>
          <div class="dimension-controls">
            <label>
              Width:
              <input type="number" v-model.number="width" min="50" max="800" step="10" />
            </label>
            <label>
              Height:
              <input type="number" v-model.number="height" min="50" max="800" step="10" />
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <div class="animation-section">
      <h3>Animation Source</h3>
      <button @click="loadSampleAnimation">Load Sample Animation</button>
      
      <div class="paste-json">
        <h4>Or paste animation JSON:</h4>
        <textarea v-model="jsonInput" placeholder="Paste Lottie JSON here..." rows="5"></textarea>
        <button @click="loadJsonInput">Load JSON</button>
      </div>
    </div>
    
    <div class="layer-section" v-if="layerPathInput">
      <h3>Layer Customization</h3>
      
      <div class="layer-path-input">
        <label>
          Layer Path:
          <input type="text" v-model="layerPathInput" placeholder="e.g., 'Shape Layer 1'" />
        </label>
      </div>
      
      <div class="layer-controls">
        <div class="color-control">
          <h4>Color</h4>
          <div class="color-sliders">
            <label>
              R:
              <input type="range" min="0" max="255" v-model.number="layerColor.r" @input="updateLayerColor" />
              <span>{{ layerColor.r }}</span>
            </label>
            <label>
              G:
              <input type="range" min="0" max="255" v-model.number="layerColor.g" @input="updateLayerColor" />
              <span>{{ layerColor.g }}</span>
            </label>
            <label>
              B:
              <input type="range" min="0" max="255" v-model.number="layerColor.b" @input="updateLayerColor" />
              <span>{{ layerColor.b }}</span>
            </label>
          </div>
        </div>
        
        <div class="opacity-control">
          <h4>Opacity</h4>
          <label>
            <input type="range" min="0" max="1" step="0.1" v-model.number="layerOpacity" @input="updateLayerOpacity" />
            <span>{{ layerOpacity }}</span>
          </label>
        </div>
        
        <div class="stroke-control">
          <h4>Stroke Width</h4>
          <label>
            <input type="range" min="1" max="20" v-model.number="strokeWidth" @input="updateStrokeWidth" />
            <span>{{ strokeWidth }}</span>
          </label>
        </div>
        
        <div class="position-control">
          <h4>Position</h4>
          <label>
            X:
            <input type="number" v-model.number="position.x" @change="updatePosition" />
          </label>
          <label>
            Y:
            <input type="number" v-model.number="position.y" @change="updatePosition" />
          </label>
        </div>
        
        <div class="scale-control">
          <h4>Scale</h4>
          <label>
            Width:
            <input type="number" v-model.number="scale.width" min="0.1" max="5" step="0.1" @change="updateScale" />
          </label>
          <label>
            Height:
            <input type="number" v-model.number="scale.height" min="0.1" max="5" step="0.1" @change="updateScale" />
          </label>
        </div>
        
        <div class="rotation-control">
          <h4>Rotation</h4>
          <label>
            Degrees:
            <input type="range" min="0" max="360" v-model.number="rotation" @input="updateRotation" />
            <span>{{ rotation }}°</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="animation-info" v-if="animationProperties">
      <h3>Animation Properties</h3>
      <pre>{{ JSON.stringify(animationProperties, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { RlottiePlayer } from '../components/RlottiePlayer';

// Template ref for the RlottiePlayer component
const player = ref(null);

// Animation source
const animationSource = ref('');
const jsonInput = ref('');

// Player dimensions
const width = ref(300);
const height = ref(300);

// Playback controls
const autoplay = ref(true);
const loop = ref(true);
const speed = ref(1);
const isPlaying = ref(false);
const seekValue = ref(0);

// Animation properties
const animationProperties = ref(null);

// Layer customization
const layerPathInput = ref(''); // e.g., 'Shape Layer 1'
const layerColor = reactive({ r: 255, g: 0, b: 0 });
const layerOpacity = ref(1);
const strokeWidth = ref(5);
const position = reactive({ x: 0, y: 0 });
const scale = reactive({ width: 1, height: 1 });
const rotation = ref(0);

// Tracked customizations for the RlottiePlayer component's :layers prop
const layerCustomizations = ref({});


// Playback controls
const play = () => {
  if (player.value) {
    player.value.play();
  }
};

const pause = () => {
  if (player.value) {
    player.value.pause();
  }
};

const stop = () => {
  if (player.value) {
    player.value.stop();
  }
};

const seek = () => {
  if (player.value) {
    player.value.seek(seekValue.value);
  }
};

// Animation loading
const loadSampleAnimation = () => {
  animationSource.value = '/sample.json'; // Assuming sample.json is in the public folder
  layerPathInput.value = 'Shape Layer 1'; // Default layer path for sample
};

const loadJsonInput = () => {
  try {
    JSON.parse(jsonInput.value); // Validate JSON
    animationSource.value = jsonInput.value; // If valid, set as source
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
};

// Event handlers from RlottiePlayer
const onAnimationLoaded = (data) => {
  console.log('Animation loaded:', data);
  updateAnimationProperties();
};

const onAnimationError = (error) => {
  console.error('Animation error:', error);
  alert('Failed to load animation: ' + (error.message || error));
};

const onAnimationComplete = () => {
  console.log('Animation playback complete');
};

// Properties
const updateAnimationProperties = () => {
  if (player.value) {
    animationProperties.value = player.value.getProperties();
  }
};

// Layer customization methods
const updateLayerColor = () => {
  updateLayer({
    color: { r: layerColor.r, g: layerColor.g, b: layerColor.b }
  });
};

const updateLayerOpacity = () => {
  updateLayer({
    opacity: layerOpacity.value
  });
};

const updateStrokeWidth = () => {
  updateLayer({
    strokeWidth: strokeWidth.value
  });
};

const updatePosition = () => {
  updateLayer({
    position: { x: position.x, y: position.y }
  });
};

const updateScale = () => {
  updateLayer({
    scale: { width: scale.width, height: scale.height }
  });
};

const updateRotation = () => {
  updateLayer({
    rotation: rotation.value
  });
};

// Helper to update layer customizations for the :layers prop
const updateLayer = (properties) => {
  if (!layerPathInput.value) return;

  const path = layerPathInput.value;
  const currentLayerProps = layerCustomizations.value[path] || {};

  layerCustomizations.value = {
    ...layerCustomizations.value,
    [path]: {
      ...currentLayerProps,
      ...properties
    }
  };
};

// Lifecycle hook
onMounted(() => {
  loadSampleAnimation();
});
</script>

<style scoped>
.rlottie-example {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.player-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.player-container {
  flex: 1;
  min-width: 300px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.controls-section {
  flex: 1;
  min-width: 300px;
}

.button-group {
  margin-bottom: 15px;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-right: 10px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

.seek-control, .speed-control, .toggle-controls, .dimension-controls {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 8px;
}

input[type="range"] {
  width: 100%;
  max-width: 300px;
}

input[type="number"] {
  width: 60px;
  padding: 5px;
}

.animation-section {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.paste-json {
  margin-top: 15px;
}

textarea {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-family: monospace;
  margin-bottom: 10px;
}

.layer-section {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.layer-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.color-sliders {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.animation-info {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

pre {
  white-space: pre-wrap;
  background-color: #e0e0e0;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
