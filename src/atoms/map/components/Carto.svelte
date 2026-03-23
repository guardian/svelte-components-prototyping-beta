<script>
  // TODO:

  // Svelte stuff

  import { onMount, tick } from 'svelte'
  
  // Mapping stuff

  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  const { Map, ScaleControl, NavigationControl } = maplibregl;
  import { Protocol, PMTiles } from "pmtiles";
  import { geoOrthographic, geoPath } from 'd3-geo';
  import { select } from 'd3-selection';
  import { feature } from 'topojson-client';
  import basemapLight from '$lib/mapstyles/ml_basemapLight.json';
  import basemapLabels from '$lib/mapstyles/ml_mapLabels.json';

  // These need to be re-done from the ground up in a more comprehensive way
  import disputedBorders from '$lib/mapstyles/disputed_borders.json';
  import world from '$lib/mapstyles/ne_110m_land.json';
  
  // Helpers / utility
  import { getJson } from '$lib/helpers/guardian/toolbelt.js';
  import { updateScaleControlPosition, updateMinimap } from '$lib/helpers/mapping/mappingUtils.js'

  // Get the settings and stuff

  let {
    width,
    height,
    mapSettings
  } = $props()

  // Map libre setup

  let protocol = new Protocol();
  maplibregl.addProtocol("pmtiles",protocol.tile);
  let mapInstance;
  let minimapSvg;
  let minimapPath;
  let viewportRect;
  let minimapProjection;

  

  // Watch for width changes and resize map
  $effect(() => {
    // Track width changes
    width;
    if (mapInstance && mapInstance.loaded()) {
      // Wait for DOM to update, then resize the map
      tick().then(() => {
        // Use double requestAnimationFrame to ensure browser has painted
        // and container dimensions are updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            mapInstance.resize();
          });
        });
      });
    }
  });

  // Component lifecycle
  onMount(async() => {
    // Example of fetching data to show
    // const strikesData = await getJson("https://interactive.guim.co.uk/docsdata/13BFRha2pzO3WTwEIiezHejJv3EtK2O6sm07jmgNMxuU.json");

    const mapStyle =  {
      ...basemapLight,
      layers: [...basemapLight.layers, ...basemapLabels.layers]
    };


    mapInstance = new Map({
      container: 'map1',
      style: mapStyle,
      center: mapSettings.center,
      cooperativeGestures: width < 480 ? true : false,
      zoom: mapSettings.zoom,
      attributionControl: false
    })

  
    // Disable interactions if mapSettings.interactive is false

    if (!mapSettings.interactive) {
      mapInstance.dragPan.disable();
      mapInstance.scrollZoom.disable();
      mapInstance.boxZoom.disable();
      mapInstance.doubleClickZoom.disable();
      mapInstance.touchZoomRotate.disable();
    }

    mapInstance.addControl(new ScaleControl({
      unit: 'imperial'
    }), 'bottom-right');

    mapInstance.addControl(new ScaleControl({
      unit: 'metric'
    }), 'bottom-right');

    mapInstance.addControl(new NavigationControl({
      showCompass: false
    }), 'top-left');



    // Convert TopoJSON world land boundaries to GeoJSON FeatureCollection
    const worldGeo = feature(world, world.objects.ne_110m_land);

    // Set up minimap
    // Maybe later move all the minimap to its own component because it will look neater

    const minimapWidth = 150;
    const minimapHeight = 100;

    // Use orthographic projection for globe-style minimap, centered on main map `center`
    // Fix this later to update as required with panning etc

    minimapProjection = geoOrthographic()
      .rotate([-mapSettings.center[0], -mapSettings.center[1]])
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
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      console.log(
        `Center: ${center.lng}, ${center.lat}, Zoom: ${zoom}`,
        `Bounds SW: ${sw.lng}, ${sw.lat}, NE: ${ne.lng}, ${ne.lat}`
      );
    }

    // Function to set up map after it loads  
    function setupMapAfterLoad() {
      updateMinimap(mapInstance, minimapPath, viewportRect); // Initial update
      updateScaleControlPosition();
      // Listen to map movement and zoom events
      mapInstance.on('move', () => {
        updateMinimap(mapInstance, minimapPath, viewportRect);
        logMapState();
        updateScaleControlPosition();
      });
      // IMPORTANT: pass a function reference. Passing `updateMinimap(...)` would call it immediately
      // and register `undefined` as the handler, which MapLibre will later try to `.call` during events.
      mapInstance.on('moveend', () => updateMinimap(mapInstance, minimapPath, viewportRect));
      mapInstance.on('zoom', () => {
        updateMinimap(mapInstance, minimapPath, viewportRect);
        logMapState();
        updateScaleControlPosition();
      });
      mapInstance.on('zoomend', () => updateMinimap(mapInstance, minimapPath, viewportRect));
      mapInstance.on('resize', () => updateMinimap(mapInstance, minimapPath, viewportRect));
    }

    // Check if map is already loaded (can happen in article format)
    if (mapInstance.loaded()) {
      setupMapAfterLoad();
    } else {
      mapInstance.once('load', setupMapAfterLoad);
    }

    mapInstance.on('load', () => {
      // mapInstance.setCenter(center);
      // mapInstance.resize();
      const canvas = mapInstance.getCanvas();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const aspect = width / height;
      // optional padding for desktop / mobile, currently not in use 
      // let padding = aspect > 1 ? paddingDesktop : paddingMobile;
     
      mapInstance.fitBounds(mapSettings.viewBounds, {
        duration: 0
      });


      // Manual disputed borders from file, these need to be updated
      // There are also dispuated borders in the underlying pmtiles data
      // We probably need to discuss disputed borders approach generally


      mapInstance.addSource('disputed-borders', {
        type: 'geojson',
        data: disputedBorders
      });

      mapInstance.addLayer({
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


      // All the map settings toggles

      mapInstance.setLayoutProperty("county", "visibility", mapSettings.showCounties ? "visible" : "none");
      mapInstance.setLayoutProperty("city-labels", "visibility", mapSettings.showCityLabels ? "visible" : "none");
      mapInstance.setLayoutProperty("town-labels", "visibility", mapSettings.showTownAndLocalityLabels ? "visible" : "none");
      mapInstance.setLayoutProperty("country-labels", "visibility", mapSettings.showCountryLabels ? "visible" : "none");
      mapInstance.setLayoutProperty("capital-labels-lowzoom", "visibility", mapSettings.showCapitalLabels ? "visible" : "none");
      mapInstance.setLayoutProperty("capital-labels-highzoom", "visibility", mapSettings.showCapitalLabels ? "visible" : "none");

      // Demo code to highlight a particular country label in the same style that graphics uses
      // To do: add the option to do this at the spreadsheet level

      if (mapSettings.highlightCountry) {
        
        mapInstance.setFilter("country-labels", [
          "all",
          ["==", ["get", "kind"], "country"],
          ["!=", ["get", "name:en"], mapSettings.highlightCountry]
        ]);

        mapInstance.addLayer({
          id: "places-labels-iran",
          type: "symbol",
          source: "pmvt",
          "source-layer": "places",
          filter: ["all", ["==", ["get", "kind"], "country"], ["==", ["get", "name:en"], mapSettings.highlightCountry]],
          layout: {
            "text-field": ["get", "name:en"],
            "text-font": ["GH Guardian Headline Bold"], // or whatever bold family you have
            "text-size": 16
          },
          paint: {
            "text-color": "#121212",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1
          }
        }, "country-labels"); 

      }


      // Demo code to replace label text from the underlying data
      // We need to go through the style guide and check for country names

      mapInstance.setLayoutProperty("country-labels", "text-field", [
      "case",
      ["==", ["get", "name:en"], "United Arab Emirates"],
      "UAE",                  // replacement text
      ["get", "name:en"]      // default: original label
      ]);  


  //   mapInstance.addSource('strikes', {
  //     type: 'geojson',
  //     data: strikesGeoJSON
  //   }); 

  //   // console.log(strikesGeoJSON);
  //   mapInstance.addLayer({
  //     id: 'strikes-layer',
  //     type: 'circle',
  //     source: 'strikes',
  //     paint: {
  //       'circle-radius': 3,
  //       'circle-color': ['get', 'color'],
  //       'circle-stroke-color': '#ffffff',
  //       'circle-stroke-width': 1,
  //       'circle-opacity': [
  //         'match',
  //         ['get', 'recency'],
  //         'old', 0.5,   // old strikes
  //         0.9           // default (recent or anything else)
  //       ]
  //     }
  //   },
  //   'town-labels'
  // );

    // Log data for clicked strike features
    // mapInstance.on('click', 'strikes-layer', (e) => {
    //   const feature = e.features && e.features[0];
    //   if (feature) {
    //     console.log('Strike clicked:', feature.properties, feature);
    //   }
    // });



    })

    // mapInstance.on('resize', () => {
    //   console.log('resize');
    //   mapInstance.setCenter(center);
    //   // mapInstance.resize();
    // }); 
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
