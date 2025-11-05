<script>
  import { onMount } from 'svelte';
  import { getJson, merge, contains } from '$lib/helpers/guardian/toolbelt.js';
  import ChoroplethMap from './ChoroplethMap.svelte';

  // ===== COMPONENT PROPS =====
  let {
    mapKey = 'oz-230515-suburb-population-densification-map',
    location = 'docsdata',
    modal = false
  } = $props();

  // ===== CONSTANTS =====
  const SPECIAL_KEYS = ['settings'];
  const POSTCODES_URL = 'https://interactive.guim.co.uk/docsdata/1bClr8buuWUaKj01NolwaJy2JR_SR5hKEAjQoJPaGKcw.json';
  const GIS_BASE_URL = 'https://interactive.guim.co.uk/gis';
  const PLACES_BASE_URL = 'https://interactive.guim.co.uk/embed/aus/gis-uploads';
  const BOUNDARIES_URL = 'https://interactive.guim.co.uk/docsdata/1eFx2S_gpFbC1GzncQgcutPWXbj2cZEgl_dnVPKblGyc.json';

  // ===== STATE VARIABLES =====
  let mapData = $state(null);
  let postcodes = $state(null);
  let boundaries = $state(null);
  let overlay = $state(null);
  let basemap = $state(null);
  let places = $state(null);
  let loading = $state(false);
  let logMessages = $state([]);
  let testing = $state(false);
  let place = $state(null);

  // ===== DATA LOADING FUNCTIONS =====
  async function loadMainData() {
    const url = `https://interactive.guim.co.uk/${location}/${mapKey}.json`;
    const json = await getJson(url);

    console.log(url)

    const defaultStructure = {
      sheets: {
        data: [],
        settings: [{
          title: '',
          subtitle: '',
          footnote: '',
          source: '',
          boundary: '',
          place: '',
          filter: '',
          search: '',
          basemap: '',
          version: '1.0'
        }],
        mapping: [],
        locations: []
      }
    };

    return merge(defaultStructure, json);
  }

  async function loadPostcodes() {
    try {
      const codes = await getJson(POSTCODES_URL);
      return codes.sheets.postcodes.map(item => ({
        ...item,
        meta: `${item.postcode} ${item.place_name}`
      }));
    } catch (error) {
      log('Error loading postcodes:', error.message, 'error');
      return [];
    }
  }

  async function loadGISData(urls) {
    const results = {};

    // Load boundaries (required)
    if (urls.boundary) {
      try {
        log('Loading boundaries from:', urls.boundary);
        const boundariesData = await getJson(urls.boundary);
        console.log(urls.boundary)
        results.boundaries = processBoundariesData(boundariesData);
        log('Boundaries loaded successfully');
      } catch (error) {
        log('Error loading boundaries:', error.message, 'error');
        throw error;
      }
    }

    // Load optional GIS layers
    const optionalLoaders = [
      { key: 'places', url: urls.places, name: 'places' },
      { key: 'overlay', url: urls.overlay, name: 'overlay' },
      { key: 'basemap', url: urls.basemap, name: 'basemap' }
    ];

    for (const loader of optionalLoaders) {
      if (loader.url) {
        try {
          log(`Loading ${loader.name} from:`, loader.url);
          results[loader.key] = await getJson(loader.url);
          log(`${loader.name} loaded successfully`);
        } catch (error) {
          log(`Error loading ${loader.name}:`, error.message, 'error');
          results[loader.key] = null;
        }
      }
    }

    return results;
  }

  // ===== DATA PROCESSING FUNCTIONS =====
  function processBoundariesData(boundariesData) {
    if (!mapData?.data?.length) return boundariesData;

    try {
      const boundariesTopoKey = Object.keys(boundariesData.objects)[0];
      const geometries = boundariesData.objects[boundariesTopoKey].geometries;

      if (geometries.length === 0) return boundariesData;
      
      const boundaryID = Object.keys(geometries[0].properties)[0];
      const dataKeys = Object.keys(mapData.data[0]);
      const id = dataKeys[0];

      // Merge boundary data with map data
      geometries.forEach(item => {
        const matchingData = mapData.data.find(datum => 
          datum[id] == item.properties[boundaryID]
        );
        if (matchingData) {
          item.properties = { ...item.properties, ...matchingData };
        }
      });

      return boundariesData;
    } catch (error) {
      log('Error processing boundaries data:', error.message, 'error');
      return boundariesData;
    }
  }

  function buildGISUrls(settings) {
    const urls = {};

    const processUrl = (rawUrl, baseUrl) => {
      if (!rawUrl) return null;
      return rawUrl.startsWith('http') ? rawUrl : `${baseUrl}/${rawUrl}.json`;
    };

    urls.boundary = processUrl(settings.boundary, GIS_BASE_URL);
    urls.overlay = processUrl(settings.overlay, GIS_BASE_URL);
    urls.basemap = processUrl(settings.basemap, GIS_BASE_URL);

    // Remove null values
    Object.keys(urls).forEach(key => {
      if (urls[key] === null) delete urls[key];
    });

    const placeValue = settings.place || 
      (urls.boundary?.includes('world_110m.json') ? 'world' : 'au');
    
    if (placeValue) {
      urls.places = `${PLACES_BASE_URL}/places_${placeValue}.json`;
    }

    return { urls, place: placeValue };
  }

  function initializeSettings(data) {
    const settings = {
      currentIndex: 0,
      locationIndex: 0,
      displaySearch: true,
      showKey: true,
      showLabels: true,
      isAndroidApp: false,
      displayOverlay: false,
      autocompleteArray: [],
      searchBlock: '',
      zoomOn: true,
      dropdown: false,
      relocate: false,
      centreLat: -28,
      centreLon: 135,
      zoomScale: 0,
      currentKey: null
    };

    Object.keys(data).forEach(key => {
      if (SPECIAL_KEYS.includes(key)) {
        // Process settings
        Object.entries(data[key][0]).forEach(([specialKey, value]) => {
          settings[specialKey.replace('-', '')] = value;
        });
      } else {
        // Process other data types
        switch (key) {
          case 'data':
            settings.data = processDataArray(data[key]);
            break;
          case 'mapping':
            Object.assign(settings, processMapping(data[key]));
            break;
          case 'locations':
            Object.assign(settings, processLocations(data[key]));
            break;
        }
      }
    });

    return settings;
  }

  function processDataArray(dataArray) {
    if (!dataArray?.length) return [];

    const keys = Object.keys(dataArray[0]);
    
    return dataArray.map(item => {
      const processedItem = { ...item };
      
      keys.forEach(key => {
        if (!isNaN(processedItem[key])) {
          if (processedItem[key] === '') {
            processedItem[key] = null;
          } else if (typeof processedItem[key] === 'string') {
            processedItem[key] = +processedItem[key];
          }
        }
      });
      
      return processedItem;
    });
  }

  function processMapping(mappingArray) {
    const result = {
      dropdown: mappingArray.length > 0,
      mapping: mappingArray
    };

    if (mappingArray.length > 0) {
      const coordinateData = extractCoordinateData(mappingArray[0]);
      if (coordinateData) {
        Object.assign(result, coordinateData);
      }
      
      // Set currentKey from mapping[0].data
      if (mappingArray[0].data) {
        result.currentKey = mappingArray[0].data;
      }
    }

    return result;
  }

  function processLocations(locationsArray) {
    const result = {
      relocate: locationsArray.length > 0,
      locations: locationsArray
    };

    if (locationsArray.length > 0) {
      const coordinateData = extractCoordinateData(locationsArray[0]);
      if (coordinateData) {
        Object.assign(result, coordinateData);
      }
    }

    return result;
  }

  function extractCoordinateData(item) {
    const keys = Object.keys(item);
    const hasCoordinates = contains(keys, 'centreLat') && 
                          contains(keys, 'centreLon') && 
                          contains(keys, 'zoomScale');

    if (hasCoordinates) {
      return {
        centreLat: +item.centreLat,
        centreLon: +item.centreLon,
        zoomScale: +item.zoomScale
      };
    }

    return null;
  }

  // ===== UTILITY FUNCTIONS =====
  function log(message, data = null, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const displayMessage = data !== null 
      ? `${message} ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`
      : message;
    
    const formattedMessage = `[${timestamp}] ${displayMessage}`;
    logMessages = [...logMessages, { text: formattedMessage, type }];
    
    if (type === 'error') {
      console.error(message, data);
    } else {
      //console.log(message, data);
    }
  }

  // ===== MAIN INITIALIZATION =====
  async function initialize() {
    try {
      log('Starting data initialization...');

      // Load main data and postcodes in parallel
      const [mainData, postcodesData] = await Promise.all([
        loadMainData(),
        loadPostcodes()
      ]);

      postcodes = postcodesData;
      mapData = initializeSettings(mainData.sheets);

      // Build GIS URLs and load GIS data
      const { urls, place: placeValue } = buildGISUrls(mainData.sheets.settings[0]);
      place = placeValue;
      log('Loading GIS data with URLs:', urls);

      const gisData = await loadGISData(urls);
      
      // Assign loaded data
      boundaries = gisData.boundaries;
      places = gisData.places;
      overlay = gisData.overlay;
      basemap = gisData.basemap;

      log('All data loaded successfully:', {
        mapData: mapData ? 'loaded' : 'null',
        postcodes: postcodes ? 'loaded' : 'null',
        boundaries: boundaries ? 'loaded' : 'null',
        places: places ? 'loaded' : 'null',
        overlay: overlay ? 'loaded' : 'null',
        basemap: basemap ? 'loaded' : 'null'
      });

      loading = true;
    } catch (error) {
      log('Critical error during initialization:', error.message, 'error');
      throw error;
    }
  }

  // ===== LIFECYCLE =====
  onMount(initialize);
</script>

<div class="atom">
  {#if testing}
    <div class="log-container">
      {#each logMessages as message}
        <div class="log-message {message.type}">
          {message.text}
        </div>
      {/each}
    </div>
  {/if}

  {#if loading}
    <ChoroplethMap
      {boundaries}
      {overlay}
      {basemap}
      {places}
      data={mapData}
      codes={postcodes}
      key={mapKey}
      {place}
    />
  {/if}
</div>

<style lang="scss">
  .atom {
    width: 100%;
    position: relative;
    background-color: white;
  }

  .log-container {
    margin-top: 20px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
  }

  .log-message {
    padding: 4px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    &.error {
      color: #d32f2f;
    }

    &:last-child {
      border-bottom: none;
    }
  }
</style> 