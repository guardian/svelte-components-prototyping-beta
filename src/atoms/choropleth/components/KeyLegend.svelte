<!-- src/lib/components/KeyLegend.svelte -->
<script>
  import { database } from  '$lib/stores/choro.svelte.js';
  import { get } from 'svelte/store';

  //let db = $derived(get(database));
  let legendValues = $derived(database.mapping?.[database.currentIndex]?.values?.split(',') || []);
  let legendColors = $derived(database.mapping?.[database.currentIndex]?.colours?.split(',') || []);
  let currentLabel = $derived(database.mapping?.[database.currentIndex]?.keyText || '');
  
  // Calculate dimensions dynamically
  let itemWidth = $derived(25);
  let itemHeight = $derived(15);
  let itemSpacing = $derived(2);
  let totalWidth = $derived(Math.max(300, (legendValues.length * (itemWidth + itemSpacing)) + 20));
  let svgHeight = $derived(45);
  
  // Calculate positions for each legend item
  let legendItems = $derived(legendValues.map((value, i) => ({
    value: value.trim(),
    color: legendColors[i]?.trim() || '#ccc',
    x: 10 + (i * (itemWidth + itemSpacing)),
    textX: 10 + (i * (itemWidth + itemSpacing)) + (itemWidth / 2)
  })));
</script>

{#if database.showKey && legendValues.length === legendColors.length && legendValues.length > 0}
  <div class="keyBox">
    <div class="keyText">{currentLabel}</div> 
    <div class="keyContainer">
      <svg width={totalWidth} height={svgHeight} id="keySvg">
        <!-- Color rectangles -->
        {#each legendItems as item, i}
          <rect 
            x={item.x} 
            y="5" 
            width={itemWidth} 
            height={itemHeight} 
            fill={item.color} 
            stroke="#dcdcdc"
            stroke-width="0.5"
          />
        {/each}
        
        <!-- Value labels -->
        {#each legendItems as item, i}
          <text 
            x={item.textX} 
            y={svgHeight - 10} 
            text-anchor="middle" 
            fill="#333"
            font-size="11"
            font-family="Guardian Text Sans Web, Arial, sans-serif"
          >
            {item.value}
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
    font-size: 9px;
    fill: #767676;
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .keyContainer {
      overflow-x: scroll;
    }
  }
</style>
