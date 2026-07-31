<script>
  import Carto from "./Carto.svelte"
  // import Resizer from "$lib/components/guardian/Resizer.svelte"
  import { categoricalLight } from '$lib/helpers/guardian/colours';
  
  let width = $state(620);

  let mapSettings = $state({
      interactive: true,
      style: /** @type {'graphics'} */ ('graphics'),
      viewport: {
        bounds: /** @type {[[number, number], [number, number]]} */ ([[112, -44.5], [154.5, -10]])
      },
      showMiniMap: true
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

    <Carto {width} {mapSettings} />  

    <div class="vis-chart-source">Guardian graphic.</div>	
  
  </div>

</div>

<style lang="scss">

  .atom {
    width:100%;
    position: relative;
  }
</style>
