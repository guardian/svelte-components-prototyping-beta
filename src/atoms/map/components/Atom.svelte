<script>
  import Carto from "./Carto.svelte"
  // import Resizer from "$lib/components/guardian/Resizer.svelte"
  import { categoricalLight, categoricalDark } from '$lib/helpers/guardian/colours';
  
  let { name } = $props()
  let width = $state(620);
  let height = $state(500);

  let mapSettings = $state({
      interactive: true,
      zoom: 10.662479015301319,
      viewBounds: [[32.95923516781116, 31.088211024074994], [38.09685872086678, 34.568786230741196]],
      center: [-3.7928114885858975, 53.30419012576044],
      showCounties: false,
      showCityLabels: true,
      showCapitalLabels: true,
      showTownAndLocalityLabels: true,
      showCountryLabels: true,
      showMiniMap: true,
      highlightCountry: "Lebanon"
    })
  
</script>



<!-- <Resizer atomName="#{name}" /> -->

<div class="atom vis-chart" bind:clientWidth={width}>

  <div id="graphicContainer">

    <div class="vis-chart-headline">Your headline here</div>
    
    <!-- <div class="vis-chart-standfirst">Showing air, missile and drone strikes</div>	 -->
    
    <div class="vis-chart-legend-list" id="chartKey">

      <div class="keyDiv"><span class="keyCircle" style="background-color:{categoricalLight[0]};"></span><span class="keyText">Thing 1</span></div>
      <div class="keyDiv"><span class="keyCircle" style="background-color:{categoricalLight[1]};"></span><span class="keyText">Thing 2</span></div>

    </div>

    <Carto {width} {height} {mapSettings} />  

    <div class="vis-chart-source">Guardian graphic. Source: <a href="https://acleddata.com/" target="_blank">ACLED</a>, OpenStreetMap. Note: strikes are ongoing, not an exhaustive list of targets</div>	
  
  </div>

</div>

<style lang="scss">

  .atom {
    width:100%;
    position: relative;
  }
</style>
