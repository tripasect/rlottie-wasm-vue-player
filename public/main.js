// Sequential script loader for rlottie-vue-player
(function() {
  const scripts = [
    'rlottie-wasm.js',
    'rlottie-module.js',
    'rlottie-handler.js',
    'index.js'
  ];
  
  function loadScriptSequentially(index) {
    if (index >= scripts.length) {
      console.log('All rlottie-vue-player scripts loaded successfully');
      return;
    }
    
    const script = document.createElement('script');
    script.src = scripts[index];
    script.onload = function() {
      console.log(`Loaded ${scripts[index]}`);
      loadScriptSequentially(index + 1);
    };
    script.onerror = function() {
      console.error(`Failed to load ${scripts[index]}`);
    };
    document.head.appendChild(script);
  }
  
  loadScriptSequentially(0);
})();
