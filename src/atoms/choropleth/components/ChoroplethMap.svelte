<!-- src/lib/components/ChoroplethMap.svelte -->
<script>
  import { onMount } from 'svelte';
  import { database } from '$lib/stores/choro.svelte.js';

  import MapContainer from './MapContainer.svelte';
  import DropdownSelect from './DropdownSelect.svelte';
  import KeyLegend from './KeyLegend.svelte';
  import SearchBox from './SearchBox.svelte';
  import ZoomControls from './ZoomControls.svelte';
  import MapTooltip from './MapTooltip.svelte';

  
  export let data;
  export let boundaries;
  export let overlay;
  export let basemap;
  export let places;
  export let key;
  export let codes;
  export let place;
  export let debugForceRed = true;

  let mapContainer;
  let testing = false

  onMount(() => {
    Object.assign(database, data, { codes });
  });

  $: if (data) {
    Object.assign(database, data, { codes });
  }


</script>

<div class="map__wrapper">

  {#if database.title}
    <div class="choloropleth_title_block">
      <div class='chartTitle'>{database.title}</div>
      <div class='subTitle'>{@html database.subtitle}</div>
    </div>
  {/if}

  <div class="dropdown_controls">
    {#if data.mapping.length > 1 && database.dropdown}
      <DropdownSelect bind:selectedIndex={database.currentIndex} options={database.mapping} label="Currently showing" changeType={"changeData"} {mapContainer} />
    {/if}

    {#if data.locations.length > 1 && database.relocate}
      <DropdownSelect bind:selectedIndex={database.locationIndex} options={database.locations} label="Zoom to" changeType={"changeLocation"} {mapContainer} />
    {/if}
  </div>

  {#if database.displaySearch}
    <SearchBox {mapContainer} />
  {/if}

  {#if database.showKey}
    <KeyLegend />
  {/if}

  <div id="mapContainer">
    <ZoomControls {mapContainer} />
    <MapContainer 
      bind:this={mapContainer} 
      {boundaries} 
      {overlay} 
      {basemap} 
      {places}
      {debugForceRed}
    />
    <MapTooltip />
  </div>

  {#if database.footnote}
    <div class="notes"><div>{@html database.footnote}</div></div>
  {/if}

  {#if database.source}
    <div class="notes"><small>Source: {@html database.source}</small></div>
  {/if}

  {#if database.version && testing}
    <div class="notes"><small>{database.version}</small></div>
  {/if}

</div>

<style lang="scss">

  #mapContainer {
    position: relative;
  }

  .choloropleth_title_block {
    margin-bottom: 10px;
    width: 100%;
  }

  // Mobile and smaller - stacked layout
  @include mq($until: mobileLandscape) {
    .dropdown_controls {
      flex-direction: column;
      gap: 10px;
      align-items: stretch;
    }
  }
  
  // Above mobile landscape - side by side with 50% width minus gap
  @include mq($from: mobileLandscape) {
    .dropdown_controls {
      flex-direction: row;
      gap: 16px;
      align-items: center;
      justify-content: flex-start;
      
      :global(.dropdown-select) {
        width: calc(50% - 8px);
      }
    }
  }

  .chartTitle {
    font-size: 20px;
    line-height: 28px;
    font-weight: 600;
    -webkit-font-smoothing: antialiased;
    color: #333333;
    font-family: "GH Guardian Headline", Georgia, serif;
    margin-bottom: 2px;
  }

  .subTitle {
    font-size: 16px;
    line-height: 20px;
    color: #333333;
    font-family: "Guardian Egyptian Web", Georgia, serif;
  }

  .notes {
    font-family: 'Guardian Text Sans Web',Arial;
    font-size:11px;
    color:#767676;
  }

  .dropdown_controls {
    display: flex;
    margin-bottom: 10px;
  }
</style>