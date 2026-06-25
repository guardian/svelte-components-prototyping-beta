<script>
  // Core imports
  import { onMount } from "svelte"
  import { createEventDispatcher } from "svelte"
  import maplibregl from "maplibre-gl"
  import "maplibre-gl/dist/maplibre-gl.css"
  const { Map, ScaleControl, NavigationControl } = maplibregl
  import { Protocol } from "pmtiles"
  import { geoOrthographic, geoPath } from "d3-geo"
  import { select } from "d3-selection"
  import { feature } from "topojson-client"
  import Resizer from "$lib/components/guardian/Resizer.svelte"

  // Base map styles (shared with src/atoms/map)
  import basemapLight from "$lib/mapstyles/ml_basemapLight.json"
  import basemapLabels from "$lib/mapstyles/ml_mapLabels.json"
  import world from "$lib/mapstyles/ne_110m_land.json"

  // Shared minimap + scale helpers
  import {
    updateScaleControlPosition,
    updateMinimap,
  } from "$lib/helpers/mapping/mappingUtils.js"

  let width = $state(620)
  let debug = true

  // Component props
  let {
    mapdata = [],
    popupTemplate = "",
    geoJsonStyles = [],
    MAP_INTERACTIVE = true,
    SHOW_NAVIGATION_CONTROL = true,
    SHOW_FULLSCREEN_CONTROL = false,
    SHOW_GEOLOCATE_CONTROL = false,
    // Australian state boundaries + capital labels. Off by default — only
    // maps showing Australia-specific data need them.
    SHOW_STATE_BOUNDARIES = false,
    center = [116.03196265904751, -31.90047341428921],
    clusterRadius = 40, // pixels; tweak
    clusterMaxZoom = 11, // last zoom where clustering occurs
    maxZoom = 11, // map max zoom
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
  let isLoading = $state(true)
  let mapReady = $state(false)
  const dispatch = createEventDispatcher()
  let spiderPopup = null
  let spiderMarkers = []
  let spiderLegSvg = null
  let interactionsBound = false
  const COORD_EPSILON = 1e-5
  const SPIDERFY_PIXEL_TOLERANCE = 100
  const SPIDERFY_CLUSTER_RADIUS_PX = 100

  // Australian state boundary + label layer ids
  const STATE_BOUNDARY_SOURCE = "au-states"
  const STATE_BOUNDARY_LAYER = "au-state-boundaries"
  const STATE_LABEL_SOURCE = "au-state-label-points"
  const STATE_LABEL_LAYER = "au-state-labels"
  const STATE_CAPITAL_SOURCE = "au-state-capitals"
  const STATE_CAPITAL_DOT_LAYER = "au-state-capital-dots"
  const STATE_CAPITAL_LABEL_LAYER = "au-state-capital-labels"

  const STATE_TILES_URL =
    "https://interactive.guim.co.uk/embed/upload/tileshop/australian-states/{z}/{x}/{y}.pbf"
  const STATE_SOURCE_LAYER = "states"

  // Base map place-label layers that could also label our capital cities.
  // While our capitals are shown, these are filtered to exclude the capital
  // names so a capital city is never labelled twice.
  const BASEMAP_PLACE_LABEL_LAYERS = [
    "town-labels",
    "city-labels",
    "capital-labels-lowzoom",
    "capital-labels-highzoom",
  ]

  const AU_STATE_CAPITALS = {
    type: "FeatureCollection",
    features: [
      ["Sydney", 151.2093, -33.8688],
      ["Melbourne", 144.9631, -37.8136],
      ["Brisbane", 153.0251, -27.4698],
      ["Perth", 115.8605, -31.9505],
      ["Adelaide", 138.6007, -34.9285],
      ["Hobart", 147.3272, -42.8821],
      ["Darwin", 130.8456, -12.4634],
      ["Canberra", 149.13, -35.2809],
    ].map(([name, lng, lat]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: { name },
    })),
  }

  // Names our own capital layer renders, used to suppress base map duplicates.
  const CAPITAL_NAMES = AU_STATE_CAPITALS.features.map((f) => f.properties.name)

  // One label point per state/territory, placed on the main landmass. The
  // boundary geometry comes from vector tiles, but labelling polygons straight
  // from tiles repeats the name once per tile a state spans, so we drive labels
  // from these fixed points instead (one label each, no duplicates).
  const AU_STATE_LABELS = {
    type: "FeatureCollection",
    features: [
      ["New South Wales", 146.9, -32.2],
      ["Victoria", 144.3, -36.9],
      ["Queensland", 144.4, -22.6],
      ["South Australia", 135.6, -30.3],
      ["Western Australia", 121.7, -25.8],
      ["Tasmania", 146.6, -42.0],
      ["Northern Territory", 133.4, -19.6],
      ["Australian Capital Territory", 149.0, -35.5],
    ].map(([name, lng, lat]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: { name },
    })),
  }

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

  function toSerializableProperties(value) {
    if (value == null || typeof value !== "object") return {}
    try {
      return JSON.parse(JSON.stringify(value))
    } catch (_err) {
      return {}
    }
  }

  function clearSpider() {
    if (!mapInstance) return
    if (debug) {
      console.log("[Spiderfy] clearSpider", { markerCount: spiderMarkers.length })
    }
    for (const marker of spiderMarkers) marker.remove()
    spiderMarkers = []
    clearSpiderLegs()
    if (spiderPopup) {
      spiderPopup.remove()
      spiderPopup = null
    }
  }

  function ensureSpiderLegOverlay() {
    if (!mapInstance) return null

    const container = mapInstance.getContainer()
    if (!container) return null

    if (!spiderLegSvg || !container.contains(spiderLegSvg)) {
      spiderLegSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      spiderLegSvg.classList.add("spider-legs-overlay")
      container.appendChild(spiderLegSvg)
    }

    spiderLegSvg.setAttribute("width", String(container.clientWidth))
    spiderLegSvg.setAttribute("height", String(container.clientHeight))
    return spiderLegSvg
  }

  function clearSpiderLegs() {
    if (!spiderLegSvg) return
    spiderLegSvg.replaceChildren()
  }

  function spiderfyAt(centerLngLat, leaves) {
    if (!mapInstance || !Array.isArray(leaves) || leaves.length < 2) return

    if (debug) {
      console.log("[Spiderfy] spiderfyAt", {
        center: centerLngLat,
        leavesCount: leaves.length,
      })
    }

    const center = mapInstance.project(centerLngLat)
    const count = leaves.length
    const radius = Math.min(70, 25 + count * 4)
    clearSpider()
    const spiderLegOverlay = ensureSpiderLegOverlay()

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const projected = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      }
      const lngLat = mapInstance.unproject(projected)
      const props = {
        ...toSerializableProperties(leaves[i]?.properties),
        __leaf: true,
        __idx: i,
      }

      const markerEl = document.createElement("button")
      markerEl.type = "button"
      markerEl.className = "spider-marker"
      markerEl.setAttribute("aria-label", props.title ?? `Point ${i + 1}`)
      markerEl.addEventListener("click", (evt) => {
        evt.stopPropagation()
        const lng = lngLat.lng
        const lat = lngLat.lat

        dispatch("pointclick", { lng, lat, properties: props })
        if (spiderPopup) spiderPopup.remove()
        const popupHTML =
          fillPopupTemplate(popupTemplate, props) ||
          `<div style="max-width:220px">${props.title ?? "Point"}</div>`
        spiderPopup = new maplibregl.Popup()
          .setLngLat([lng, lat])
          .setHTML(`<div class="carto-popup-content">${popupHTML}</div>`)
          .addTo(mapInstance)
      })

      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: "center",
      })
        .setLngLat([lngLat.lng, lngLat.lat])
        .addTo(mapInstance)
      spiderMarkers.push(marker)

      if (spiderLegOverlay) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.classList.add("spider-leg")
        line.setAttribute("x1", String(center.x))
        line.setAttribute("y1", String(center.y))
        line.setAttribute("x2", String(projected.x))
        line.setAttribute("y2", String(projected.y))
        spiderLegOverlay.appendChild(line)
      }
    }

    if (debug) {
      console.log("[Spiderfy] markers rendered", { markerCount: spiderMarkers.length })
    }
  }

  function getCoincidentLeavesAt(lng, lat) {
    return (mapdata ?? [])
      .filter(
        (row) =>
          row != null &&
          Number.isFinite(row.latitude) &&
          Number.isFinite(row.longitude) &&
          Math.abs(row.longitude - lng) < COORD_EPSILON &&
          Math.abs(row.latitude - lat) < COORD_EPSILON,
      )
      .map((row) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [row.longitude, row.latitude],
        },
        properties: toSerializableProperties(row),
      }))
  }

  function getNearbyCoincidentLeaves(lng, lat, maxPixelDistance = 40) {
    if (!mapInstance || !Array.isArray(mapdata) || mapdata.length === 0) return []

    const groups = {}
    for (const row of mapdata) {
      if (
        row == null ||
        !Number.isFinite(row.latitude) ||
        !Number.isFinite(row.longitude)
      )
        continue
      const key = `${row.longitude},${row.latitude}`
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    }

    const clusterPoint = mapInstance.project({ lng, lat })
    let bestRows = []
    let bestDistance = Infinity

    for (const rows of Object.values(groups)) {
      if (rows.length < 2) continue
      const anchor = rows[0]
      const p = mapInstance.project({
        lng: anchor.longitude,
        lat: anchor.latitude,
      })
      const distance = Math.hypot(p.x - clusterPoint.x, p.y - clusterPoint.y)
      if (distance < bestDistance) {
        bestDistance = distance
        bestRows = rows
      }
    }

    if (bestRows.length < 2 || bestDistance > maxPixelDistance) return []
    return bestRows.map((row) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.longitude, row.latitude],
      },
      properties: toSerializableProperties(row),
    }))
  }

  function areLeavesCoincident(leaves) {
    if (!Array.isArray(leaves) || leaves.length < 2) return false
    const first = leaves[0]?.geometry?.coordinates
    if (!Array.isArray(first) || first.length < 2) return false
    const [firstLng, firstLat] = first
    return leaves.every((leaf) => {
      const coords = leaf?.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) return false
      const [lng, lat] = coords
      return (
        Math.abs(lng - firstLng) < COORD_EPSILON &&
        Math.abs(lat - firstLat) < COORD_EPSILON
      )
    })
  }

  function areLeavesCoincidentByPixels(
    leaves,
    pixelTolerance = SPIDERFY_PIXEL_TOLERANCE,
  ) {
    if (!mapInstance || !Array.isArray(leaves) || leaves.length < 2) return false
    const firstCoords = leaves[0]?.geometry?.coordinates
    if (!Array.isArray(firstCoords) || firstCoords.length < 2) return false
    const firstPoint = mapInstance.project({
      lng: firstCoords[0],
      lat: firstCoords[1],
    })

    return leaves.every((leaf) => {
      const coords = leaf?.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) return false
      const p = mapInstance.project({ lng: coords[0], lat: coords[1] })
      return (
        Math.abs(p.x - firstPoint.x) <= pixelTolerance &&
        Math.abs(p.y - firstPoint.y) <= pixelTolerance
      )
    })
  }

  function areLeavesWithinPixelRadius(
    leaves,
    radiusPx = SPIDERFY_CLUSTER_RADIUS_PX,
  ) {
    if (!mapInstance || !Array.isArray(leaves) || leaves.length < 2) return false

    const projected = leaves
      .map((leaf) => {
        const coords = leaf?.geometry?.coordinates
        if (!Array.isArray(coords) || coords.length < 2) return null
        return mapInstance.project({ lng: coords[0], lat: coords[1] })
      })
      .filter(Boolean)

    if (projected.length < 2) return false

    const center = projected.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 },
    )
    center.x /= projected.length
    center.y /= projected.length

    const maxDistance = projected.reduce((max, p) => {
      const dx = p.x - center.x
      const dy = p.y - center.y
      const dist = Math.hypot(dx, dy)
      return Math.max(max, dist)
    }, 0)

    return maxDistance <= radiusPx
  }

  function getLeafProximityDiagnostics(leaves) {
    const safeLeaves = Array.isArray(leaves) ? leaves : []
    const coordinates = safeLeaves
      .map((leaf) => leaf?.geometry?.coordinates)
      .filter((coords) => Array.isArray(coords) && coords.length >= 2)
      .map(([lng, lat], idx) => ({ idx, lng, lat }))

    const projected = mapInstance
      ? coordinates.map(({ lng, lat, idx }) => {
          const p = mapInstance.project({ lng, lat })
          return { idx, x: p.x, y: p.y }
        })
      : []

    let maxDeltaFromFirstPx = 0
    if (projected.length > 1) {
      const first = projected[0]
      for (let i = 1; i < projected.length; i++) {
        const dx = projected[i].x - first.x
        const dy = projected[i].y - first.y
        maxDeltaFromFirstPx = Math.max(maxDeltaFromFirstPx, Math.hypot(dx, dy))
      }
    }

    let maxDistanceFromCentroidPx = 0
    if (projected.length > 1) {
      const center = projected.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 },
      )
      center.x /= projected.length
      center.y /= projected.length
      for (const p of projected) {
        const dx = p.x - center.x
        const dy = p.y - center.y
        maxDistanceFromCentroidPx = Math.max(
          maxDistanceFromCentroidPx,
          Math.hypot(dx, dy),
        )
      }
    }

    return {
      coordinateCount: coordinates.length,
      coordinates,
      maxDeltaFromFirstPx,
      maxDistanceFromCentroidPx,
      pixelTolerance: SPIDERFY_PIXEL_TOLERANCE,
      clusterRadiusPx: SPIDERFY_CLUSTER_RADIUS_PX,
    }
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
          properties: toSerializableProperties(row),
        })),
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
        maxZoom: maxZoom,
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
    const CLUSTER_INTERACTIVE_LAYERS = [CLUSTER_LAYER, CLUSTER_COUNT]

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
    if (!interactionsBound) {
      interactionsBound = true

      function handleClusterClick(e) {
        try {
          if (debug) {
            console.log("[Spiderfy] handleClusterClick fired", {
              zoom: mapInstance.getZoom(),
            })
          }

          const renderedFeatures = mapInstance.queryRenderedFeatures(e.point, {
            layers: CLUSTER_INTERACTIVE_LAYERS,
          })
          const clusterFeature = renderedFeatures?.find(
            (f) => f?.properties?.cluster_id != null,
          )
          if (!clusterFeature) {
            return
          }

          const rawClusterId = clusterFeature.properties.cluster_id
          const clusterId = Number(rawClusterId)
          if (!Number.isFinite(clusterId)) {
            if (debug) {
              console.log("[Spiderfy] invalid cluster_id", { rawClusterId })
            }
            return
          }
          const source = mapInstance.getSource("sheet-points")
          if (!source?.getClusterExpansionZoom || !source?.getClusterLeaves) {
            if (debug) console.log("[Spiderfy] source missing cluster methods")
            return
          }

          const [lng, lat] = clusterFeature.geometry.coordinates
          const currentZoom = mapInstance.getZoom()
          const atZoomCap = currentZoom >= maxZoom - 0.01
          const pointCount = Number(clusterFeature.properties?.point_count ?? 0)
          const exactCoincident = getCoincidentLeavesAt(lng, lat)
          const nearbyCoincident = getNearbyCoincidentLeaves(lng, lat)
          const immediateCoincident =
            exactCoincident.length > 1 ? exactCoincident : nearbyCoincident
          const immediateAllCoincident =
            pointCount > 1 && immediateCoincident.length === pointCount

          if (debug) {
            console.log("[Spiderfy] preflight", {
              clusterId,
              pointCount,
              currentZoom,
              maxZoom,
              atZoomCap,
              exactCoincident: exactCoincident.length,
              nearbyCoincident: nearbyCoincident.length,
              immediateCoincident: immediateCoincident.length,
              immediateAllCoincident,
            })
          }

          // Spiderfy at any zoom when all points in this cluster share one coordinate.
          if (immediateAllCoincident) {
            clearSpider()
            spiderfyAt({ lng, lat }, immediateCoincident)
            return
          }

          const maxLeaves = Math.max(pointCount, 1)
          source.getClusterLeaves(clusterId, maxLeaves, 0, (leafErr, leaves) => {
            const coincidentLeaves = getCoincidentLeavesAt(lng, lat)
            const safeLeaves = Array.isArray(leaves) ? leaves : []
            const gotAllClusterLeaves =
              pointCount > 1 && safeLeaves.length === pointCount
            const coincidentByPixels =
              gotAllClusterLeaves && areLeavesCoincidentByPixels(safeLeaves)
            const withinTightRadius =
              gotAllClusterLeaves && areLeavesWithinPixelRadius(safeLeaves)
            const coincidentClusterLeaves =
              gotAllClusterLeaves &&
              (areLeavesCoincident(safeLeaves) ||
                coincidentByPixels ||
                withinTightRadius)

            if (debug) {
              const proximityDiagnostics =
                gotAllClusterLeaves && safeLeaves.length > 1
                  ? getLeafProximityDiagnostics(safeLeaves)
                  : null
              console.log("[Spiderfy] leaves resolved", {
                clusterId,
                maxLeaves,
                leafErr,
                leavesCount: safeLeaves.length,
                gotAllClusterLeaves,
                coincidentClusterLeaves,
                coincidentByPixels,
                withinTightRadius,
                coincidentLeaves: coincidentLeaves.length,
                proximityDiagnostics,
              })
            }

            // Any zoom: if all leaves in this cluster are coincident, spiderfy now.
            if (coincidentClusterLeaves && safeLeaves.length > 1) {
              clearSpider()
              spiderfyAt({ lng, lat }, safeLeaves)
              return
            }

            // If leaves call failed but local data clearly has coincident points, spiderfy fallback.
            if (leafErr && coincidentLeaves.length > 1) {
              clearSpider()
              spiderfyAt({ lng, lat }, coincidentLeaves)
              return
            }

            source.getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
              if (err) {
                if (debug) {
                  console.log("[Spiderfy] getClusterExpansionZoom error", {
                    clusterId,
                    err,
                  })
                }
                return
              }

              const currentZoom = mapInstance.getZoom()
              const cappedExpansionZoom = Math.min(expansionZoom, maxZoom)
              const atZoomCap = currentZoom >= maxZoom - 0.01
              const wouldHitZoomCap = cappedExpansionZoom >= maxZoom - 0.01
              const canZoomIn =
                !atZoomCap &&
                !wouldHitZoomCap &&
                cappedExpansionZoom > currentZoom + 0.01

              if (debug) {
                console.log("[Spiderfy] cluster click", {
                  clusterId,
                  rawClusterId,
                  pointCount,
                  expansionZoom,
                  cappedExpansionZoom,
                  currentZoom,
                  maxZoom,
                  atZoomCap,
                  wouldHitZoomCap,
                  canZoomIn,
                })
              }

              if (canZoomIn) {
                clearSpider()
                mapInstance.easeTo({
                  center: [lng, lat],
                  zoom: cappedExpansionZoom,
                  duration: 400,
                })
                return
              }

              const fromClusterOrFallback =
                safeLeaves.length > 1 ? safeLeaves : coincidentLeaves
              if (fromClusterOrFallback.length > 1) {
                clearSpider()
                spiderfyAt({ lng, lat }, fromClusterOrFallback)
              }
            })
          })
        } catch (err) {
          console.error("[Spiderfy] handleClusterClick threw", err)
        }
      }

      // Click anywhere, then resolve cluster from interactive cluster layers.
      // Using a single listener avoids duplicate cluster click handling.
      mapInstance.on("click", handleClusterClick)

      // Cursor affordance
      mapInstance.on(
        "mouseenter",
        CLUSTER_LAYER,
        () => (mapInstance.getCanvas().style.cursor = "pointer"),
      )
      mapInstance.on(
        "mouseenter",
        CLUSTER_COUNT,
        () => (mapInstance.getCanvas().style.cursor = "pointer"),
      )
      mapInstance.on(
        "mouseleave",
        CLUSTER_LAYER,
        () => (mapInstance.getCanvas().style.cursor = ""),
      )
      mapInstance.on(
        "mouseleave",
        CLUSTER_COUNT,
        () => (mapInstance.getCanvas().style.cursor = ""),
      )

      // Click an unclustered point -> dispatch or popup
      mapInstance.on("click", UNCLUSTERED, (e) => {
        const f = e.features?.[0]
        if (!f) return
        const [lng, lat] = f.geometry.coordinates
        const currentZoom = mapInstance.getZoom()
        const coincidentLeaves = getCoincidentLeavesAt(lng, lat)
        const atZoomCap = currentZoom >= maxZoom - 0.01

        if (debug) {
          console.log("[Spiderfy] unclustered click", {
            lng,
            lat,
            currentZoom,
            atZoomCap,
            coincidentLeaves: coincidentLeaves.length,
          })
        }

        if (atZoomCap && coincidentLeaves.length > 1) {
          clearSpider()
          spiderfyAt({ lng, lat }, coincidentLeaves)
          return
        }

        clearSpider()
        const props = f.properties ?? {}

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

      mapInstance.on("movestart", clearSpider)
      mapInstance.on("zoomstart", clearSpider)
      mapInstance.on("resize", clearSpider)
    }

    // Keep the state name + capital labels above the cluster/point layers that
    // were just added, so labels are never hidden behind cluster icons.
    for (const id of [STATE_LABEL_LAYER, STATE_CAPITAL_LABEL_LAYER]) {
      if (mapInstance.getLayer(id)) mapInstance.moveLayer(id)
    }

    if (debug) console.log(`[Map] sheet-points: ${featureCount} features`)
  }

  // Register the pmtiles protocol used by the shared base map styles
  const protocol = new Protocol()
  maplibregl.addProtocol("pmtiles", protocol.tile)

  // Add Australian state boundaries from our hosted vector tiles (black outline,
  // no fill), state-name labels driven by the same tiles, and capital-city dots
  // with names. Added once; visibility is driven by SHOW_STATE_BOUNDARIES.
  function addStateBoundaries() {
    if (!mapInstance || mapInstance.getSource(STATE_BOUNDARY_SOURCE)) return

    const initialVisibility = SHOW_STATE_BOUNDARIES ? "visible" : "none"

    // State/territory boundaries as vector tiles. The tileset is built to zoom
    // 7; MapLibre overzooms it up to the map's max zoom.
    mapInstance.addSource(STATE_BOUNDARY_SOURCE, {
      type: "vector",
      tiles: [STATE_TILES_URL],
      minzoom: 0,
      maxzoom: 7,
    })
    mapInstance.addSource(STATE_CAPITAL_SOURCE, {
      type: "geojson",
      data: AU_STATE_CAPITALS,
    })
    mapInstance.addSource(STATE_LABEL_SOURCE, {
      type: "geojson",
      data: AU_STATE_LABELS,
    })

    // Black state outlines, no fill.
    mapInstance.addLayer({
      id: STATE_BOUNDARY_LAYER,
      type: "line",
      source: STATE_BOUNDARY_SOURCE,
      "source-layer": STATE_SOURCE_LAYER,
      layout: { visibility: initialVisibility },
      paint: {
        "line-color": "#000000",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3, 0.6,
          6, 0.9,
          10, 1.2,
        ],
      },
    })

    // 5px black circle for each capital city.
    mapInstance.addLayer({
      id: STATE_CAPITAL_DOT_LAYER,
      type: "circle",
      source: STATE_CAPITAL_SOURCE,
      layout: { visibility: initialVisibility },
      paint: {
        "circle-radius": 5,
        "circle-color": "#000000",
      },
    })

    // Capital-city names, set to the right of each dot. TS3 text sans regular,
    // 13px, white halo for legibility.
    mapInstance.addLayer({
      id: STATE_CAPITAL_LABEL_LAYER,
      type: "symbol",
      source: STATE_CAPITAL_SOURCE,
      layout: {
        visibility: initialVisibility,
        "text-field": ["get", "name"],
        "text-font": ["Gdn Text Sans TS3Regular"],
        "text-size": 13,
        "text-anchor": "left",
        "text-offset": [0.8, 0],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#121212",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    })

    // State name labels (e.g. New South Wales) — one fixed point per state, so a
    // name is never repeated across the tiles its polygon spans. TS3 text sans
    // regular, 13px, white halo for legibility.
    mapInstance.addLayer({
      id: STATE_LABEL_LAYER,
      type: "symbol",
      source: STATE_LABEL_SOURCE,
      layout: {
        visibility: initialVisibility,
        "text-field": ["get", "name"],
        "text-font": ["Gdn Text Sans TS3Regular"],
        "text-size": 13,
        "text-anchor": "center",
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#121212",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    })
  }

  function setStateBoundariesVisibility(visible) {
    if (!mapInstance) return
    const visibility = visible ? "visible" : "none"
    for (const id of [
      STATE_BOUNDARY_LAYER,
      STATE_CAPITAL_DOT_LAYER,
      STATE_CAPITAL_LABEL_LAYER,
      STATE_LABEL_LAYER,
    ]) {
      if (mapInstance.getLayer(id)) {
        mapInstance.setLayoutProperty(id, "visibility", visibility)
      }
    }

    // The base map labels capital cities too (e.g. via city-labels). While our
    // capitals are shown, filter those names out of the base map place-label
    // layers so a capital city is never labelled twice — restore on toggle off.
    const exclusion = [
      "!",
      [
        "in",
        ["coalesce", ["get", "name:en"], ["get", "name"], ""],
        ["literal", CAPITAL_NAMES],
      ],
    ]
    for (const id of BASEMAP_PLACE_LABEL_LAYERS) {
      if (!mapInstance.getLayer(id)) continue
      const original =
        basemapLabels.layers.find((l) => l.id === id)?.filter ?? null
      if (visible) {
        mapInstance.setFilter(id, original ? ["all", original, exclusion] : exclusion)
      } else {
        mapInstance.setFilter(id, original)
      }
    }
  }

  onMount(async () => {
    const emptyGeoJSON = { type: "FeatureCollection", features: [] }

    // Build the base map style by merging the shared light basemap with its
    // label layers, then adding this component's clustered points source.
    const mapStyle = {
      ...basemapLight,
      sources: {
        ...basemapLight.sources,
        "sheet-points": {
          type: "geojson",
          data: emptyGeoJSON,
          cluster: true,
          clusterRadius: clusterRadius,
          clusterMaxZoom: clusterMaxZoom,
        },
      },
      layers: [...basemapLight.layers, ...basemapLabels.layers],
    }

    mapInstance = new Map({
      container: "cartoMap",
      style: mapStyle,
      center: center,
      zoom: zoom,
      maxZoom: maxZoom,
      attributionControl: false,
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
      mapInstance.addControl(
        new NavigationControl({ showCompass: false }),
        "top-right",
      )
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

    // Dual imperial/metric scale, bottom-right (matches src/atoms/map)
    mapInstance.addControl(new ScaleControl({ unit: "imperial" }), "bottom-right")
    mapInstance.addControl(new ScaleControl({ unit: "metric" }), "bottom-right")

    // Set up minimap (globe-style orthographic projection, matches src/atoms/map)
    const worldGeo = feature(world, world.objects.ne_110m_land)

    const minimapWidth = 150
    const minimapHeight = 100

    minimapProjection = geoOrthographic()
      .rotate([-center[0], -center[1]])
      .fitExtent(
        [
          [0, 0],
          [minimapWidth, minimapHeight],
        ],
        worldGeo,
      )

    minimapPath = geoPath().projection(minimapProjection)

    // Create SVG for minimap
    minimapSvg = select("#minimap")
      .append("svg")
      .attr("width", minimapWidth)
      .attr("height", minimapHeight)

    // Circular clip path and outline
    const radius = Math.min(minimapWidth, minimapHeight) / 2
    const cx = minimapWidth / 2
    const cy = minimapHeight / 2

    const defs = minimapSvg.append("defs")
    defs
      .append("clipPath")
      .attr("id", "minimap-clip")
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)

    // Group for globe content, clipped to circle
    const minimapGroup = minimapSvg
      .append("g")
      .attr("clip-path", "url(#minimap-clip)")

    // White circular background so non-land areas inside the globe are white
    minimapGroup
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)
      .attr("fill", "#FFFFFF")
      .attr("stroke", "none")

    minimapSvg
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)

    minimapGroup
      .selectAll("path")
      .data(worldGeo.features)
      .enter()
      .append("path")
      .attr("d", minimapPath)
      .attr("fill", "#F3F3F3")
      .attr("stroke", "#121212")
      .attr("stroke-width", 0.5)
      .attr("fill-rule", "evenodd")

    // Add viewport rectangle (on top of the globe, inside the clip)
    viewportRect = minimapGroup
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#CC0A11")
      .attr("stroke-width", 1)

    // Function to set up map after it loads
    function setupMapAfterLoad() {
      mapReady = true
      updateMinimap(mapInstance, minimapPath, viewportRect) // Initial update
      updateScaleControlPosition()
      // Listen to map movement and zoom events
      mapInstance.on("move", () => {
        updateMinimap(mapInstance, minimapPath, viewportRect)
        updateScaleControlPosition()
      })
      mapInstance.on("moveend", () =>
        updateMinimap(mapInstance, minimapPath, viewportRect),
      )
      mapInstance.on("zoom", () => {
        updateMinimap(mapInstance, minimapPath, viewportRect)
        updateScaleControlPosition()
      })
      mapInstance.on("zoomend", () =>
        updateMinimap(mapInstance, minimapPath, viewportRect),
      )
      mapInstance.on("resize", () =>
        updateMinimap(mapInstance, minimapPath, viewportRect),
      )
      addStateBoundaries()
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
  })

  $effect(() => {
    if (!mapReady || !mapInstance) return
    renderMap()
  })

  // Toggle Australian state boundaries + capitals when the setting changes.
  $effect(() => {
    if (!mapReady || !mapInstance) return
    setStateBoundariesVisibility(SHOW_STATE_BOUNDARIES)
  })
</script>

<Resizer atomName="#gv-atom" />

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
      <div id="minimap" class="minimap"></div>
    </div>

    <div class="src-text-sans-12">
      Guardian graphic. {#if source} Source: {@html source} {/if}
    </div> -->
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
    padding-bottom: 20px;

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
  }

  :global(.carto-popup-content) {
    max-width: 220px;
    font-size: 13px;
    line-height: 1.4;
  }

  :global(.spider-marker) {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: #c70000;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    padding: 0;
  }

  :global(.spider-legs-overlay) {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 900;
  }

  :global(.spider-leg) {
    stroke: rgba(40, 40, 40, 0.55);
    stroke-width: 1.5;
  }

  :global(.maplibregl-popup) {
    z-index: 1100;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
