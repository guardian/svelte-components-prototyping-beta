<script>
  // Core imports
  import { onMount } from 'svelte'
  import { getJson } from '$lib/helpers/guardian/toolbelt.js';
  import Choropleth from './Choropleth.svelte';
  import Logger from './Logger.svelte';
  import Resizer from './Resizer.svelte';

  // Data for the maps. This could come from a google sheet or a json file.
  let data = $state([]);

  let { name = '' } = $props();

  onMount(async() => {
    const url = `https://interactive.guim.co.uk/embed/iframes/2026/09/suburb-price-choro/atom-1/assets/prices.json`;
    const json = await getJson(url);
    data = json ? json : [];
    console.log(data)
  })

</script>

<div class="atom">

  <Resizer atomName={`#${name}`}/>

  <Logger testing={false} />

  {#if data.length > 0}

    <Choropleth 
      {data}
      boundary={'suburbs-house-prices-2026'}
      title={'Change in dwelling prices by suburb'}
      subtitle={'Showing the change in dwelling value over three months, 12 months and five years'}
      footnote={''}
      source={'Cotality'}
      displaySearch={true}
      boundaryID={'SAL_NAME21'}
      mapping={[{
        "data": "12_months",
        "display": "Price change (12 months)", 
        "values": "-20,-10,-5,0,5,10,20,40",
        "colours":"#313695,#4575b4,#74add1,#abd9e9,#fee090,#fdae61,#f46d43,#d73027,#a50026",
        "tooltip": "{{12_months}}",
        "overlay-tooltip": "",
        "scale": "threshold",
        "keyText": "Price change (%)"
    },
    {
        "data": "3_months",
        "display": "Price change (3 months)", 
        "values": "-10,-5,-2.5,0,2.5,5,10",
        "colours":"#4575b4,#74add1,#abd9e9,#e0f3f8,#fee090,#fdae61,#f46d43,#d73027",
        "tooltip": "{{3_months}}",
        "overlay-tooltip": "",
        "scale": "threshold",
        "keyText": "Price change (%)"
    }
    
    ]}
    />
  {:else}
    <h1>Loading...</h1>
  {/if}
</div>

<style lang="scss">

  .atom {
    width:100%;
    position: relative;
  }

  h2 {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
  }
</style>
