<script>
  // Props for configurable behavior
  export let progress = 0;
  export let height = 4;
  export let backgroundColor = '#000000';
  export let progressColor = '#c70000';
  export let showProgress = true;
  export let animated = true;
  export let zIndex = 9999;
  
  // Ensure progress is within valid range
  $: clampedProgress = Math.max(0, Math.min(100, progress));
</script>

{#if showProgress}
  <div 
    class="progress-container"
    role="progressbar"
    aria-valuenow={clampedProgress}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Page progress"
    style="
      --progress-height: {height}px;
      --progress-bg-color: {backgroundColor};
      --progress-fill-color: {progressColor};
      --progress-z-index: {zIndex};
    "
  >
    <div 
      class="progress-bar"
      class:animated={animated}
      style="width: {clampedProgress}%;"
    ></div>
  </div>
{/if}

<style lang="scss">
  .progress-container {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--progress-height);
    background-color: var(--progress-bg-color);
    z-index: var(--progress-z-index);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background-color: var(--progress-fill-color);
    transition: width 0.3s ease-out;
    
    &.animated {
      transition: width 0.3s ease-out;
    }
    
    &:not(.animated) {
      transition: none;
    }
  }
</style>