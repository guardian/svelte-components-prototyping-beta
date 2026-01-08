<script>
  import Firemap from './Firemap.svelte';
  import Resizer from '$lib/components/guardian/Resizer.svelte';
  let { name } = $props();
  let timestamp = $state(null);

</script>

<Resizer atomName="#{name}" />

<Firemap 
  data="WA-warning"
  MAP_INTERACTIVE={true} 
  center={[116.03196265904751, -31.90047341428921]} 
  headline="Perth bushfires"
  subtitle={`Showing bushfire warning areas. ${timestamp ? `Data last checked ${timestamp} (AEST). ` : ''}This map should not be relied on in an emergency, please check the <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a> for the latest information`}
  source="Guardian graphic. Source: <a href='https://www.emergency.wa.gov.au/' target='_blank'>EmergencyWA website</a>, OpenStreetMap"
  on:timestamp={(e) => (timestamp = e.detail)}
/>

<style lang="scss">


</style>
