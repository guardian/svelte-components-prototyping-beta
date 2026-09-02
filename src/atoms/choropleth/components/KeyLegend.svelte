<!-- src/lib/components/KeyLegend.svelte -->
<script>
  import { database } from '$lib/stores/choro.svelte.js';

  const itemWidth = 32;
  const itemHeight = 14;
  const padX = 18;
  const barY = 4;
  const tickLength = 5;
  const svgHeight = 42;

  let legendValues = $derived(
    database.mapping?.[database.currentIndex]?.values
      ?.split(',')
      .map((v) => v.trim())
      .filter(Boolean) || []
  );
  let legendColors = $derived(
    database.mapping?.[database.currentIndex]?.colours
      ?.split(',')
      .map((c) => c.trim())
      .filter(Boolean) || []
  );
  let currentLabel = $derived(database.mapping?.[database.currentIndex]?.keyText || '');

  // Threshold scale: n colours, n-1 breaks. Outer bands are unbounded
  // (< first / ≥ last). Ticks sit on the shared edge between adjacent rects.
  let colorRects = $derived(
    legendColors.map((color, i) => ({
      color,
      x: padX + i * itemWidth
    }))
  );

  let ticks = $derived(
    legendValues.slice(0, Math.max(0, legendColors.length - 1)).map((value, i) => ({
      value,
      x: padX + (i + 1) * itemWidth
    }))
  );

  let totalWidth = $derived(padX * 2 + legendColors.length * itemWidth);
</script>

{#if database.showKey && legendColors.length > 1 && legendValues.length > 0}
  <div class="keyBox">
    <div class="keyText">{currentLabel}</div>
    <div class="keyContainer">
      <svg width={totalWidth} height={svgHeight} id="keySvg">
        {#each colorRects as item}
          <rect
            x={item.x}
            y={barY}
            width={itemWidth}
            height={itemHeight}
            fill={item.color}
            stroke="#dcdcdc"
            stroke-width="0.5"
          />
        {/each}

        {#each ticks as tick}
          <line
            x1={tick.x}
            y1={barY + itemHeight}
            x2={tick.x}
            y2={barY + itemHeight + tickLength}
            stroke="#767676"
            stroke-width="1"
          />
          <text
            class="keyLabel"
            x={tick.x}
            y={barY + itemHeight + tickLength + 12}
            text-anchor="middle"
          >
            {tick.value}
          </text>
        {/each}
      </svg>
    </div>
  </div>
{/if}

<style>
  .keyBox {
    margin: 15px 0;
    width: 100%;
  }

  .keyText {
    font-family: 'Guardian Text Sans Web', Arial, sans-serif;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
    color: #333;
  }

  .keyContainer {
    width: 100%;
    overflow-x: auto;
  }

  .keyLabel {
    font-family: 'Guardian Text Sans Web', Arial, sans-serif;
    font-size: 11px;
    fill: #333;
  }

  @media (max-width: 480px) {
    .keyContainer {
      overflow-x: scroll;
    }
  }
</style>
