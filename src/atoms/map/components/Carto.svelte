<script>
  import { onMount, tick } from 'svelte'

  import maplibregl from 'maplibre-gl';
  // @ts-expect-error Bundler handles this side-effect CSS import.
  import 'maplibre-gl/dist/maplibre-gl.css';
  const { Map, ScaleControl, NavigationControl } = maplibregl;
  import { Protocol } from "pmtiles";
  import { geoOrthographic, geoPath } from 'd3-geo';
  import { select } from 'd3-selection';
  import { feature } from 'topojson-client';
  import graphicsStyle from '$lib/mapstyles/graphics.json';
  import protomapsStyle from '$lib/mapstyles/protomaps.json';

  // These need to be re-done from the ground up in a more comprehensive way
  import disputedBorders from '$lib/mapstyles/disputed_borders.json';
  import world from '$lib/mapstyles/ne_110m_land.json';

  import { updateScaleControlPosition, updateMinimap } from '$lib/helpers/mapping/mappingUtils.js'

  /** @typedef {'graphics' | 'protomaps'} MapStyleName */
  /** @typedef {[number, number]} LngLatTuple */
  /** @typedef {[LngLatTuple, LngLatTuple]} BoundsTuple */
  /** @typedef {{ bounds?: BoundsTuple, center?: LngLatTuple, zoom?: number }} MapViewport */
  /** @typedef {{ interactive?: boolean, showMiniMap?: boolean, style?: MapStyleName, viewport?: MapViewport }} MapSettings */

  /** @type {{ width: number, mapSettings: MapSettings }} */
  let {
    width,
    mapSettings
  } = $props()

  // Map libre setup

  let protocol = new Protocol();
  maplibregl.addProtocol("pmtiles",protocol.tile);
  /** @type {import('maplibre-gl').Map | undefined} */
  let mapInstance;
  /** @type {any} */
  let minimapSvg;
  /** @type {any} */
  let minimapPath;
  /** @type {any} */
  let viewportRect;
  /** @type {any} */
  let minimapProjection;

  /** @type {LngLatTuple} */
  const DEFAULT_MINIMAP_CENTER = [0, 20];
  /** @type {Record<MapStyleName, import('maplibre-gl').StyleSpecification>} */
  const MAP_STYLES = {
    graphics: /** @type {import('maplibre-gl').StyleSpecification} */ (graphicsStyle),
    protomaps: /** @type {import('maplibre-gl').StyleSpecification} */ (protomapsStyle)
  };

  /** @param {MapSettings} settings
   *  @returns {MapStyleName}
   */
  function getSelectedStyle(settings) {
    return settings?.style === 'protomaps' ? 'protomaps' : 'graphics';
  }

  /** @param {MapSettings} settings
   *  @returns {MapViewport}
   */
  function getViewport(settings) {
    return settings?.viewport ?? {};
  }

  /** @param {MapViewport} viewport
   *  @returns {boolean}
   */
  function hasViewportBounds(viewport) {
    return Array.isArray(viewport?.bounds) && viewport.bounds.length === 2;
  }

  /** @param {BoundsTuple} bounds
   *  @returns {LngLatTuple}
   */
  function getBoundsCenter(bounds) {
    const [[west, south], [east, north]] = bounds;
    return [(west + east) / 2, (south + north) / 2];
  }

  /** @param {MapViewport} viewport
   *  @returns {LngLatTuple}
   */
  function getViewportCenter(viewport) {
    if (Array.isArray(viewport?.center) && viewport.center.length === 2) {
      return /** @type {LngLatTuple} */ (viewport.center);
    }

    if (hasViewportBounds(viewport)) {
      return getBoundsCenter(/** @type {BoundsTuple} */ (viewport.bounds));
    }

    return DEFAULT_MINIMAP_CENTER;
  }

  /** @param {MapViewport} viewport
   *  @returns {number}
   */
  function getViewportZoom(viewport) {
    return typeof viewport?.zoom === 'number' ? viewport.zoom : 1;
  }

  

  // Watch for width changes and resize map
  $effect(() => {
    // Track width changes
    width;
    const map = mapInstance;
    if (map && map.loaded()) {
      // Wait for DOM to update, then resize the map
      tick().then(() => {
        // Use double requestAnimationFrame to ensure browser has painted
        // and container dimensions are updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            map.resize();
          });
        });
      });
    }
  });

  // Component lifecycle
  onMount(() => {
    const selectedStyle = getSelectedStyle(mapSettings);
    const viewport = getViewport(mapSettings);
    const viewportCenter = getViewportCenter(viewport);
    const viewportZoom = getViewportZoom(viewport);

    const map = mapInstance = new Map({
      container: 'map1',
      style: MAP_STYLES[selectedStyle],
      center: viewportCenter,
      cooperativeGestures: width < 480 ? true : false,
      zoom: viewportZoom,
      attributionControl: false
    })

  
    // Disable interactions if mapSettings.interactive is false

    if (!mapSettings.interactive) {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    }

    map.addControl(new ScaleControl({
      unit: 'imperial'
    }), 'bottom-right');

    map.addControl(new ScaleControl({
      unit: 'metric'
    }), 'bottom-right');

    map.addControl(new NavigationControl({
      showCompass: false
    }), 'top-left');



    // Convert TopoJSON world land boundaries to GeoJSON FeatureCollection
    const worldGeo = /** @type {any} */ (feature(world, world.objects.ne_110m_land));

    // Set up minimap
    // Maybe later move all the minimap to its own component because it will look neater

    const minimapWidth = 150;
    const minimapHeight = 100;

    // Use the requested viewport center if present, otherwise fall back to bounds midpoint.
    minimapProjection = geoOrthographic()
      .rotate([-viewportCenter[0], -viewportCenter[1]])
      .fitExtent([[0, 0], [minimapWidth, minimapHeight]], worldGeo);

    minimapPath = geoPath().projection(minimapProjection);

    // Create SVG for minimap
    minimapSvg = select('#minimap1')
      .append('svg')
      .attr('width', minimapWidth)
      .attr('height', minimapHeight);

    // Circular clip path and outline
    const radius = Math.min(minimapWidth, minimapHeight) / 2;
    const cx = minimapWidth / 2;
    const cy = minimapHeight / 2;

    const defs = minimapSvg.append('defs');
    
    defs.append('clipPath')
      .attr('id', 'minimap-clip')
      .append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius);

    // Group for globe content, clipped to circle
    const minimapGroup = minimapSvg.append('g')
      .attr('clip-path', 'url(#minimap-clip)');

    // White circular background so non-land areas inside globe are white
    minimapGroup.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius)
      .attr('fill', '#FFFFFF')
      .attr('stroke', 'none');


    minimapSvg.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-width', 1);  

    minimapGroup
      .selectAll('path')
      .data(worldGeo.features)
      .enter()
      .append('path')
        .attr('d', minimapPath)
        .attr('fill', '#F3F3F3')
        .attr('stroke', '#121212')
        .attr('stroke-width', 0.5)
        .attr('fill-rule', 'evenodd');

    // Add viewport rectangle (on top of globe, inside clip)
    viewportRect = minimapGroup.append('path')
      .attr('fill', 'none')
      .attr('stroke', '#CC0A11')
      .attr('stroke-width', 1);

    // Function to log map center and zoom

    function logMapState() {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      console.log(
        `Center: ${center.lng}, ${center.lat}, Zoom: ${zoom}`,
        `Bounds SW: ${sw.lng}, ${sw.lat}, NE: ${ne.lng}, ${ne.lat}`
      );
    }

    // Function to set up map after it loads  
    function setupMapAfterLoad() {
      updateMinimap(map, minimapPath, viewportRect); // Initial update
      updateScaleControlPosition();
      // Listen to map movement and zoom events
      map.on('move', () => {
        updateMinimap(map, minimapPath, viewportRect);
        logMapState();
        updateScaleControlPosition();
      });
      // IMPORTANT: pass a function reference. Passing `updateMinimap(...)` would call it immediately
      // and register `undefined` as the handler, which MapLibre will later try to `.call` during events.
      map.on('moveend', () => updateMinimap(map, minimapPath, viewportRect));
      map.on('zoom', () => {
        updateMinimap(map, minimapPath, viewportRect);
        logMapState();
        updateScaleControlPosition();
      });
      map.on('zoomend', () => updateMinimap(map, minimapPath, viewportRect));
      map.on('resize', () => updateMinimap(map, minimapPath, viewportRect));
    }

    // Check if map is already loaded (can happen in article format)
    if (map.loaded()) {
      setupMapAfterLoad();
    } else {
      map.once('load', setupMapAfterLoad);
    }

    map.on('load', () => {
      if (hasViewportBounds(viewport)) {
        map.fitBounds(/** @type {BoundsTuple} */ (viewport.bounds), {
          duration: 0
        });
      }

      // Manual disputed borders from file, these need to be updated
      // There are also dispuated borders in the underlying pmtiles data
      // We probably need to discuss disputed borders approach generally


      map.addSource('disputed-borders', {
        type: 'geojson',
        data: /** @type {any} */ (disputedBorders)
      });

      map.addLayer({
        id: 'disputed-borders-layer',
        type: 'line',
        source: 'disputed-borders',
        paint: {
          'line-color': '#A1A1A1',
          'line-width': [
                "interpolate",
                ["linear"],
                ["zoom"],
                4, 0.4,
                8, 0.6,
                12, 0.8,
                16, 1.2
                ],
          'line-dasharray': [1.5, 1.5]
        }
      });
    })

    return () => {
      map.remove();
      mapInstance = undefined;
    };
  })

</script>


  <div id="map1" class="{mapSettings.interactive ? 'interactive' : 'non-interactive'}">
      <div id="minimap1" class="minimap"></div>
  </div>

   
<style lang="scss">

  :global(.non-interactive .maplibregl-canvas-container.maplibregl-interactive) {
      cursor: default !important;
  }


    #map1 {
      width: 100%;
      height: 500px;
    } 
 

</style>
