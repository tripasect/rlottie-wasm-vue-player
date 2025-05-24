var rlottieHandler;

function actualPlayerInitialization() {
  if (typeof rlottieHandler !== 'undefined') {
    console.warn('Player initialization already attempted or completed. Skipping.');
    return;
  }
  if (typeof RLottieHandler === 'undefined') {
    console.error('RLottieHandler (from rlottie-handler.js) not loaded at the time of player initialization. Cannot initialize rlottie player.');
    return;
  }
  try {
    rlottieHandler = new RLottieHandler(1); // Initialize the handler
    window.requestAnimationFrame(updater);    // Start the render loop
    console.log('rlottie player initialized.');
  } catch (e) {
    console.error('Error initializing RLottieHandler:', e);
  }
}

function setup() {
  // Assumes 'Module' is made available globally by 'rlottie-wasm.js' loaded via main.js
  if (typeof Module === 'undefined') {
    console.error('Module (from rlottie-wasm.js) not defined when setup() is called. This indicates a script loading issue or that rlottie-wasm.js failed to define Module.');
    return;
  }

  // Check if Emscripten runtime is already initialized
  if (Module.calledRun) {
    console.log('Emscripten runtime already initialized (Module.calledRun is true). Initializing player directly.');
    actualPlayerInitialization();
  } else {
    // Runtime not yet initialized, set the callback
    console.log('Emscripten runtime not yet initialized. Setting Module.onRuntimeInitialized callback.');
    Module.onRuntimeInitialized = actualPlayerInitialization;
  }
}

setup(); // Initialize the player when the script loads

function updater() {
  // This is the render loop
  if (rlottieHandler) {
    rlottieHandler.rafId = window.requestAnimationFrame(updater);
    rlottieHandler.render();
  }
}

// --- Core API for Vue to use ---

function loadAnimationData(jsonData) {
  if (rlottieHandler) {
    try {
        JSON.parse(jsonData); // Validate JSON format
        rlottieHandler.reload(jsonData); // reload is an existing method in rlottieHandler
    } catch (error) {
        console.error("Error loading animation data: Invalid JSON", error);
    }
  } else {
    console.error("rlottieHandler not initialized yet. Cannot load animation.");
  }
}

function playAnimation() {
  if (rlottieHandler) {
    rlottieHandler.play(); // play is an existing method
  }
}

function pauseAnimation() {
  if (rlottieHandler) {
    rlottieHandler.pause(); // pause is an existing method
  }
}

function stopAnimation() {
    if (rlottieHandler) {
        if (typeof rlottieHandler.stop === 'function') {
            rlottieHandler.stop();
        } else {
            rlottieHandler.pause();
            rlottieHandler.seek(0); // Seek to the beginning
            console.warn("RLottieHandler.stop() not found, using pause() and seek(0).");
        }
    }
}

function seekAnimation(percentage) {
    if (rlottieHandler) {
        // rlottieHandler.seek() takes a percentage (0-100)
        rlottieHandler.seek(percentage);
    }
}

// --- Dynamic property modifications ---
function _getLottieHandle() {
  if (rlottieHandler && rlottieHandler.rlottieModule && rlottieHandler.rlottieModule[0] && rlottieHandler.rlottieModule[0].lottieHandle) {
    return rlottieHandler.rlottieModule[0].lottieHandle;
  }
  console.error("Lottie handle not available.");
  return null;
}

function _triggerUpdate() {
  if (rlottieHandler && typeof rlottieHandler.update === 'function') {
    rlottieHandler.update();
  } else if (rlottieHandler && typeof rlottieHandler.render === 'function') {
    // If no specific update, a single render might be enough if called outside the loop
    // However, the main updater loop should handle rendering. This is a fallback.
    // rlottieHandler.render(); 
  }
}

function setLayerColor(keypath, r, g, b) {
  const handle = _getLottieHandle();
  if (handle) {
    handle.setFillColor(keypath, r, g, b);
    handle.setStrokeColor(keypath, r, g, b);
    _triggerUpdate();
  }
}

function setLayerOpacity(keypath, opacity) {
  const handle = _getLottieHandle();
  if (handle) {
    handle.setFillOpacity(keypath, opacity);
    handle.setStrokeOpacity(keypath, opacity);
    _triggerUpdate();
  }
}

function setStrokeWidth(keypath, width) {
  const handle = _getLottieHandle();
  if (handle) {
    handle.setStrokeWidth(keypath, width);
    _triggerUpdate();
  }
}

function setPosition(keypath, x, y) {
  const handle = _getLottieHandle();
  if (handle) {
    handle.setPosition(keypath, x, y);
    _triggerUpdate();
  }
}

function setScale(keypath, width, height) {
  const handle = _getLottieHandle();
  if (handle) {
    handle.setScale(keypath, width, height);
    _triggerUpdate();
  }
}

function setRotation(keypath, degree) {
  const handle = _getLottieHandle();
  if (handle) {
    handle.setRotation(keypath, degree);
    _triggerUpdate();
  }
}

// --- New API methods for animation properties and play speed ---
function getAnimationProperties() {
  if (rlottieHandler && typeof rlottieHandler.getAnimationProperties === 'function') {
    return rlottieHandler.getAnimationProperties();
  }
  return null; // Or a default object
}

function setPlaySpeed(speed) {
  if (rlottieHandler && typeof rlottieHandler.setPlaySpeed === 'function') {
    rlottieHandler.setPlaySpeed(speed);
  }
}

function resizePlayer(width, height) {
  if (rlottieHandler && typeof rlottieHandler.resize === 'function') {
    rlottieHandler.resize(width, height);
  } else {
    console.warn('rlottieHandler or its resize method is not available.');
  }
}

// Expose a controlled API to the window object for Vue to use
window.RlottieVuePlayer = {
  loadAnimation: loadAnimationData,
  play: playAnimation,
  pause: pauseAnimation,
  stop: stopAnimation,
  seek: seekAnimation,
  getAnimationProperties: getAnimationProperties,
  setPlaySpeed: setPlaySpeed,
  resize: resizePlayer,
  setLayerColor: setLayerColor,
  setLayerOpacity: setLayerOpacity,
  setStrokeWidth: setStrokeWidth,
  setPosition: setPosition,
  setScale: setScale,
  setRotation: setRotation
};
