<!-- src/lib/components/MapContainer.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  //import { database } from  '$lib/stores/chloro.svelte.js';
  import { tooltipStore, database} from '$lib/stores/choro.svelte.js';
  //import { get } from 'svelte/store';
  import { getJson, mustache, tooltipUtilities, isTouchOnlyDevice } from '$lib/helpers/guardian/toolbelt.js';
  import { getColourScale } from '$lib/helpers/guardian/scales.js';
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  const wait = ms => new Promise(res => setTimeout(res, ms));


  export let boundaries;
  export let overlay;
  export let basemap;
  export let places;

  const dispatch = createEventDispatcher();

  let mapEl;
  let svgEl;
  let width = 0;
  let height = 0;
  let projection;
  let path;
  let zoom;
  let zoomTransform = d3.zoomIdentity;
  let initialZoomApplied = false;
  
  // Reactive suburb data
  let rawSuburbGeoJSON = null;
  let showSuburb = false;
  
  // Make suburbGeoJSON reactive to recalculate when path changes
  $: suburbGeoJSON = rawSuburbGeoJSON && path ? 
    rawSuburbGeoJSON.features.map(feature => ({
      d: path(feature)
    })) : null;
  
  // Reactive declarations for map dimensions and projection
  $: if (mapEl && width > 0) {
    //const db = get(database);
    height = width < 500 ? width * 0.8 : width * 0.6;
    
    // Use first location coordinates if available, otherwise use defaults
    let centerLat = database.centreLat || -28;
    let centerLon = database.centreLon || 135;
    
    if (database.locations && database.locations.length > 0) {
      const firstLocation = database.locations[0];
      centerLat = +firstLocation.centreLat || centerLat;
      centerLon = +firstLocation.centreLon || centerLon;
    }
    
    projection = d3.geoMercator()
      .center([centerLon, centerLat])
      .scale(width * 0.85)
      .translate([width / 2, height / 2]);

    path = d3.geoPath().projection(projection);
  }

  // Reactive declarations for processing topojson data
  $: basemapFeatures = basemap ? 
    topojson.feature(basemap, basemap.objects[Object.keys(basemap.objects)[0]]).features : 
    [];

  $: boundaryFeatures = boundaries ? 
    topojson.feature(boundaries, boundaries.objects[Object.keys(boundaries.objects)[0]]).features : 
    [];

  function setupZoom() {
    if (!svgEl || !width || !height) return;

    // Create zoom behavior
    zoom = d3.zoom()
      .scaleExtent([0.1, 8000]) // Much wider zoom range to allow proper fitting
      .on('zoom', handleZoom);

    // Apply zoom behavior to SVG
    d3.select(svgEl).call(zoom);
  }

  // Reactive statement to set up zoom when SVG is ready
  $: if (svgEl && width && height) {
    setupZoom();
  }

  function handleZoom(event) {
    zoomTransform = event.transform;
    // Call the main zoomed function
    zoomed(event);
  }

  function zoomed(event) {
    const { transform } = event;
    
    // Update the main transform (this triggers reactive updates in the template)
    zoomTransform = transform;
    
    // Update stroke widths based on zoom level for consistent visual thickness
    const adjustedBoundaryStroke = baseStrokeWidth / transform.k;
    const adjustedBasemapStroke = basemapStrokeWidth / transform.k;
    
    // Apply stroke width updates to map features
    if (svgEl) {
      d3.select(svgEl)
        .selectAll('.boundaries path')
        .attr('stroke-width', adjustedBoundaryStroke);
      
      d3.select(svgEl)
        .selectAll('.basemap path')
        .attr('stroke-width', adjustedBasemapStroke);

      d3.select(svgEl)
        .selectAll('.suburb-outline path')
        .attr('stroke-width', adjustedBasemapStroke)
        .attr("stroke-dasharray", `${2 / transform.k }, ${2 / transform.k }`)
    }
    
    // Dispatch zoom event for parent components
    dispatch('zoom', {
      transform: transform,
      scale: transform.k,
      x: transform.x,
      y: transform.y
    });
  }

  // Function to clear suburb outline (declarative approach)
  function clearSuburbOutline() {
    rawSuburbGeoJSON = null;
    showSuburb = false;
  }

  // Public functions for zoom controls
  export function zoomIn() {
    if (zoom && svgEl) {
      d3.select(svgEl)
        .transition()
        .duration(300)
        .call(zoom.scaleBy, 1.5);
    }
  }

  export function zoomOut() {
    if (zoom && svgEl) {
      d3.select(svgEl)
        .transition()
        .duration(300)
        .call(zoom.scaleBy, 1 / 1.5);
    }
  }

  export function resetZoom() {
    if (zoom && svgEl && boundaryFeatures.length > 0 && path) {
      clearSuburbOutline();
      
      // Create a feature collection from all boundary features to calculate bounds
      const boundaryGeoJSON = {
        "type": "FeatureCollection",
        "features": boundaryFeatures
      };
      
      // Calculate bounding box in pixel coordinates
      const [[x0, y0], [x1, y1]] = path.bounds(boundaryGeoJSON);
      
      // Create transform to fit the boundary area with some padding (0.9 = 10% padding)
      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
      
      d3.select(svgEl)
        .transition()
        .duration(500)
        .call(zoom.transform, transform);
    } else if (zoom && svgEl) {
      // Fallback to identity transform if no boundary data is available
      d3.select(svgEl)
        .transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
    }
  }

  export async function zoomToPostcode(postcode, lat, lng, zoomLevel = 25) {
    if (!zoom || !svgEl || !projection || !path) return;

    try {
      // Fetch the postcode boundary data
      const bbox = await getJson(`https://interactive.guim.co.uk/embed/aus/2023/01/australian-air-quality/geojson/${postcode}.geojson`);
      
      if (bbox) {
        // Create GeoJSON feature collection for bounds calculation
        const geojson = {
          "type": "FeatureCollection",
          "features": [bbox]
        };

        // Calculate bounding box in pixel coordinates
        const [[x0, y0], [x1, y1]] = path.bounds(geojson);

        // Create transform to fit the postcode area with some padding
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(0.7 / Math.max((x1 - x0) / width, (y1 - y0) / height))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
          
        // Apply the zoom transform
        d3.select(svgEl)
          .transition()
          .duration(750)
          .call(zoom.transform, transform);

        // Debug the zoom calculation like a gangsta
        // console.log('Zoom bounds:', { x0, y0, x1, y1 });
        // console.log('Calculated zoom scale:', 0.7 / Math.max((x1 - x0) / width, (y1 - y0) / height));

        rawSuburbGeoJSON = geojson;
        showSuburb = true;
        

        database.displayOverlay = false;

      } else {
        // Fallback to coordinate-based zoom if postcode data unavailable
        zoomToLocation(lat, lng, zoomLevel);
      }
    } catch (error) {
      console.warn('Error loading postcode boundary:', error);
      // Fallback to coordinate-based zoom
      zoomToLocation(lat, lng, zoomLevel);
    }
  }

  export function zoomToLocation(lat, lng, zoomLevel = 4) {
    if (zoom && svgEl && projection) {
      // Clear any existing suburb outline
      clearSuburbOutline();
      
      // Convert lat/lng to pixel coordinates
      const centerPoint = projection([lng, lat]);
      
      if (centerPoint) {
        // Calculate the transform to center on this point with the desired scale
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(zoomLevel)
          .translate(-centerPoint[0], -centerPoint[1]);
        
        d3.select(svgEl)
          .transition()
          .duration(750)
          .call(zoom.transform, transform);
      }
    }
  }

  onMount(() => {
    // Set initial width from the container
    width = mapEl.clientWidth;
  });

  // Apply initial zoom after zoom behavior is set up
  $: if (zoom && svgEl && !initialZoomApplied) {
    applyInitialZoomIfNeeded();
  }

  function applyInitialZoomIfNeeded() {
    if (!initialZoomApplied && zoom && svgEl && projection) {
      //const db = get(database);
      
      if (database.locations && database.locations.length > 0) {
        const firstLocation = database.locations[0];
        const zoomScale = +firstLocation.zoomScale || database.zoomScale || 1;
        const centerLat = +firstLocation.centreLat || database.centreLat || -28;
        const centerLon = +firstLocation.centreLon || database.centreLon || 135;
        
        if (zoomScale > 1) {
          // Convert lat/lng to pixel coordinates
          const centerPoint = projection([centerLon, centerLat]);
          
          if (centerPoint) {
            // Calculate the transform to center on this point with the desired scale
            const transform = d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(zoomScale)
              .translate(-centerPoint[0], -centerPoint[1]);
            
            d3.select(svgEl)
              .call(zoom.transform, transform);
            initialZoomApplied = true;
          }
        }
      }
    }
  }

  //$: db = $database;
  $: currentMapping = database.mapping?.[database.currentIndex] || {};
  $: legendValues = currentMapping.values?.split(',').map(v => v.trim()) || [];
  $: legendColors = currentMapping.colours?.split(',').map(c => c.trim()) || [];
  $: scaleType = (currentMapping.scale || '').toLowerCase();
  $: currentKey = database.currentKey;
  $: tooltip = currentMapping.tooltip || "";

  $: colorScale = legendValues.length > 0 && legendColors.length > 0 ? getColourScale(scaleType, legendValues, legendColors) : null ;

  $: setColour = (feature) => {
    if (colorScale && currentKey && feature.properties && feature.properties[currentKey] != null) {
      if (scaleType === "election") {
        return colorScale(feature.properties.Margin, feature.properties['Notional incumbent']);
      } else if (scaleType === "swing") {
        return colorScale(feature.properties["2PPSwing"], feature.properties['Prediction']);
              } else {
          // Handle both numeric and categorical data
          const value = feature.properties[currentKey];
          if (scaleType === 'ordinal') {
            // For categorical data, pass the value directly (string or number)
            return colorScale(value);
          } else {
            // For numeric scales, ensure it's a valid number
            return !isNaN(value) ? colorScale(value) : '#eee';
          }
        }
    }
    return '#eee';
  };

  // Base stroke widths
  const baseStrokeWidth = 1; // Base stroke width for boundaries
  const basemapStrokeWidth = 0.5; // Base stroke width for basemap (thinner)

  function handleMouseEnter(event, feature, index) {

    let baseHtml = feature.properties[currentKey] !== null ? mustache(tooltip, {...tooltipUtilities, ...feature.properties}) : "No data available";

    tooltipStore.visible = feature.properties[currentKey] !== undefined ? true : false;
    tooltipStore.x = event.clientX + 10;
    tooltipStore.y = event.clientY - 10;
    tooltipStore.html = baseHtml;
    
  }

  function handleMouseLeave(event, feature, index) {
    tooltipStore.visible = false;
  }

  function handleMouseMove(event, feature, index) {
    tooltipStore.x = event.clientX + 10;
    tooltipStore.y = event.clientY - 10;
  }

  function handleClick(event, feature, index) {
    // Only trigger on touch devices (devices without mouse events)
    if (!isTouchOnlyDevice()) {
      return;
    }
    
    let baseHtml = feature.properties[currentKey] !== null ? mustache(tooltip, {...tooltipUtilities, ...feature.properties}) : "No data available";
    
    tooltipStore.visible = feature.properties[currentKey] !== undefined ? true : false;
    tooltipStore.touch = true;
    tooltipStore.x = event.clientX + 10;
    tooltipStore.y = event.clientY - 10;
    tooltipStore.html = baseHtml;
  }

  
