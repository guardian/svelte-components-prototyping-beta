<script>
  import Carto from "./Carto.svelte"
  import Resizer from "$lib/components/guardian/Resizer.svelte"
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
</script>

<Resizer atomName="#{name}" />

<Carto
  geoJsonURL={geoJsonURL}
  geoJsonStyles={geoJsonStyles}
  MAP_INTERACTIVE={true}
  center={[145.0083267775733, -37.914223334719765]}
  zoom={5.5}
  headline="Making a generic map component"
  subtitle={`Showing some cool stuff`}
  source="Guardian graphic. Source: <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a>, OpenStreetMap"
/>

<style lang="scss">
</style>
