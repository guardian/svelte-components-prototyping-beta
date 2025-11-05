  <script>
    import { onMount } from 'svelte';
    import { getJson, merge, contains } from '$lib/helpers/guardian/toolbelt.js';
    import { log, logMessages, clearLogs } from '$lib/stores/logger.svelte.js';
    import ChoroplethMap from './ChoroplethMap.svelte';
    import { schema, detectOrdinalPattern } from '$lib/helpers/guardian/schema'
    import { getPartyColors, defaultColors } from '$lib/helpers/guardian/colours'
    import chroma from "chroma-js";

    // ===== COMPONENT PROPS =====
    let {
      title = '',
      subtitle = '',
      footnote = '',
      source = '',
      displaySearch = true,
      showKey = true,
      boundary = null,
      place = 'au',
      basemap = 'australia',
      data = null,
      mapping = [],
      locations = null,
      boundaryID = null, // By default this property will be auto-detected from the topojson. This is the property in the topojson that will be used to map the boundary to the data.
      dataID = null // By default this property is set using the first key from the data. This is the property in the data that will be used to map the data to the boundaries.
    } = $props();

    // ===== CONSTANTS =====
    const SPECIAL_KEYS = ['settings'];
    const POSTCODES_URL = 'https://interactive.guim.co.uk/docsdata/1bClr8buuWUaKj01NolwaJy2JR_SR5hKEAjQoJPaGKcw.json';
    const GIS_BASE_URL = 'https://interactive.guim.co.uk/gis';
    const PLACES_BASE_URL = 'https://interactive.guim.co.uk/embed/aus/gis-uploads';
    const BOUNDARIES_URL = 'https://interactive.guim.co.uk/docsdata/1eFx2S_gpFbC1GzncQgcutPWXbj2cZEgl_dnVPKblGyc.json';

    const partyArray = ["ALP","LIB","LNP","NAT","IND","GRN","CA","KAP","PUP","CA","NXT","XEN","ON","UAP"]
    // ===== STATE VARIABLES =====
    let mapData = $state(null);
    let postcodes = $state(null);
    let boundaries = $state(null);
    let overlay = $state(null);
    let places = $state(null);
    let loading = $state(false);
    let testing = $state(false);
    let boundaryData = $state([]);

    // ===== DATA LOADING FUNCTIONS =====
    async function loadMainData() {

      let boundaryDataTemp = await getJson(BOUNDARIES_URL);
      boundaryData = boundaryDataTemp.sheets.boundaries

      if (place == 'au' && locations == null) {
        locations = boundaryDataTemp.sheets.au  
      }

      const defaultStructure = {
        sheets: {
          data: data,
          settings: [{
            title: title,
            subtitle: subtitle,
            footnote: footnote,
            source: source,
            boundary: boundary,
            place: place,
            basemap: basemap,
            version: '1.0'
          }],
          mapping: mapping,
          locations: locations
        }
      };

      return defaultStructure //merge(defaultStructure, json);
    }

    async function loadPostcodes() {
      try {
        const codes = await getJson(POSTCODES_URL);
        return codes.sheets.postcodes.map(item => ({
          ...item,
          meta: `${item.postcode} ${item.place_name}`
        }));
      } catch (error) {
        //log('Error loading postcodes:', error.message, 'error');
        return [];
      }
    }

    async function loadGISData(urls) {
      const results = {};

      if (urls.boundary) {
        try {
          //log('Loading boundaries from:', urls.boundary);
          const boundariesData = await getJson(urls.boundary);
          //console.//log(boundariesData.objects)
          results.boundaries = processBoundariesData(boundariesData);
          //log('Boundaries loaded successfully');
        } catch (error) {
          //log('Error loading boundaries:', error.message, 'error');
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
            ////log(`Loading ${loader.name} from:`, loader.url);
            results[loader.key] = await getJson(loader.url);
            //log(`${loader.name} loaded successfully`);
          } catch (error) {
            //log(`Error loading ${loader.name}:`, error.message, 'error');
            results[loader.key] = null;
          }
        }
      }

      return results;
    }

    function getBoundaryId(boundariesData) {
      // Use manually specified boundaryID if provided
      if (boundaryID) {
        //log('Using manually specified boundaryID:', boundaryID);
        return boundaryID;
      }

      if (!boundary) return null;

      try {
        // Handle HTTP URLs - extract from boundary data structure
        if (boundary.startsWith('http')) {
          const topoKey = Object.keys(boundariesData.objects)[0];
          const geometries = boundariesData.objects[topoKey].geometries;
          
          if (geometries.length === 0) return null;
          
          const properties = Object.keys(geometries[0].properties);
          const detectedID = properties[0] || null;
          //log('Auto-detected boundaryID from topojson:', detectedID);
          return detectedID;
        }
        
        // Handle boundary names - lookup in boundary data
        const boundaryConfig = boundaryData.find(item => item.name === boundary);
        const detectedID = boundaryConfig?.key || null;
        //log('Auto-detected boundaryID from boundary config:', detectedID);
        return detectedID;
        
      } catch (error) {
        //log('Error getting boundary ID:', error.message, 'error');
        return null;
      }
    }

    function getDataId(data) {
      // Use manually specified dataID if provided
      if (dataID) {
        //log('Using manually specified dataID:', dataID);
        return dataID;
      }
      
      if (!data || !data.length) {
        //log('No data available for dataID detection', {}, 'error');
        return null;
      }
      
      const dataKeys = Object.keys(data[0]);
      const detectedID = dataKeys[0];
      //log('Auto-detected dataID from data (first key):', detectedID);
      return detectedID;
    }



    function createDefaultMapping(columnSchema, processedData = null) {

      const { column, dataTypes, formats } = columnSchema;
      const format = formats[0].format;
      const isNumeric = dataTypes.includes('number');

      // Create comprehensive tooltip with all available properties
      let tooltip = `{{${column}}}`;
      
      if (processedData && processedData.length > 0) {
        const allKeys = Object.keys(processedData[0]);
        const tooltipParts = allKeys.map(key => {
          // Format the key name for display (capitalize first letter, replace underscores with spaces)
          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return `${displayKey}: {{${key}}}`;
        });
        tooltip = tooltipParts.join('<br/>');
      }

      if (isNumeric) {
        // Create numeric mapping with sequential colors
        const { min, max } = format;
        
        // Validate min/max values
        if (typeof min !== 'number' || typeof max !== 'number' || isNaN(min) || isNaN(max)) {
          //log('Invalid min/max values, falling back to ordinal mapping', { min, max }, 'warn');
          return {
            data: column,
            display: `${column} (auto-generated)`,
            values: "Low, Medium, High",
            colours: "#fdd2c0,#fd8c3c,#e31a1c",
            tooltip: tooltip,
            scale: 'ordinal',
            keyText: `${column} values →`
          };
        }
        
        const mid = (min + max) / 2;
        
        return {
          data: column,
          display: `${column} (auto-generated)`,
          values: `${min.toFixed(1)}, ${mid.toFixed(1)}, ${max.toFixed(1)}`,
          colours: "#fdd2c0,#fd8c3c,#e31a1c", // Light to dark red sequence
          tooltip: tooltip,
          scale: format.scale === 'scaleLinear' ? 'linear' : 'ordinal',
          keyText: `${column} values →`
        };
      } else {
        // Create categorical mapping for strings
        let actualValues = "Category A, Category B, Category C"; // fallback to random categories to illustrate to the user how this field is populated.
        let categoricalColors = "#1f77b4,#ff7f0e,#2ca02c"; // default 3 colors
        let scaleType = 'ordinal'; // default to ordinal for categorical data (D3 standard)
        let isLikelyOrdinal = false; // default to false for unordered categories
        
        if (processedData && processedData.length > 0) {
          // Extract unique values and their frequencies using Set and Map
          const valueFrequency = new Map();
          
          processedData.forEach(item => {
            const value = item[column];
            if (value != null && value !== '') {
              const stringValue = String(value).trim();
              valueFrequency.set(stringValue, (valueFrequency.get(stringValue) || 0) + 1);
            }
          });
          
          // Sort by frequency (descending) and take top values
          const sortedValues = [...valueFrequency.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10) // Take top 5 most common
            .map(([value, _]) => value);
          
          if (sortedValues.length > 0) {
            actualValues = sortedValues.join(','); // No spaces to avoid issues when split
            
            // Detect if this might be ordinal data (has natural ordering)
            const isLikelyOrdinal = detectOrdinalPattern(sortedValues);
            // Always use 'ordinal' scale type for D3 compatibility
            scaleType = 'ordinal';
            
            // Choose colors based on whether data has natural ordering
            if (isLikelyOrdinal) {
              // Use sequential colors for ranked data (light to dark) generated from defaultColors
              const generateOrdinalPalette = (length) => {
                const baseColor = defaultColors[0]; // Use first color as base
                const lightColor = chroma(baseColor).brighten(2).hex();
                const darkColor = chroma(baseColor).darken(1).hex();
                
                if (length === 1) {
                  return lightColor;
                }
                
                return chroma.scale([lightColor, darkColor])
                  .mode('lab')
                  .colors(length)
                  .join(',');
              };
              
              categoricalColors = generateOrdinalPalette(sortedValues.length);
                          } else {
                // Use distinct colors for unordered categories from defaultColors
                const generateNominalPalette = (length) => {
                  return defaultColors.slice(0, Math.min(length, defaultColors.length)).join(',');
                };

                // Are the values related to political parties? If so then assign the party colours. Check if sortedValues is a subset of partyArray (case insensitive)
                const isSubset = sortedValues.every(value => partyArray.includes(value.toUpperCase()));
                
                if (isSubset) {
                  categoricalColors = sortedValues.map(value => getPartyColors(value.toLowerCase())).join(',');
                } else {
                  categoricalColors = generateNominalPalette(sortedValues.length);
                }
              }
          }
        }
        
        return {
          data: column,
          display: `${column} (auto-generated)`,
          values: actualValues,
          colours: categoricalColors,
          tooltip: tooltip,
          scale: scaleType,
          keyText: `${column} ${isLikelyOrdinal ? 'levels' : 'categories'} →`
        };
      }
    }

    function validateBoundaryDataMapping(boundariesData, boundaryID, dataID, dataToValidate = null) {
      if (!boundaryID || !dataID) return false;

      // Use provided data or fall back to mapData.data
      const validationData = dataToValidate || mapData?.data;
      if (!validationData) {
        //log('No data available for boundary validation', {}, 'error');
        return false;
      }

      try {
        // Get all boundary values from topojson
        const topoKey = Object.keys(boundariesData.objects)[0];
        const geometries = boundariesData.objects[topoKey].geometries;
        
        const boundaryValues = new Set(
          geometries.map(geometry => geometry.properties[boundaryID])
            .filter(value => value != null)
        );

        // Get all data values from map data
        const dataValues = new Set(
          validationData.map(item => item[dataID])
            .filter(value => value != null)
        );

        // Check for overlap
        const intersection = new Set([...boundaryValues].filter(value => dataValues.has(value)));
        
        log(`Boundary mapping validation:`, {
          boundaryValues: boundaryValues.size,
          dataValues: dataValues.size,
          matchingValues: intersection.size,
          sampleBoundaryValues: [...boundaryValues].slice(0, 3),
          sampleDataValues: [...dataValues].slice(0, 3),
          sampleMatches: [...intersection].slice(0, 3)
        });

        return intersection.size > 0;
        
      } catch (error) {
        log('Error validating boundary data mapping:', error.message, 'error');
        return false;
      }
    }

    // ===== DATA PROCESSING FUNCTIONS =====
    function processBoundariesData(boundariesData) {

      if (!mapData?.data?.length) return boundariesData;

      try {
        const boundariesTopoKey = Object.keys(boundariesData.objects)[0];
        const geometries = boundariesData.objects[boundariesTopoKey].geometries;

        if (geometries.length === 0) return boundariesData;
        
        const currentBoundaryID = getBoundaryId(boundariesData);
        const currentDataID = getDataId(mapData.data);
        
        // Validate that boundary and data IDs have overlapping values
        if (!validateBoundaryDataMapping(boundariesData, currentBoundaryID, currentDataID)) {
          log('Boundary and data mapping failed - no common values found', {
            boundaryID: currentBoundaryID,
            dataID: currentDataID,
            suggestion: 'Consider specifying boundaryID and/or dataID manually in component params'
          }, 'error');
          log('Note: Data is being mapped using the first key from your data unless dataID is specified', { firstKey: currentDataID }, 'error');
          return boundariesData; // Return unmodified data
        }
        
        // Merge boundary data with map data
        geometries.forEach(item => {
          const matchingData = mapData.data.find(datum => 
            datum[currentDataID] == item.properties[currentBoundaryID]
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
        displaySearch: displaySearch,
        showKey: showKey,
        showLabels: true,
        isAndroidApp: false,
        displayOverlay: false,
        autocompleteArray: [],
        searchBlock: '',
        zoomOn: true,
        centreLat: -28,
        centreLon: 135,
        zoomScale: 0,
        currentKey: ''
      };

      for (const key of Object.keys(data)) {

        if (SPECIAL_KEYS.includes(key)) {
          Object.entries(data[key][0]).forEach(([specialKey, value]) => {
            settings[specialKey.replace('-', '')] = value;
          });
        }

        switch (key) {
          case 'data':
            settings.data = processDataArray(data[key]);
            break;
          case 'mapping':
            const mappingResult = processMapping(data[key], settings.data);
            Object.assign(settings, mappingResult);
            break;
          case 'locations':
            Object.assign(settings, processLocations(data[key]));
            break;
        }
      }
      return settings;
    }

    function processDataArray(dataArray) {
      if (!dataArray?.length) return [];

      const keys = Object.keys(dataArray[0]);
      
      return dataArray.map(item => {
        const processedItem = { ...item };
        
        keys.forEach(key => {
          // Don't convert ID fields to numbers - keep them as strings
          const isIdField = key.toLowerCase().includes('code') || 
                           key.toLowerCase().includes('id') || 
                           key.toLowerCase().endsWith('_id');
          
          if (!isIdField && !isNaN(processedItem[key])) {
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

    function processMapping(mappingArray, processedData) {
      if (!mappingArray || mappingArray.length === 0) {
        if (!processedData || !processedData.length) {
          log('No processed data available for auto-mapping', {}, 'error');
          return { dropdown: false, mapping: [] };
        }

        try {

          const dataSchema = schema(processedData);
          const currentDataID = getDataId(processedData);
          
          log('Data schema analysis:', JSON.stringify(dataSchema, null, 2));
          //log('Current dataID:', currentDataID);

          // Find first column that's not the dataID
          const availableColumns = dataSchema.filter(col => col.column !== currentDataID);
          
          if (availableColumns.length === 0) {
            log('No suitable columns found for mapping', {}, 'error');
            return { dropdown: false, mapping: [] };
          }

          const selectedColumn = availableColumns[0];
          //log('Selected column for default mapping:', selectedColumn);

          // Create mapping object based on column type
          const defaultMapping = createDefaultMapping(selectedColumn, processedData);

          // Paste these into settings and edit them to your liking
          log('Mapping settings:', JSON.stringify(defaultMapping, null, 2));

          // Update the mapping prop
          mapping = [defaultMapping];

          return {
            dropdown: true,
            mapping: [defaultMapping],
            currentKey: defaultMapping.data
          };
          
        } catch (error) {
          log('Error analyzing data schema:', error.message, 'error');
          log('Falling back to basic mapping without schema analysis');
          
          // Fallback: create a basic mapping using the second column
          const currentDataID = getDataId(processedData);
          const dataKeys = Object.keys(processedData[0]);
          const availableKeys = dataKeys.filter(key => key !== currentDataID);
          
          if (availableKeys.length === 0) {
            log('No columns available for fallback mapping', {}, 'error');
            return { dropdown: false, mapping: [] };
          }
          
          // Create comprehensive tooltip for fallback mapping
          const allKeys = Object.keys(processedData[0]);
          const tooltipParts = allKeys.map(key => {
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${displayKey}: {{${key}}}`;
          });
          const fallbackTooltip = tooltipParts.join('<br/>');

          const fallbackMapping = {
            data: availableKeys[0],
            display: `${availableKeys[0]} (fallback)`,
            values: "Low, Medium, High",
            colours: "#fdd2c0,#fd8c3c,#e31a1c",
            tooltip: fallbackTooltip,
            scale: "ordinal",
            keyText: `${availableKeys[0]} values →`
          };
          
          mapping = [fallbackMapping];
          
          return {
            dropdown: true,
            mapping: [fallbackMapping],
            currentKey: fallbackMapping.data
          };
        }
      }

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

        log('MapData after initialization:', {
          hasData: !!mapData.data,
          hasMapping: !!mapData.mapping,
          mappingLength: mapData.mapping ? mapData.mapping.length : 0,
          mappingData: mapData.mapping ? mapData.mapping[0]?.data : 'none',
          currentKey: mapData.currentKey
        });

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

    {#if loading}
      <ChoroplethMap
        {boundaries}
        {overlay}
        {basemap}
        {places}
        data={mapData}
        codes={postcodes}
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
  </style> 