<script>
  import { tooltipStore } from '$lib/stores/choro.svelte.js';
  //$: tooltip = $tooltipStore;

  // Constants for positioning
  const TOOLTIP_WIDTH = 200; // matches max-width from CSS
  const BUFFER = 20; // buffer from edges

  let mapContainer;

  function getMapContainer() {
    if (!mapContainer) {
      mapContainer = document.getElementById('mapContainer');
    }
    return mapContainer;
  }

  function getTooltipPosition(mouseX, mouseY) {
    if (typeof window === 'undefined') return { x: mouseX, y: mouseY };

    const container = getMapContainer();
    if (!container) return { x: mouseX, y: mouseY };

    const containerRect = container.getBoundingClientRect();
    
    // Convert mouse coordinates to be relative to container
    const relativeX = mouseX - containerRect.left;
    const relativeY = mouseY - containerRect.top;
    
    // Calculate horizontal position
    let x = relativeX + 10; // Default offset from cursor
    if (relativeX > containerRect.width - (TOOLTIP_WIDTH + BUFFER)) {
      // Near right edge - show to left of cursor
      x = relativeX - TOOLTIP_WIDTH - 10;
    }

    // Calculate vertical position
    let y = relativeY + 10; // Default offset from cursor
    const estimatedHeight = 20; // Rough estimate of tooltip height
    if (relativeY > containerRect.height - (estimatedHeight + BUFFER)) {
      // Near bottom edge - show above cursor
      y = relativeY - estimatedHeight - 10;
    }

    // Ensure tooltip stays within container bounds
    x = Math.max(0, Math.min(x, containerRect.width - TOOLTIP_WIDTH));
    y = Math.max(0, Math.min(y, containerRect.height - estimatedHeight));

    return { x, y };
  }

  function closeTooltip() {
    tooltipStore.visible = false;
    tooltipStore.touch = false;
  }

  let position = $derived(getTooltipPosition(tooltipStore.x, tooltipStore.y));
</script>

{#if tooltipStore.visible}
  <div
    class="tooltip"
    class:touch-enabled={tooltipStore.touch}
    style="top: {position.y}px; left: {position.x}px; width: {TOOLTIP_WIDTH}px;"
  >
    {#if tooltipStore.touch}
      <button 
        class="close-button"
        on:click={closeTooltip}
        aria-label="Close tooltip"
        title="Close"
      >
        ×
      </button>
    {/if}
    
    <div class="tooltip-content">
      {@html tooltipStore.html}
    </div>
  </div>
{/if}

<style>
  .tooltip {
    position: absolute;
    z-index: 1000;
    background: white;
    border: 1px solid #ccc;
    padding: 0.5em;
    pointer-events: none;
    max-width: 200px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    font-size: 14px;
    border-radius: 4px;
  }

  .tooltip.touch-enabled {
    pointer-events: auto;
    padding: 0.5em 1.5em 0.5em 0.5em; /* Extra padding on right for close button */
  }

  .close-button {
    position: absolute;
    top: 2px;
    right: 2px;
    background: none;
    border: none;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    color: #666;
    padding: 2px 4px;
    border-radius: 2px;
    transition: all 0.2s ease;
    z-index: 1001;
  }

  .close-button:hover {
    background: #f0f0f0;
    color: #333;
  }

  .close-button:active {
    background: #e0e0e0;
  }

  .tooltip-content {
    position: relative;
  }
</style>
