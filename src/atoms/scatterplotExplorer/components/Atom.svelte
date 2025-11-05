<script>
  // Core imports
  import { onMount } from 'svelte'
  import { getJson } from '$lib/helpers/guardian/toolbelt.js';
  import { fade, scale } from "svelte/transition";

  // import * as d3 from "d3";
  import { extent, max, min} from "d3-array";
  import { scaleLinear, scaleTime, scaleOrdinal } from "d3-scale";
  import Tooltip from '$lib/components/guardian/Tooltip.svelte';
  // Guardian approved colour palettes
  import { categoricalLight, categoricalDark } from '$lib/helpers/guardian/colours';
  import Resizer from '$lib/components/guardian/Resizer.svelte';

  const settings = {
    height: 400,
    margin: {top: 20, bottom: 20, left: 20, right: 10},
    xExtent: [null, null],
    yExtent: [null, null]
  }

  let loaded = $state(false)
  let colorRange = ["#fecc5c", "#bd0026"]
  let width = $state(620);
  let height = 400;
  let data = $state([])

  let metaData = [
    {"name":"Bitterness", "type":"number"},
    {"name":"Acidity", "type":"number"},
    {"name":"Sweetness", "type":"number"},
    {"name":"Intensity", "type":"number"},
    {"name":"Score (black)", "type":"number"},
    {"name":"Score (milk)", "type":"number"},
    {"name":"Price ($/100g)", "type":"number"},
    {"name":"Available at", "type":"category"}
  ]

  let numbers = metaData.filter(d => d.type === 'number').map(d => d.name)
  let categories = metaData.filter(d => d.type === 'category').map(d => d.name)
  
  let colorScales = {}
  


  let total = $state(1)
  let var2 = $state('Score (milk)')
  let var1 = $state('Price ($/100g)')
  let colorVar = $state('Price ($/100g)')
  let xExtent = $state([]);
  let yExtent = $state([]);
  let margin = settings.margin

  // Tooltip state
  let tooltipVisible = $state(false);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let tooltipData = $state(null);
  let tooltipText = $state('');
  let tooltipPosition = $state('right'); // 'left' or 'right' of cursor

  console.log(margin)

  // Smart tooltip positioning based on mouse coordinates and graphic boundaries
  function calculateTooltipPosition(mouseX, mouseY) {
    const tooltipWidth = 200; // Approximate tooltip width
    const offsetY = 120; // Distance from cursor vertically (accounting for ~100px tooltip height)
    const padding = 50; // Buffer from edges
    
    // Use the current width state for boundary detection
    const graphicWidth = width;
    
    // Determine if tooltip should go left or right of cursor
    let position = 'right';
    let finalX = mouseX + 15; // Default: 15px to the right
    
    // Check if tooltip would go off the right edge
    if (mouseX + tooltipWidth + padding > graphicWidth) {
      position = 'left';
      finalX = mouseX - 100; // 15px to the left
    }
    
    // Check if tooltip would go off the left edge
    if (finalX < (tooltipWidth/2)) {
      finalX = Math.max(mouseX, 100);
    }
    
    return { 
      x: finalX, 
      y: mouseY - offsetY, 
      position 
    };
  }

  let xTicks = $derived(width/100);
  let yTicks = $derived(height/100);

  let x = $derived(scaleLinear()
      .range([margin.left, width - margin.right])
      .domain(xExtent));

  let y = $derived(scaleLinear()
    .range([height - margin.bottom, margin.top])
    .domain(yExtent));


  $effect(() => {

    let xMin, xMax, yMin, yMax;
    // Recalculate extents whenever chartData changes
    if (settings.xExtent[0] === null) {
      xMin = min(data, d => d[var1]);
      xMin = xMin - (xMin * 0.05)
    }

    else {
      xMin = settings.xExtent[0]
    }

    if (settings.xExtent[1] === null) {
      xMax = max(data, d => d[var1]) 
      xMax = xMax + (xMax * 0.05)
    }

    else {
      xMax = settings.xExtent[1]
    }
    
    if (settings.yExtent[0] === null) {
      yMin = min(data, d => d[var2]);
      yMin = yMin - (yMin * 0.05)
    }

    else {
      yMin = settings.yExtent[0]
    }
    
    if (settings.yExtent[1] === null) {
      yMax = max(data, d => d[var2])
      yMax = yMax + (yMax * 0.05)
    }

    else {
      yMax = settings.yExtent[1]
    }
    
    xExtent = [xMin, xMax];
    yExtent = [yMin, yMax];

  });


  // Component props
  let { name } = $props()

  



  // Component lifecycle
  onMount(async() => {
    let jsonData = await getJson('https://interactive.guim.co.uk/docsdata/1XvGUjmOdSJYKl01TmClvVBAllkNsf9R6PaEUkYOrM8E.json')
    console.log(jsonData)

    // convert numbers to numbers
    jsonData.sheets.Sheet1.forEach((d) => {
      numbers.forEach((n) => {
        d[n] = +d[n]
      })
    })

    // update the data state
    data = jsonData.sheets.Sheet1
    total = data.length
    
    metaData.forEach(metaItem => {
      if (metaItem.type === 'number') {
        console.log("metaItem", metaItem.name)
        let values = data.map(dataItem => dataItem[metaItem.name])
        let range = extent(values)
        console.log(`Range for "${metaItem.name}":`, range)
        colorScales[metaItem.name] = scaleLinear().domain(range).range(colorRange)
      }
      else {
        colorScales[metaItem.name] = scaleOrdinal().domain(data.map(dataItem => dataItem[metaItem.name])).range(categoricalLight)
      }
    })
    console.log("testColor", colorScales["Price ($/100g)"](5))  
    loaded = true
  })

