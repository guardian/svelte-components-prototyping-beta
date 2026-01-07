<svelte:options runes={true} />

<script>
  import { onMount } from "svelte"
  import { getJson, hexToRgb } from "$lib/helpers/guardian/toolbelt.js"
  import Facewall from "./Facewall.svelte"

  let data = $state([])
  let loading = $state(true)
  let error = $state(null)
  let defaultColour = $state("#5e85b1")

  onMount(async () => {
    try {
      let googledoc = await getJson(
        `https://interactive.guim.co.uk/docsdata/1cTUVDplk0OOG6y875jhKgTDalvPYaOEokOBkPFb5Zs4.json`,
      )
      let json = googledoc?.sheets?.Sheet1 ?? []

      json.forEach((row, index) => {
        row.colour = row.colour || defaultColour
        row.rgb = hexToRgb(row.colour)
        row.index = index
        row.order = (index + 1) * 2
      })

      data = [...json]
    } catch (e) {
      error = "Failed to load data"
      console.error(e)
    } finally {
      loading = false
    }
  })
</script>

<div class="atom">
  <div class="facewall-wrapper">
    <div class="facewallTitle">
      Caught in the spiral: children with FASD in the justice system
    </div>

    <div class="facewallSubTitle">
      Click on the box to reveal each child’s story, taken from court
      transcripts. All names are pseudonyms.
    </div>
  </div>

  {#if data && data.length && !loading}
    <Facewall {data} title="name" image="img" description="description" />
  {/if}
</div>

<style lang="scss">
  .atom {
    width: 100%;
    background-color: white;
  }

  .facewall-wrapper {
    width: 100%;
    box-sizing: border-box;
    border-top: 1px solid lightgrey;
    background-color: white;
    padding: 5px;
  }

  .facewallTitle {
    font-size: 20px;
    line-height: 28px;
    font-weight: 600;
    -webkit-font-smoothing: antialiased;
    color: #333;
    font-family: "Guardian Headline Full", Georgia, serif;
  }

  .facewallSubTitle {
    font-size: 17px;
    line-height: 20px;
    color: #333;
    font-family:'Guardian Text Sans Web', 'Agate Sans', sans-serif;
  }


</style>
