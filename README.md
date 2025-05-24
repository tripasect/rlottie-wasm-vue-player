# Rlottie WASM Vue Player

A Vue 3 component for the rlottie-wasm animation player. This package allows you to play Lottie animations in your Vue applications using the rlottie WebAssembly module.

## Improved Usage Experience

With this package, you can enjoy a seamless and efficient experience when working with Lottie animations in your Vue applications. The key benefits include:

- **Zero configuration required** - All WASM and JS assets are automatically included
- **Simple import** - Just `import { RlottiePlayer } from 'rlottie-vue-player'` and you're ready to go
- Play, pause, stop, and seek Lottie animations
- Control playback speed
- Customize layer colors, opacity, position, scale, and rotation
- Responsive design
- Event handling for animation lifecycle

## Installation

```bash
npm install rlottie-wasm-vue-player
```

## Setup

### 1. Install the package

Install the package using npm or yarn:

```bash
npm install rlottie-wasm-vue-player
# or
yarn add rlottie-wasm-vue-player
```

That's it! No need to manually copy any files. All required WASM and JS assets are automatically included in the package.

### 2. Import and use the component

No additional script loading is required. All necessary WASM and JS files are automatically loaded when you import the component.

## Usage

### Register as a Vue plugin (global component)

```js
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import RlottieVuePlayer from 'rlottie-wasm-vue-player';

const app = createApp(App);

// Register the plugin with optional configuration
app.use(RlottieVuePlayer, {
  // Optional: custom path to WASM assets if you need to override the default
  // wasmPath: '/custom-path'
});

app.mount('#app');
```

### Use as a local component

```js
// YourComponent.vue
import { RlottiePlayer } from 'rlottie-wasm-vue-player';

export default {
  components: {
    RlottiePlayer
  }
};
```

### Basic Example

```vue
<template>
  <div>
    <RlottiePlayer
      ref="player"
      :src="animationSource"
      :width="300"
      :height="300"
      :autoplay="true"
      :loop="true"
      :speed="1"
      @load="onAnimationLoaded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @stop="isPlaying = false"
      @error="onAnimationError"
      @complete="onAnimationComplete"
    />
    
    <div class="controls">
      <button @click="player.play()">Play</button>
      <button @click="player.pause()">Pause</button>
      <button @click="player.stop()">Stop</button>
      <input type="range" min="0" max="100" v-model="seekValue" @input="seek" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RlottiePlayer } from 'rlottie-wasm-vue-player';

const player = ref(null);
const animationSource = ref('/sample.json');
const isPlaying = ref(false);
const seekValue = ref(0);

const seek = () => {
  if (player.value) {
    player.value.seek(seekValue.value);
  }
};

const onAnimationLoaded = (data) => {
  console.log('Animation loaded:', data);
};

const onAnimationError = (error) => {
  console.error('Animation error:', error);
};

const onAnimationComplete = () => {
  console.log('Animation playback complete');
};
</script>
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | String, Object | - | Animation source - stringified JSON or URL to JSON file |
| `width` | Number, String | 300 | Width of the player |
| `height` | Number, String | 300 | Height of the player |
| `autoplay` | Boolean | false | Whether to autoplay the animation |
| `loop` | Boolean | true | Whether to loop the animation |
| `speed` | Number | 1 | Playback speed (1 is normal speed) |
| `background` | String | 'transparent' | Background color |
| `layers` | Object | {} | Layer customizations (see below) |
| `canvasId` | String | null | Optional custom canvas ID |
| `assetPath` | String | '' | Optional: Custom path to asset files (not required with default usage) |

## Layer Customization

The `layers` prop accepts an object with the following format:

```js
{
  "keypath": {
    color: { r: 255, g: 0, b: 0 },
    opacity: 0.5,
    strokeWidth: 2,
    position: { x: 10, y: 20 },
    scale: { width: 1.2, height: 0.8 },
    rotation: 45
  }
}
```

Where `keypath` is the path to the layer in the Lottie animation (e.g., "Shape Layer 1").

## Component Methods

| Method | Description |
|--------|-------------|
| `play()` | Starts or resumes animation playback |
| `pause()` | Pauses animation playback |
| `stop()` | Stops animation and resets to the first frame |
| `seek(percentage)` | Seeks to a specific frame based on percentage (0-100) |
| `getProperties()` | Returns properties of the current animation |

## Global API

The package also exposes a global API on `window.RlottieVuePlayer` with the following methods:

| Method | Description |
|--------|-------------|
| `loadAnimation(jsonData)` | Loads Lottie animation data (stringified JSON) |
| `play()` | Starts or resumes animation playback |
| `pause()` | Pauses animation playback |
| `stop()` | Stops animation and resets to the first frame |
| `seek(percentage)` | Seeks to a specific frame based on percentage (0-100) |
| `getAnimationProperties()` | Returns properties of the current animation |
| `setPlaySpeed(speed)` | Sets the playback speed |
| `resize(width, height)` | Informs the player of the canvas dimensions |
| `setLayerColor(keypath, r, g, b)` | Sets the fill and stroke color of a layer |
| `setLayerOpacity(keypath, opacity)` | Sets the fill and stroke opacity of a layer (0-1) |
| `setStrokeWidth(keypath, width)` | Sets the stroke width of a layer |
| `setPosition(keypath, x, y)` | Sets the position of a layer |
| `setScale(keypath, width, height)` | Sets the scale of a layer |
| `setRotation(keypath, degree)` | Sets the rotation of a layer |

## License

MIT
