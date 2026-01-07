<svelte:options runes={true} />
<script>
  let {
    panelData = {},
    image = "hosted_image",
    title = "name",
    subtitle = null,
    description = "description",
    order = 0,
    panelOpen = $bindable(false),
    handleChange = (json) => json
  } = $props()

</script>

{#if panelOpen}
  <div class="facewall_panel" style="order: {order}">
    <div class="facewall_panel_closure">
      <button
        class="facewall_panel_close"
        style="background-color: rgba({panelData.rgb.r}, {panelData.rgb.g}, {panelData.rgb.b}, 1);"
        type="button"
        aria-label="Close panel"
        onclick={handleChange}
      >
      X
      </button>
    </div>

    <div id="facewall_panel">
      <div class="facewall_panel_container">
        <div class="facewall_panel_editorial">
          <h2>
            {panelData[title]}<br />
            {#if subtitle && panelData && panelData[subtitle]}
            <span style="color:{panelData.colour};">{panelData[subtitle]}</span>
            {/if}
          </h2>

          <div class="description_text">
            <p>{@html panelData[description]}</p>
          </div>
        </div>

        <div class="facewall_panel_image">
          <img src={panelData[image] ?? panelData.hosted_image ?? panelData.img} alt={panelData[title] || ''} />
        </div>

        <!--div class="facewall_image_caption">{caption}</div-->
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .facewall_panel {
    width: 100%;
    background: #e9ebef;
    padding: 30px;
    margin-bottom: 10px;

    @include mq($until: mobile) {
      margin-right: 5px;
    }

    @include mq($from: mobile) {
      margin-right: 10px;
      min-height: 370px;
    }
  }

  .facewall_panel_container {
    width: 100%;
    display: inline-block;
  }

  .facewall_panel_image img {
    float: right;
    width: 100%;
    height: 0px;
    padding-bottom: 100%;

    @include mq($from: tablet) {
      max-width: 250px;
      padding-bottom: 250px;
    }

    height: auto;
  }

  .facewall_panel_editorial {
    float: left;

    h2 {
      font-family:
        GH Guardian Headline,
        Guardian Egyptian Web,
        Georgia,
        serif;
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 24px;
    }
  }

  .facewall_panel_closure {
    width: 100%;
    height: 40px;
    margin-bottom: 20px;
  }

  .facewall_panel_close {
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    float: right;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .facewall_panel_close svg {
    display: block;
    fill: white;
    -ms-transform: rotate(-45deg); /* IE 9 */
    -webkit-transform: rotate(-45deg); /* Safari */
    transform: rotate(-45deg);
  }

  .facewall_panel_editorial {

    @include mq($until: mobile) {
      width: 100%;
    }

    @include mq($from: mobile, $until: mobileLandscape) {
      width: 100%;
    }

    @include mq($from: mobileLandscape, $until: tablet) {
      width: calc(60% - 20px);
    }

    @include mq($from: tablet, $until: desktop) {
      width: calc(60% - 20px);
    }

    @include mq($from: desktop) {
      width: calc(60% - 20px);
    }
  }

  .facewall_panel_image {
    float: right;
    max-height: 250px;
    overflow: hidden;

    @include mq($until: mobile) {
      width: 100%;
      margin-top: 10px;
    }

    @include mq($from: mobile, $until: mobileLandscape) {
      width: 100%;
      margin-top: 10px;
    }

    @include mq($from: mobileLandscape, $until: tablet) {
      width: 40%;
      height: 0px;
      padding-bottom: 24%;
    }

    @include mq($from: tablet, $until: desktop) {
      width: 40%;
      height: 0px;
      padding-bottom: 24%;
    }

    @include mq($from: desktop) {
      width: 40%;
      height: 0px;
      padding-bottom: 24%;
    }
  }

</style>
