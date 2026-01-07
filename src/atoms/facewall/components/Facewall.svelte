<svelte:options runes={true} />
<script>
  import smoothscroll from "smoothscroll-polyfill"
  import { onMount, tick } from "svelte"
  import Panel from "./Panel.svelte"
  let { data = [], title = "name", image = "img", description = "description" } = $props()
  let panelOpen = $state(false)
  let panelData = $state({})
  let order = $state(0)
  let facewallWidth = $state(0)


  onMount(async () => {
    smoothscroll.polyfill()
  })

  $inspect(data.length)

  const updatePanel = (loc) => {
    panelOpen = false
  }

  async function openPanel(e, selectedIndex, listPosition) {
    panelOpen = false

    panelData = (data ?? []).find((d) => d.index == selectedIndex)

    //let multiplyer = (facewallWidth < 400) ? 1 :
    //(facewallWidth < 738) ? 3 : 4

    let multiplyer = facewallWidth < 738 ? 3 : 4

    let arr = (data ?? []).map((d, i) => i)

    // compute panel insertion using simple arithmetic, no helpers
    let totalItems = arr.length
    let lastMultiple = Math.floor((totalItems - 1) / multiplyer) * multiplyer

    if (listPosition < lastMultiple) {
      let nextBoundary =
        (Math.floor(listPosition / multiplyer) + 1) * multiplyer
      order = nextBoundary * 2 + 1
    } else {
      order = totalItems * 2 + 1
    }

    panelOpen = true
    await tick()
    const panelEl = document.querySelector(".facewall_panel")
    if (panelEl) {
      const elementTop =
        window.pageYOffset + panelEl.getBoundingClientRect().top
      window.scroll({
        top: elementTop,
        behavior: "smooth",
      })
    }
  }
</script>

<div class="facewall_container">
  {#if data && data.length}
    <div class="facewall_block_container" bind:clientWidth={facewallWidth}>
      <div class="facewall">
        <Panel {panelData} bind:panelOpen handleChange={updatePanel} {order} {title} {image} {description} />

        {#each data as result, i (result.index ?? i)}
          <div
            class="facewall_block facewall_quads"
            style="order: {result.order};"
            role="button"
            tabindex="0"
            onclick={(e) => openPanel(e, result.index, i)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                openPanel(e, result.index, i)
            }}
          >
            <div
              class="facewall_image"
              style:background-image={`url('${result[image] ?? result.hosted_image ?? result.img ?? ""}')`}
            ></div>

            <div class="facewall_title" style="background-color: {result.colour};">
              <div class="faces_and_heads" style="color: white;">
                {result[title]}
              </div>

              <!--span class="facewall_subtitle">{result.Subtitle}</span-->
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .facewall_container {
    width: 100%;
    margin: auto;
    box-sizing: border-box;
    overflow: hidden;
    display: inline-block;

    .facewall_block_container {
      width: 100%;
      display: inline-block;
      position: relative;

      .facewall {
        position: relative;
        width: 100%;
        display: inline-flex;
        flex-direction: row;
        flex-wrap: wrap;
        padding-left: 5px;

        .facewall_block {
          height: 0px;
          float: left;
          cursor: pointer;
          position: relative;
        }

        .facewall_title {
          width: 100%;
          box-sizing: border-box;
          padding: 10px;
          float: left;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1;
          min-height: 80px;
        }

        .facewall_title .faces_and_heads {
          font-weight: 600;
          -webkit-font-smoothing: antialiased;
          color: #121212;
          font-family: "Guardian Titlepiece", "GH Guardian Headline",
            "Guardian Text Egyptian Web", Georgia, serif;
          margin: 0;
          padding: 0;

          padding-right: 10px;
          overflow: hidden;
          text-overflow: ellipsis;

          @include mq($until: slim) {
            font-size: 12px;
            line-height: 120%;
          }

          @include mq($from: slim, $until: artie) {
            font-size: 14px;
            line-height: 120%;
          }

          @include mq($from: artie, $until: tablet) {
            font-size: 16px;
            line-height: 1.1em;
          }

          @include mq($from: tablet, $until: desktop) {
            font-size: 16px;
            line-height: 1.1em;
          }

          @include mq($from: desktop) {
            font-size: 16px;
            line-height: 1.1em;
          }
        }

        .facewall_image {
          width: calc(100%);
          margin: 0px;
          height: 0px;
          padding-bottom: calc(100%);
          background-size: cover;
          background-color: red;
        }

        .facewall_quads {
          margin-bottom: 10px;
          /*
                    @include mq($until: slim) {
                        width: 100%;
                        margin-right: 3px;
                        padding-bottom: calc(100% + 40px);
                    }
                
                    @include mq($from: slim, $until: artie) {
                        width: calc(50% - 10px);
                        margin-right: 10px;
                        padding-bottom: calc(50% + 40px);
                    }
                        */

          @include mq($until: tablet) {
            width: calc(33.3% - 10px);
            margin-right: 10px;
            padding-bottom: calc(33.3% + 40px);
          }

          @include mq($from: tablet, $until: desktop) {
            width: calc(25% - 10px);
            margin-right: 10px;
            padding-bottom: calc(25% + 40px);
          }

          @include mq($from: desktop) {
            width: calc(25% - 10px);
            margin-right: 10px;
            padding-bottom: calc(25% + 40px);
          }
        }
      }
    }
  }
</style>
