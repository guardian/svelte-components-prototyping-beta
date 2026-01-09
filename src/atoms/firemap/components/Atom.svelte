<script>
  import Firemap from "./Firemap.svelte"
  import Resizer from "$lib/components/guardian/Resizer.svelte"
  let { name } = $props()
  let timestamp = $state(null)
</script>

<Resizer atomName="#{name}" />

<Firemap
  fireURL="https://interactive.guim.co.uk/2026/01/aus-fire-map/VIC-warning.json"
  timestampURL="https://interactive.guim.co.uk/2026/01/aus-fire-map/vic-warning-timestamp.json"
  MAP_INTERACTIVE={true}
  center={[145.0083267775733, -37.914223334719765]}
  zoom={5.5}
  headline="Victorian bushfires"
  subtitle={`Showing bushfire warning areas. ${timestamp ? `Data last checked ${timestamp} (AEST). ` : ""}This map should not be relied on in an emergency, please check the <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a> for the latest information`}
  source="Guardian graphic. Source: <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a>, OpenStreetMap"
  on:timestamp={(e) => (timestamp = e.detail)}
/>

<style lang="scss">
</style>
