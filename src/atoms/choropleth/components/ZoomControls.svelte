<script>
  let { mapContainer = null } = $props();

  function zoomIn() {
    if (mapContainer?.zoomIn) {
      mapContainer.zoomIn();
    }
  }

  function zoomOut() {
    if (mapContainer?.zoomOut) {
      mapContainer.zoomOut();
    }
  }

  function resetZoom() {
    if (mapContainer?.resetZoom) {
      mapContainer.resetZoom();
    }
  }
</script>

<div class="zoom-controls">
  <button onclick={zoomIn} title="Zoom In">+</button>
  <button onclick={zoomOut} title="Zoom Out">−</button>
  <button onclick={resetZoom} title="Reset Zoom" class="reset">⌂</button>
</div>

<style>
  .zoom-controls {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 10;
  }

  button {
    width: 35px;
    height: 35px;
    border-radius: 6px;
    font-size: 18px;
    border: 1px solid #ccc;
    background-color: white;
    color: #333;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  }

  button:hover {
    background-color: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  button:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  button.reset {
    font-size: 16px;
  }
</style>