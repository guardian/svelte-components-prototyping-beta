<script>
    import { onMount } from 'svelte';
    import * as topojson from 'topojson-client';
    import * as d3 from 'd3';

    /*
    /* This component is used to display base maps created in pollarama.
    /* By default the pollarama settings accompanying the image are used to set the bbox and projection.
    /* If you pass in a valid topoURL, the topojson will be used to set the bbox and projection. You can add a margin around the topojson bbox.
    /* You can force the map to use the base map bbox by setting useBaseMapBbox to true. If you do the VIEWPORT_WIDTH and VIEWPORT_HEIGHT will be set to the base map width and height.
    /* The imageUrl is the path to the base map image created using pollarama.
    /* The imageBBox is pulled from the pollarama settings
    /* The boundaryData is displayed as geographical boundarties.
    /* The labelsData is displayed as place labels.
    /* If you use topoData you will probably need to change how it is displayed. The default method is pretty basic
    /* The plan is to add in geojson as in import option
    */
 
    let {
        settings = `https://interactive.guim.co.uk/embed/aus/gis-uploads/basemaps/ry9dkay2pc.json`,
        labelsURL = `https://interactive.guim.co.uk/embed/aus/gis-uploads/places.json`,
        boundariesURL = `https://interactive.guim.co.uk/embed/aus/gis-uploads/states.json`,
        imageUrl = `https://interactive.guim.co.uk/embed/aus/gis-uploads/basemaps/ry9dkay2pc.png`,
        topoURL = `https://interactive.guim.co.uk/embed/aus/gis-uploads/data/melbourne.json`,
        margin = 100,
        VIEWPORT_WIDTH = 1080,
        VIEWPORT_HEIGHT = 1080,
        useBaseMapBbox = false,
    } = $props();

    let width = $state(null);

    let geo = $state(null);
    let projection = $state(null);
    let pathGenerator = $state(null);
    let imgLoaded = $state(false);
    let imageEl = $state(null);
    let projectedImageBounds = $state(null);

    let labelsData = $state([])
    let imageBBox = $state([])
    let topoData = $state([])

    let isMobile = $derived(width < 480) 

    let stateMarkers = [
        {"text":"Queensland", "coords":[ 149.08155883483496, -26.685187788292268,]},
        {"text":"NSW", "coords":[ 148.89114198260708, -30.15343044705522,]}
    ]

    let placeLabels = $derived(labelsData?.features?.filter((d) => (isMobile) ? d.properties.scalerank < 4 : d.properties.scalerank < 6 ));

    function projectBBox(bbox) {
        const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds(bbox);
        const topLeft = projection([minLon, maxLat]);
        const bottomRight = projection([maxLon, minLat]);
        return {
            x: topLeft[0],
            y: topLeft[1],
            width: bottomRight[0] - topLeft[0],
            height: bottomRight[1] - topLeft[1]
        };
    }

    async function loadData() {
        const [settingsDataResponse, labelsDataResponse] = await Promise.all([
            fetch(settings),
            fetch(labelsURL)
        ]);
        
        [imageBBox, labelsData] = await Promise.all([
            settingsDataResponse.json(),
            labelsDataResponse.json(),
        ]);

        if (topoURL != null) {
            const topoDataResponse = await fetch(topoURL);
            topoData = await topoDataResponse.json();
        }
    } 

    onMount(async () => {


        await loadData()
        projection = d3.geoMercator();

        imageEl = new Image();
        imageEl.onload = () => {
            imgLoaded = true;
        };
        imageEl.onerror = e => console.error('Image load error:', e);
        if (imageUrl) {
            imageEl.src = imageUrl;
        }

        const imageProps = imageBBox.features[0].properties;    
        let imageHeight = imageProps.height;
        let imageWidth = imageProps.width;

        if (useBaseMapBbox) {
            VIEWPORT_WIDTH = imageBBox.features[0].properties.width;
            VIEWPORT_HEIGHT = imageBBox.features[0].properties.height;
        }

        // Initialize map data if topojson is available
        if (topoData?.objects) {
            try {
                const key = Object.keys(topoData.objects)[0];
                geo = topojson.feature(topoData, topoData.objects[key]);

                if (useBaseMapBbox) {
                    projection.fitSize([imageWidth, imageHeight], imageBBox);
                } else {
                    projection.fitSize([VIEWPORT_WIDTH - 2 * margin, VIEWPORT_HEIGHT - 2 * margin], geo);
                    const translate = projection.translate();
                    projection.translate([translate[0] + margin, translate[1] + margin]);
                }

                pathGenerator = d3.geoPath(projection);
                
                if (imageBBox) {
                    projectedImageBounds = projectBBox(imageBBox);
                }

            } catch (err) {
                console.error('Error initializing map:', err);
            }
        } else {
            // Fallback to just using the image bbox
            if (imageBBox) {
                projection.fitSize([imageWidth, imageHeight], imageBBox);
                projectedImageBounds = projectBBox(imageBBox);
                pathGenerator = d3.geoPath(projection);
            }            
        }
    });

</script>

<div class="map" bind:clientWidth={width}>
    <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 {VIEWPORT_WIDTH} {VIEWPORT_HEIGHT}" 
        preserveAspectRatio="xMidYMid meet"
    >
        <defs>
            {#if imgLoaded && projectedImageBounds}
                <pattern id="bg-image" patternUnits="userSpaceOnUse" 
                    x={projectedImageBounds.x} y={projectedImageBounds.y}
                    width={projectedImageBounds.width} height={projectedImageBounds.height}>
                    <image href={imageUrl} 
                        width={projectedImageBounds.width} height={projectedImageBounds.height}
                        preserveAspectRatio="xMidYMid slice"/>
                </pattern>
            {/if}
        </defs>

        {#if imgLoaded && projectedImageBounds}
            <rect 
                x={projectedImageBounds.x} 
                y={projectedImageBounds.y}
                width={projectedImageBounds.width} 
                height={projectedImageBounds.height} 
                fill="url(#bg-image)"/>
        {/if}

        {#if geo && pathGenerator}
            {#each geo.features as feature}
                <path 
                    d={pathGenerator(feature)} 
                    fill="#ccc"
                    fill-opacity="0.4"
                    stroke="#333"
                    stroke-width="1"
                />
            {/each}

            {#each stateMarkers as d}
                {@const projectedCoords = projection(d.coords)}
                <text 
                    x={projectedCoords[0]} 
                    y={projectedCoords[1]}
                    font-family={"Guardian Titlepiece"}
                    font-size={"18px"}
                    opacity="0.6"
                    stroke="#FFF"
                    stroke-width="3"
                    paint-order="stroke"
                    fill="#000"
                >
                    {d.text}
                </text>
            {/each}

            {#each placeLabels as d}
                {@const projectedCoords = projection(d.geometry.coordinates)}
                <text 
                    x={projectedCoords[0]} 
                    y={projectedCoords[1]}
                    font-family={`"Guardian Text Sans Web", "Agate Sans", "sans-serif"`}
                    font-size={isMobile ? 10 : 14}
                    opacity="0.6"
                    stroke="#FFF"
                    stroke-width="3"
                    paint-order="stroke"
                    fill="#000"
                >
                    {d['properties']['name']}
                </text>
            {/each}
        {/if}
    </svg>
</div>

<style lang="scss">
    .map {
        position: relative;
        width: 100%;
        min-height: 100px;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
    }

    text {
        text-anchor: middle;
        dominant-baseline: middle;
    }
</style>