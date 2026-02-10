<script>
  import Carto from "./Carto.svelte"
  import Resizer from "$lib/components/guardian/Resizer.svelte"
  import { onMount } from "svelte"
  import {
    state,
    googleSheetData,
    setGoogleSheetKey,
    setGoogleSheetSheetName,
  } from "$lib/stores/googlesheet.svelte.js"

  onMount(async () => {
    setGoogleSheetSheetName("data")
    setGoogleSheetKey("1Vc3eExG-EbsSWgnpqxQ6x9BeKqpD2hqE7WYcs1kKoB8")
    await googleSheetData()
  })

  const defaultGeoJsonStyles = [
    {
      id: "geojson-outline",
      type: "line",
      source: "overlays",
      paint: {
        "line-color": "#1e88e5",
        "line-width": 2,
      },
    },
    {
      id: "geojson-fill",
      type: "fill",
      source: "overlays",
      paint: {
        "fill-color": "#1e88e5",
        "fill-opacity": 0.35,
      },
    },
  ]

  let { name, geoJsonURL = "", geoJsonStyles = defaultGeoJsonStyles } = $props()

  $inspect(state.mapdata)
</script>

<Resizer atomName="#{name}" />

{#if state.mapdata.length > 0}
  <Carto
    mapdata={state.mapdata}
    popupTemplate={"Location: <br/><strong>{Site_Name}</strong>"}
    {geoJsonStyles}
    MAP_INTERACTIVE={true}
    headline="Making a map to display data from a Google Sheet"
    subtitle={`Showing some cool stuff`}
    source="Guardian graphic. Source: <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a>, OpenStreetMap"
  />
{/if}

<style lang="scss">
</style>
