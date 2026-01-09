<script>
  // TO FIX:
  // Map seems to crop from the left-hand side on mobile
  // Maybe drop shadow on minimap?
  // Go through charts CSS and update to use Guardian Source variables
  // Add a loading state to the map

  // Core imports
  import { onMount, tick } from "svelte"
  import { createEventDispatcher } from "svelte"
  import { getJson } from "$lib/helpers/guardian/toolbelt.js"
  // Guardian approved colour palettes
  import {
    categoricalLight,
    categoricalDark,
  } from "$lib/helpers/guardian/colours"
  import maplibregl from "maplibre-gl"
  import "maplibre-gl/dist/maplibre-gl.css"
  const { Map, ScaleControl } = maplibregl
  import { geoMercator, geoPath } from "d3-geo"
  import { select } from "d3-selection"

  import basemap from "$lib/mapstyles/basemap-styles.json"
  import aus from "$lib/mapstyles/aus-simple.json"
  // Add darkmode detection here at some point

  // Example for getting chart data from a store
  //import {getExampleData, exampledata} from '$lib/stores/example.svelte.js';

  let width = $state(620)
  let height = 500
  let warningColours = {
    Advice: "#fed976",
    "Watch and Act": "#fd8d3c",
    "Watch & Act": "#fd8d3c",
    "Emergency Warning": "#b10026",
  }
  // Toggle to disable map interactions (set to false to disable zoom/pan)

  // For debugging

  // const centerPoint = {
  //       'type': 'FeatureCollection',
  //       'features': [
  //           {
  //               'type': 'Feature',
  //               'geometry': {
  //                   'type': 'Point',
  //                   'coordinates': center
  //               }
  //           }
  //       ]
  //   };
  // const centerStyle = {
  //   "id":"center-point",
  //   "type":"circle",
  //   "source":"center-point",
  //   "paint":{
  //     "circle-radius":10,
  //     "circle-color":"#000"
  //   }
  // }

  const fireStyles = [
    {
      id: "fire-stroke",
      type: "line",
      source: "overlays",
      paint: {
        "line-color": [
          "match",
          ["get", "category"],
          "Advice",
          warningColours["Advice"],
          "Watch and Act",
          warningColours["Watch and Act"],
          "Watch & Act",
          warningColours["Watch & Act"],
          "Emergency Warning",
          warningColours["Emergency Warning"],
          "#000", // fallback color
        ],
        "line-width": 2,
      },
    },
    {
      id: "fire-fill",
      type: "fill",
      source: "overlays",
      paint: {
        "fill-color": [
          "match",
          ["get", "category"],
          "Advice",
          warningColours["Advice"],
          "Watch and Act",
          warningColours["Watch and Act"],
          "Watch & Act",
          warningColours["Watch & Act"],  
          "Emergency Warning",
          warningColours["Emergency Warning"],
          "#000", // fallback color
        ],
        "fill-opacity": 0.7,
      },
    },
  ]

  // Component props
  let {
    fireURL = "https://interactive.guim.co.uk/2026/01/aus-fire-map/VIC-warning.json",
    timestampURL = "https://interactive.guim.co.uk/2026/01/aus-fire-map/vic-warning-timestamp.json",
    MAP_INTERACTIVE = true,
    center = [116.03196265904751, -31.90047341428921],
    zoom = 8,
    headline = "Perth bushfires",
    subtitle = "Showing bushfire warning areas. Data last checked {timestamp} (AEST). This map should not be relied on in an emergency, please check the <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a> for the latest information",
    source = "Guardian graphic. Source: <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a>, OpenStreetMap",
  } = $props()

  let mapInstance
  let minimapSvg
  let minimapPath
  let viewportRect
  let minimapProjection
  let timestamp = $state(null)
  let isLoading = $state(true)
  const dispatch = createEventDispatcher()

  // Function to update minimap viewport rectangle
  function updateMinimap() {
    if (!mapInstance || !minimapPath || !viewportRect) return

    try {
      // Get current map bounds from the main MapLibre map
      const bounds = mapInstance.getBounds()
      const sw = bounds.getSouthWest() // returns {lng, lat}
      const ne = bounds.getNorthEast() // returns {lng, lat}

      // Validate bounds are reasonable (within Australia's approximate bounds)
      if (sw.lng < 100 || ne.lng > 160 || sw.lat < -50 || ne.lat > 0) {
        viewportRect.attr("d", null) // Hide if bounds are invalid
        return
      }

      // Create GeoJSON polygon for viewport bounds
      // D3 expects clockwise exterior rings (area to the right of boundary)
      // Order: SW -> NW -> NE -> SE -> SW (clockwise)
      const viewportGeo = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [sw.lng, sw.lat], // SW
              [sw.lng, ne.lat], // NW
              [ne.lng, ne.lat], // NE
              [ne.lng, sw.lat], // SE
              [sw.lng, sw.lat], // close back to SW
            ],
          ],
        },
      }

      // Use minimapPath to generate the path
      const pathData = minimapPath(viewportGeo)
      if (pathData) {
        // Calculate viewport size to adjust stroke width for small rectangles
        const lonRange = ne.lng - sw.lng
        const latRange = ne.lat - sw.lat
        const area = lonRange * latRange

        // Increase stroke width when viewport is small (threshold is arbitrary, adjust as needed)
        const strokeWidth = area < 0.5 ? 4 : area < 2 ? 3 : 2

        viewportRect
          .attr("d", pathData)
          .attr("stroke-width", strokeWidth)
          .style("display", "block")
      } else {
        viewportRect.style("display", "none")
      }
    } catch (e) {
      // Silently handle errors
    }
  }

  // Watch for width changes and resize map
  $effect(() => {
    // Track width changes
    width
    if (mapInstance && mapInstance.loaded()) {
      // Wait for DOM to update, then resize the map
      tick().then(() => {
        // Use double requestAnimationFrame to ensure browser has painted
        // and container dimensions are updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            mapInstance.resize()
          })
        })
      })
    }
  })

  // Component lifecycle
  onMount(async () => {
    // Fetch the fire data first
    const fires = await getJson(
        fireURL,
    )
    const timestamp_json = await getJson(
      timestampURL,
    )
    timestamp = timestamp_json.lastUpdated
    dispatch("timestamp", timestamp)

    let mapDefs = {
      version: 8,
      sources: {
        "vector-tiles": {
          type: "vector",
          tiles: [
            "https://interactive.guim.co.uk/maptiles/world/{z}/{x}/{y}.pbf",
          ],
        },
        overlays: {
          type: "geojson",
          data: fires,
        },
        // 'center-point': {
        //   "type": "geojson",
        //   "data": centerPoint
        // }
      },
      sprite: "",
      glyphs:
        "https://interactive.guim.co.uk/maptiles/fonts/{fontstack}/{range}.pbf",
      layers: [...basemap, ...fireStyles],
    }

    mapInstance = new Map({
      container: "fireMap",
      style: mapDefs,
      center: center,
      zoom: zoom,
    })

    // Disable interactions if MAP_INTERACTIVE is false
    if (!MAP_INTERACTIVE) {
      mapInstance.dragPan.disable()
      mapInstance.scrollZoom.disable()
      mapInstance.boxZoom.disable()
      mapInstance.doubleClickZoom.disable()
      mapInstance.touchZoomRotate.disable()
    }

    mapInstance.addControl(
      new ScaleControl({
        unit: "metric",
      }),
      "bottom-right",
    )

    // Set up minimap
    const minimapWidth = 150
    const minimapHeight = 100

    // Use identity projection for Web Mercator coordinates
    minimapProjection = geoMercator().fitExtent(
      [
        [0, 0],
        [minimapWidth, minimapHeight],
      ],
      aus,
    )

    minimapPath = geoPath().projection(minimapProjection)

    // Create SVG for minimap
    minimapSvg = select("#minimap")
      .append("svg")
      .attr("width", minimapWidth)
      .attr("height", minimapHeight)

    minimapSvg
      .append("g")
      .selectAll("path")
      .data(aus.features)
      .enter()
      .append("path")
      .attr("d", minimapPath)
      .attr("fill", "#FFF")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("fill-rule", "evenodd")

    // Add viewport rectangle (on top of Australia)
    viewportRect = minimapSvg
      .append("path")
      .attr("fill", "rgba(255, 0, 0, 0.6)")
      .attr("stroke", "#c70000")
      .attr("stroke-width", 2)

    // Function to log map center and zoom
    function logMapState() {
      const center = mapInstance.getCenter()
      const zoom = mapInstance.getZoom()
      console.log(`${center.lng}, ${center.lat}, 'Zoom:', ${zoom}`)
    }

    // Function to set up map after it loads
    function setupMapAfterLoad() {
      updateMinimap() // Initial update
      // Listen to map movement and zoom events
      mapInstance.on("move", () => {
        updateMinimap()
        logMapState()
      })
      mapInstance.on("moveend", updateMinimap)
      mapInstance.on("zoom", () => {
        updateMinimap()
        logMapState()
      })
      mapInstance.on("zoomend", updateMinimap)
      mapInstance.on("resize", updateMinimap)
      isLoading = false
    }

    // Check if map is already loaded (can happen in article format)
    if (mapInstance.loaded()) {
      setupMapAfterLoad()
    } else {
      mapInstance.once("load", setupMapAfterLoad)
    }

    mapInstance.on("load", () => {
      mapInstance.setCenter(center)
      mapInstance.resize()
    })

    // mapInstance.on('resize', () => {
    //   console.log('resize');
    //   mapInstance.setCenter(center);
    //   // mapInstance.resize();
    // });
  })
