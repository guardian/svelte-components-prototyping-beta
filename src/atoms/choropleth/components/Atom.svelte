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
    const url = `https://interactive.guim.co.uk/docsdata/oz-2025-sa2-fertility-map.json`;
    const json = await getJson(url);
    data = json?.sheets?.data ? json.sheets.data : [];
    console.log(data)
  })

</script>

<div class="atom">

  <Resizer atomName={`#${name}`}/>

  <Logger testing={false} />

  {#if data.length > 0}

    <Choropleth 
      {data}
      boundary={'sa2-21'}
      title={'Change in dwelling density by suburb'}
      subtitle={'Link to <a target="_blank" href="https://docs.google.com/spreadsheets/d/1eFx2S_gpFbC1GzncQgcutPWXbj2cZEgl_dnVPKblGyc/edit?gid=807652696#gid=807652696">boundaries googledoc</a>'}
      footnote={''}
      source={'Australian Bureau of Statistics'}
      displaySearch={true}
      mapping={[{
        "data": "TFR",
        "display": "Change in dwellings 2011-2021",
        "values": "0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4",
        "colours": "#ffffcc,#ffeda0,#fed976,#feb24c,#fd8d3c,#fc4e2a,#e31a1c,#bd0026,#800026",
        "tooltip": "{{SA2_NAME21}}: <b>{{TFR}}</b>",
        "overlay-tooltip": "",
        "scale": "threshold",
        "keyText": "Birthrates"
    }]}
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