</script>

<Resizer atomName="#atom-1"/>

<div class="atom" bind:clientWidth={width}>

  <div id="graphicContainer">

    <div id="figureTitle">Supermarket coffee taste test results</div>
    
    <!-- <div id="subTitle">Your subtitle here</div>	 -->

    
    <!-- <div id="chartKey">
      <div class="keyDiv"><span class="keySquare" style="background-color:{categoricalLight[0]};"></span> <span class="keyText">Thing 1</span></div>
      <div class="keyDiv"><span class="keySquare" style="background-color:{categoricalLight[1]};"></span> <span class="keyText">Thing 2</span></div>
    </div> -->

    {#if loaded}
      <div id="chartControls">
        <div class="row">
        Showing <select bind:value={var2}>
          {#each numbers as number}
            <option value={number}>{number}</option>
          {/each}
        </select> v <select bind:value={var1}>
          {#each numbers as number}
            <option value={number}>{number}</option>
          {/each}
        </select>
        for {total} different brands
        </div>
        <div class="row">
          Colour by: <select bind:value={colorVar}>
            {#each metaData as item}
              <option value={item.name}>{item.name}</option>
            {/each}
          </select>
        </div>
        <div class="key">
          <!--- check if the item is a number or a category, if number make a SVG gradient key -->
          {#if metaData.find(item => item.name === colorVar).type === 'number'}
            <svg width="{width/2}" height="30">
              <linearGradient id="gradient">
                <stop offset="0" stop-color={colorRange[0]} />
                <stop offset="1" stop-color={colorRange[1]} />
              </linearGradient>
              <rect width="{width/2}" height="10" fill="url(#gradient)" />
              <text x="0" y="25" font-size="10" text-anchor="start">{data.length > 0 ? min(data, d => d[colorVar]).toFixed(1) : ''}</text>
              <text x="{width/2}" y="25" font-size="10" text-anchor="end">{data.length > 0 ? max(data, d => d[colorVar]).toFixed(1) : ''}</text>
            </svg>
          {/if}
          {#if metaData.find(item => item.name === colorVar).type === 'category'}
            <div class="key">
              {#each colorScales[colorVar].domain() as item}
                <div class="keyDiv">
                <span class="keySquare" style="background-color:{colorScales[colorVar](item)};"></span> <span class="keyText">{item}</span>

                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <svg class="chart" {width} {height} >

        <!-- X-axis with grid lines -->
        <g class="x-axis axis" transform="translate(0,{height - margin.bottom})" in:fade={{ duration: 500 }} out:fade={{ duration: 300 }}>
          {#each x.ticks(xTicks) as tick}
            <g class="tick" transform="translate({x(tick)},0)">
              <line y1={-height + margin.top + margin.bottom} y2="0" class="grid-line"></line>
              <text y="9" dy="0.71em" text-anchor="middle">{tick}</text>
            </g>  
          {/each}

          <!-- x Axis baseline -->
          <line x1="{margin.left}" x2={width - margin.right}  class="base-line"></line>
        </g>

        <!-- x Axis label -->
        <text class="x-axis-label" x={width - margin.right} y={height - (margin.bottom + 6)} text-anchor="end">{var1}</text>

        <!-- Y-axis with grid lines -->
        <g class="y-axis axis" transform="translate({margin.left},0)" in:fade={{ duration: 500 }} out:fade={{ duration: 300 }}>
          {#each y.ticks(yTicks) as tick}
            <g class="tick" transform="translate(0,{y(tick)})">
              <line x1="0" x2={width - margin.left - margin.right} class="grid-line"></line>
              <text x="-9" dy="0.32em" text-anchor="end">{tick}</text>
            </g>
          {/each}

          <!-- y Axis baseline -->
          <line y1="{margin.top}" y2={height - margin.bottom} class="base-line"></line>
        </g>

        <!-- y Axis label -->
        <text class="y-axis-label" x={margin.left + 6} y={margin.top + 12}>{var2}</text>

        <!-- Data points -->
        <g class="dotGroup">
          {#each data as d, i}
            <g class="point" transform="translate({x(d[var1])},{y(d[var2])})">
              <circle 
                r="4" 
                fill={colorScales[colorVar](d[colorVar])}
                on:mouseenter={() => {
                  tooltipVisible = true;
                  tooltipText = `Product: ${d['Name']}<br>${var1}: ${d[var1]}<br> ${var2}: ${d[var2]}`;
                }}
                on:mouseleave={() => {
                  tooltipVisible = false;
                  tooltipData = null;
                }}
                 on:mousemove={(e) => {
                   // Get the .atom container's position to convert viewport coords to relative coords
                   const atomContainer = e.currentTarget.closest('.atom');
                   const atomRect = atomContainer.getBoundingClientRect();
                   
                   // Convert viewport coordinates to coordinates relative to .atom container
                   const relativeX = e.clientX - atomRect.left;
                   const relativeY = e.clientY - atomRect.top;
                   
                   const position = calculateTooltipPosition(relativeX, relativeY);
                   console.log('viewport:', e.clientX, e.clientY, 'relative:', relativeX, relativeY, 'position:', position)
                   tooltipX = position.x;
                   tooltipY = position.y;
                   tooltipPosition = position.position;
                 }}
                style="cursor: pointer;"
              ></circle>
            </g>
          {/each}
        </g>
      </svg>
    {/if}
    <div id="footer">Guardian graphic.</div>	
  
  </div>

  <!-- Tooltip -->
  <Tooltip 
    x={tooltipX}
    y={tooltipY}
    text={tooltipText}
    visible={tooltipVisible}
    position={tooltipPosition}
  />

</div>

<style lang="scss">



  .atom {
    width:100%;
    position: relative;
    
  }

  .point circle {
    transition: r 0.2s ease;
  }

  .point circle:hover {
    r: 6;
  }
</style>