</script>

<div class="atom" bind:clientWidth={width}>
  <div id="graphicContainer">
    <div id="figureTitle" class="src-headline-medium-20">{headline}</div>

    <div id="subTitle" class="src-text-sans-15">
      {@html subtitle}
    </div>

    <div id="chartKey">
      <div class="keyDiv">
        <span
          class="keySquare"
          style="background-color:{warningColours['Advice']};"
        ></span> <span class="keyText">Advice</span>
      </div>
      <div class="keyDiv">
        <span
          class="keySquare"
          style="background-color:{warningColours['Watch and Act']};"
        ></span> <span class="keyText">Watch and Act</span>
      </div>
      <div class="keyDiv">
        <span
          class="keySquare"
          style="background-color:{warningColours['Emergency Warning']};"
        ></span> <span class="keyText">Emergency Warning</span>
      </div>
    </div>

    <div
      id="fireMap"
      class={MAP_INTERACTIVE ? "interactive" : "non-interactive"}
    >
      {#if isLoading}
        <div class="loading-overlay" role="status" aria-live="polite">
          <div class="spinner" aria-hidden="true"></div>
          <span class="loading-text">Loading map…</span>
        </div>
      {/if}
      <div id="minimap"></div>
    </div>

    <div id="footer">
      Guardian graphic. Source: {@html source}
    </div>
  </div>
</div>

<style lang="scss">
  :global(
      .non-interactive .maplibregl-canvas-container.maplibregl-interactive
    ) {
    cursor: default !important;
  }

  .atom {
    width: 100%;
    position: relative;

    #fireMap {
      width: 100%;
      height: 500px;
      position: relative;

      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.8);
        z-index: 2000;

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-top-color: #333;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-text {
          font-size: 14px;
          color: #333;
        }
      }
    }

    :global(.maplibregl-ctrl-scale) {
      background: none;
      border-bottom: 2px solid #333;
      border-left: none;
      border-right: none;
      border-top: #333;
      box-sizing: border-box;
      color: #333;
      font-size: 10px;
      padding: 0 5px;
      white-space: nowrap;
    }

    #minimap {
      position: absolute;
      bottom: 0px;
      left: -15px;
      z-index: 1000;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
