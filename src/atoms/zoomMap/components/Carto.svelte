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

  let width = $state(620)
  let height = 500
  let debug = false

  // Component props
  let {
    mapdata = [],
    popupTemplate = "",
    geoJsonStyles = [],
    MAP_INTERACTIVE = true,
    SHOW_NAVIGATION_CONTROL = true,
    SHOW_FULLSCREEN_CONTROL = false,
    SHOW_GEOLOCATE_CONTROL = false,
    center = [116.03196265904751, -31.90047341428921],
    clusterRadius = 40, // pixels; tweak
    clusterMaxZoom = 14, // last zoom where clustering occurs
    zoom = 8,
    headline = "",
    subtitle = "",
    source = "Guardian graphic.",
  } = $props()

  let mapInstance = null
  let hoverPopup = null
  let minimapSvg
  let minimapPath
  let viewportRect
  let minimapProjection
  let timestamp = $state(null)
  let isLoading = $state(true)
  let mapReady = $state(false)
  const dispatch = createEventDispatcher()

  // Compute map bounds from mapdata (min/max lat, lng). Returns [[swLng, swLat], [neLng, neLat]] or null.
  function getBoundsFromMapdata(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return null
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const r of rows) {
      if (
        r == null ||
        !Number.isFinite(r.latitude) ||
        !Number.isFinite(r.longitude)
      )
        continue
      minLng = Math.min(minLng, r.longitude)
      minLat = Math.min(minLat, r.latitude)
      maxLng = Math.max(maxLng, r.longitude)
      maxLat = Math.max(maxLat, r.latitude)
    }
    if (minLng === Infinity) return null
    // Give single points a small extent so fitBounds works
    const pad = 0.01
    if (minLng === maxLng) {
      minLng -= pad
      maxLng += pad
    }
    if (minLat === maxLat) {
      minLat -= pad
      maxLat += pad
    }
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ]
  }

  function fillPopupTemplate(template, properties) {
    if (!template || typeof template !== "string") return ""
    return template.replace(/\{([^}]+)\}/g, (_match, key) => {
      const val = properties[key]
      return val != null ? String(val) : ""
    })
  }

  // Convert mapdata rows (latitude, longitude) to GeoJSON FeatureCollection for circle layer
  function mapDataToGeoJSON(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { type: "FeatureCollection", features: [] }
    }
    return {
      type: "FeatureCollection",
      features: rows
        .filter(
          (r) =>
            r != null &&
            Number.isFinite(r.latitude) &&
            Number.isFinite(r.longitude),
        )
        .map((row) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [row.longitude, row.latitude],
          },
          properties: { ...row },
        })),
    }
  }

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

  // Fit map to data extent when map is ready and mapdata has points
  $effect(() => {
    if (!mapReady || !mapInstance) return
    const data = mapdata ?? []
    const bounds = getBoundsFromMapdata(data)
    if (!bounds) return
    if (debug) {
      console.log(
        "[Carto] bbox (sw, ne):",
        bounds,
        "→ [[minLng, minLat], [maxLng, maxLat]]",
      )
    }
    try {
      mapInstance.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 14,
        duration: 0,
      })
      updateMinimap()
    } catch (e) {
      // ignore fitBounds errors (e.g. invalid bounds)
    }
  })

  function renderMap() {
    if (!mapInstance || !mapReady) return

    const data = mapdata ?? []
    const geojson = mapDataToGeoJSON(data)
    const featureCount = geojson.features?.length ?? 0

    // 1) push data into the source
    const src = mapInstance.getSource("sheet-points")
    if (src) {
      src.setData(geojson)
    }

    // 2) add layers once
    const CLUSTER_LAYER = "sheet-points-clusters"
    const CLUSTER_COUNT = "sheet-points-cluster-count"
    const UNCLUSTERED = "sheet-points-unclustered"

    if (!mapInstance.getLayer(CLUSTER_LAYER)) {
      mapInstance.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: "sheet-points",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            10,
            20,
            50,
            26,
            200,
            32,
          ],
          "circle-color": "#c70000",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      })
    }

    if (!mapInstance.getLayer(CLUSTER_COUNT)) {
      mapInstance.addLayer({
        id: CLUSTER_COUNT,
        type: "symbol",
        source: "sheet-points",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": "rgba(0,0,0,0.5)",
          "text-halo-width": 1,
        },
      })
    }

    if (!mapInstance.getLayer(UNCLUSTERED)) {
      mapInstance.addLayer({
        id: UNCLUSTERED,
        type: "circle",
        source: "sheet-points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            4.5,
            10,
            6.5,
            14,
            9,
          ],
          "circle-color": "#c70000",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.9,
        },
      })
    }

    // 3) interactions (bind once)
    if (!renderMap._bound) {
      renderMap._bound = true

      // Click a cluster -> zoom to expand it
      mapInstance.on("click", CLUSTER_LAYER, (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: [CLUSTER_LAYER],
        })
        const clusterFeature = features?.[0]
        if (!clusterFeature) return

        const clusterId = clusterFeature.properties.cluster_id
        const source = mapInstance.getSource("sheet-points")

        // getClusterExpansionZoom exists on GeoJSONSource when cluster:true
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return
          const [lng, lat] = clusterFeature.geometry.coordinates
          mapInstance.easeTo({ center: [lng, lat], zoom, duration: 400 })
        })
      })

      // Cursor affordance
      mapInstance.on(
        "mouseenter",
        CLUSTER_LAYER,
        () => (mapInstance.getCanvas().style.cursor = "pointer"),
      )
      mapInstance.on(
        "mouseleave",
        CLUSTER_LAYER,
        () => (mapInstance.getCanvas().style.cursor = ""),
      )

      // Click an unclustered point -> dispatch or popup
      mapInstance.on("click", UNCLUSTERED, (e) => {
        const f = e.features?.[0]
        if (!f) return
        const props = f.properties ?? {}
        const [lng, lat] = f.geometry.coordinates

        dispatch("pointclick", { lng, lat, properties: props })

        // Optional: quick popup
        // new maplibregl.Popup()
        //   .setLngLat([lng, lat])
        //   .setHTML(`<div style="max-width:220px">${props.title ?? "Point"}</div>`)
        //   .addTo(mapInstance)
      })

      mapInstance.on("mouseenter", UNCLUSTERED, (e) => {
        mapInstance.getCanvas().style.cursor = "pointer"
        if (popupTemplate) {
          const f = e.features?.[0]
          if (f) {
            const props = f.properties ?? {}
            const [lng, lat] = f.geometry.coordinates
            const html = fillPopupTemplate(popupTemplate, props)
            if (html) {
              if (hoverPopup) hoverPopup.remove()
              hoverPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
              })
                .setLngLat([lng, lat])
                .setHTML(`<div class="carto-popup-content">${html}</div>`)
                .addTo(mapInstance)
            }
          }
        }
      })
      mapInstance.on("mouseleave", UNCLUSTERED, () => {
        mapInstance.getCanvas().style.cursor = ""
        if (hoverPopup) {
          hoverPopup.remove()
          hoverPopup = null
        }
      })
    }

    if (debug) console.log(`[Map] sheet-points: ${featureCount} features`)
  }

  onMount(async () => {
    let overlaysSource = null
    const emptyGeoJSON = { type: "FeatureCollection", features: [] }

    let combinedLayers = [...basemap]

    let mapDefs = {
      version: 8,
      sources: (() => {
        const sources = {
          "vector-tiles": {
            type: "vector",
            tiles: [
              "https://interactive.guim.co.uk/maptiles/world/{z}/{x}/{y}.pbf",
            ],
          },
          "sheet-points": {
            type: "geojson",
            data: emptyGeoJSON,
            cluster: true,
            clusterRadius: clusterRadius,
            clusterMaxZoom: clusterMaxZoom,
          },
        }
        if (overlaysSource) {
          sources["overlays"] = overlaysSource
        }
        return sources
      })(),
      sprite: "",
      glyphs:
        "https://interactive.guim.co.uk/maptiles/fonts/{fontstack}/{range}.pbf",
      layers: combinedLayers,
    }

    mapInstance = new Map({
      container: "cartoMap",
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

    if (SHOW_NAVIGATION_CONTROL) {
      mapInstance.addControl(new maplibregl.NavigationControl(), "top-right")
    }
    if (SHOW_FULLSCREEN_CONTROL) {
      mapInstance.addControl(new maplibregl.FullscreenControl(), "top-right")
    }
    if (SHOW_GEOLOCATE_CONTROL) {
      mapInstance.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
        }),
        "top-right",
      )
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
      if (debug) {
        console.log(`${center.lng}, ${center.lat}, 'Zoom:', ${zoom}`)
      }
      //console.log(`${center.lng}, ${center.lat}, 'Zoom:', ${zoom}`)
    }

    // Function to set up map after it loads
    function setupMapAfterLoad() {
      mapReady = true
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

  $effect(() => {
    if (!mapReady || !mapInstance) return
    renderMap()
  })
</script>

<div class="atom" bind:clientWidth={width}>
  <div id="graphicContainer">
    <div class="src-headline-medium-20">{headline}</div>

    <div class="src-text-sans-15">
      {@html subtitle}
    </div>

    <div
      id="cartoMap"
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

    <div class="src-text-sans-12">
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

    #cartoMap {
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

  :global(.carto-popup-content) {
    max-width: 220px;
    font-size: 13px;
    line-height: 1.4;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