</script>

<div bind:this={mapEl} bind:clientWidth={width} class="map">
  {#if width > 0 && height > 0 && path}
    <svg bind:this={svgEl} {width} {height}>
      <g transform={zoomTransform.toString()}>
        <!-- Basemap layer -->
        {#if basemap && basemapFeatures.length > 0}
          <g class="basemap">
            {#each basemapFeatures as feature, i}
              <path
                d={path(feature)}
                fill="#eee"
                stroke="#ccc"
                stroke-width={basemapStrokeWidth}
                data-feature-index={i}
              />
            {/each}
          </g>
        {/if}

        <!-- Boundaries layer -->
        {#if boundaries && boundaryFeatures.length > 0}
          <g class="boundaries">
            {#each boundaryFeatures as feature, i}
              <path
                d={path(feature)}
                fill={setColour(feature)}
                stroke="#eee"
                stroke-width={baseStrokeWidth}
                data-feature-index={i}
                on:mouseenter={(e) => handleMouseEnter(e, feature, i)}
                on:mouseleave={(e) => handleMouseLeave(e, feature, i)}
                on:mousemove={(e) => handleMouseMove(e, feature, i)}
                on:click={(e) => handleClick(e, feature, i)}
                style="cursor: pointer;"
              />
            {/each}
          </g>
        {/if}

        <!-- Suburb outline layer -->
        {#if showSuburb && suburbGeoJSON}
            <g class="suburb-outline">
              {#each suburbGeoJSON as { d, id }}
              <path {d} 
              fill={'none'}
              stroke={'black'}
              />
              {/each}
            </g>
        {/if}

        {#if places.features.length > 0}
          <g class="places">
            {#each places.features as feature, i}
              <text 
              x={projection([feature.geometry.coordinates[0], feature.geometry.coordinates[1]])[0]} 
              y={projection([feature.geometry.coordinates[0], feature.geometry.coordinates[1]])[1]}
              class="labels"
              style="font-size: {10 / zoomTransform.k}px;display: {feature.properties.scalerank - 1 < zoomTransform.k - 1 ? 'block' : 'none'}">
                {feature.properties.name}
              </text>
            {/each}
          </g>
        {/if}

      </g>
    </svg>
  {:else}
    <div style="padding: 20px; color: #666;">
      Loading map... (width: {width}, height: {height}, path: {path ? 'ready' : 'not ready'})
    </div>
  {/if}
</div>

<style>
  .map {
    width: 100%;
    position: relative;
    cursor: grab;
  }
  
  .map:active {
    cursor: grabbing;
  }

  :global(.suburb-boundary) {
    pointer-events: none;
    fill: none !important;
    fill-opacity: 0 !important;
  }
  
  :global(.suburb-outline) {
    fill: none !important;
  }

  .labels {
    font-family: 'Guardian Text Sans Web', sans-serif;
  }
</style>