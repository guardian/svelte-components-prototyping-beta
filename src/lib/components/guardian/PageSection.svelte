<script>

    let { 
      id = "",
      layout = "default",
      borderTop = false,
      backgroundColor = "transparent",
      styles = {
        section: "_section_1xpz0_39",
        borderTop: "_borderTop_1xpz0_9", 
        header: "_header_1xpz0_150",
        content: "_content_1xpz0_187",
        default: "",
        fullWidth: "_fullWidth_1xpz0_39"
      }
    } = $props();
  
    let headerEl;
    let minHeight = $state("auto");
  
    function measureHeader() {
      if (headerEl) {
        minHeight = headerEl.offsetHeight + "px";
      }
    }
  
    $effect(() => {
      measureHeader();
    });
</script>
  
<section
    {id}
    class="{styles.section} {styles[layout]}"
    style="background-color: {backgroundColor}; min-height: {minHeight};"
>
    {#if borderTop}
      <div class={styles.borderTop}></div>
    {/if}
  
    <!-- Header slot -->
    <div class="{styles.header} {styles[layout]}" bind:this={headerEl}>
      <slot name="header" />
    </div>
  
    <!-- Content slot -->
    <div class="{styles.content} {styles[layout]}">
      <slot name="content" />
    </div>
</section>
  
<style lang="scss">
  /* Guardian section, header, border, and content styles adapted from component.scss */
  ._section_1xpz0_39 {
    position: relative;
    z-index: 0;
    padding-bottom: var(--space-8);
    background-color: var(--primary-bg-color);
  }
  ._section_1xpz0_39._fullWidth_1xpz0_39 {
    transform: translate(-10px);
    width: calc(100% + 20px);
    margin: 0;
    padding: 0;
  }
  @media (min-width: 30em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39 {
      transform: translate(-20px);
      width: calc(100% + 40px);
    }
  }
  @media (min-width: 46.25em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39 {
      transform: translate(-20px);
      width: calc(100% + 40px);
    }
  }
  @media (min-width: 71.25em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39 {
      transform: translate(-180px);
      width: calc(100% + 197px);
    }
  }
  @media (min-width: 81.25em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39 {
      transform: translate(-260px);
      width: calc(100% + 280px);
    }
  }
  ._section_1xpz0_39::before {
    display: block;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(-10px);
    width: calc(100% + 20px);
    height: 100%;
    z-index: -1;
    background-color: var(--primary-bg-color);
  }
  @media (min-width: 30em) {
    ._section_1xpz0_39::before {
      transform: translate(-20px);
      width: calc(100% + 40px);
      background-color: var(--primary-bg-color);
    }
  }
  @media (min-width: 46.25em) {
    ._section_1xpz0_39::before {
      width: calc(100% + 40px);
      background-color: var(--primary-bg-color);
    }
  }
  @media (min-width: 71.25em) {
    ._section_1xpz0_39::before {
      transform: translateX(-9px);
      width: calc(100% + 26px);
      background-color: var(--primary-bg-color);
    }
  }
  @media (min-width: 81.25em) {
    ._section_1xpz0_39::before {
      width: calc(100% + 27px);
      background-color: var(--primary-bg-color);
    }
  }
  ._section_1xpz0_39._fullWidth_1xpz0_39::before {
    transform: none;
    width: calc(100% - 3px);
    height: 100%;
    left: 1px;
    background-color: var(--primary-bg-color);
    transform: translate(-10px);
    width: calc(100% + 20px);
  }
  @media (min-width: 30em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39::before {
      transform: translate(-20px);
      width: calc(100% + 40px);
    }
  }
  @media (min-width: 46.25em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39::before {
      width: 100%;
      transform: translateX(-1px);
    }
  }
  @media (min-width: 71.25em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39::before {
      transform: translateX(-1px);
      width: 100%;
    }
  }
  @media (min-width: 81.25em) {
    ._section_1xpz0_39._fullWidth_1xpz0_39::before {
      transform: none;
      width: calc(100% - 3px);
    }
  }
  ._borderTop_1xpz0_9 {
    border-top: 1px solid var(--border-divider-color, #dcdcdc);
    transform: translate(-10px);
    width: calc(100% + 20px);
  }
  @media (min-width: 30em) {
    ._borderTop_1xpz0_9 {
      transform: translate(-20px);
      width: calc(100% + 40px);
    }
  }
  @media (min-width: 46.25em) {
    ._borderTop_1xpz0_9 {
      width: calc(100% + 40px);
    }
  }
  @media (min-width: 71.25em) {
    ._borderTop_1xpz0_9 {
      transform: translate(-180px);
      width: calc(100% + 197px);
      background-color: transparent;
    }
  }
  @media (min-width: 81.25em) {
    ._borderTop_1xpz0_9 {
      transform: translate(-260px);
      width: calc(100% + 279px);
    }
  }
  ._section_1xpz0_39._fullWidth_1xpz0_39 ._borderTop_1xpz0_9 {
    transform: none;
    width: calc(100% - 1px);
  }
  ._header_1xpz0_150 {
    color: var(--primary-text-color, #121212);
    padding-top: var(--space-2);
    margin-bottom: var(--space-5);
  }
  @media (min-width: 71.25em) {
    body:not(.ios, .android) ._header_1xpz0_150 {
      position: absolute;
      max-width: 160px;
      transform: translateX(-170px);
      margin-bottom: 0;
    }
  }
  @media (min-width: 81.25em) {
    body:not(.ios, .android) ._header_1xpz0_150 {
      max-width: 220px;
      transform: translateX(-250px);
    }
  }
  ._header_1xpz0_150._fullWidth_1xpz0_39 {
    margin-bottom: 0px;
  }
  ._content_1xpz0_187 {
    position: relative;
    padding-top: 0;
    z-index: 0;
    color: var(--primary-text-color, #121212);
  }
  @media (min-width: 71.25em) {
    ._content_1xpz0_187 {
      padding-top: var(--space-2);
    }
  }
  ._content_1xpz0_187._fullWidth_1xpz0_39 {
    padding-top: 0;
  }
  ._content_1xpz0_187._fullWidth_1xpz0_39::before {
    display: none;
  }
</style>
  