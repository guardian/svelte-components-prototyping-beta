<script>
  // Define component props with default values
  import { createEventDispatcher } from 'svelte';
  
    const dispatch = createEventDispatcher();

  export let border = true;
  export let onClick = () => {};
  export let styles = {
    button: "_button_1bibm_1",         // default class name for the button
    buttonBorder: "buttonBorderClass", // default class for the border style
    svg: "_svg_1bibm_22",               // default class for the SVG
    path: "_path_1bibm_29"              // default class for the SVG path
  };
</script>

<button 
  class={`${styles.button} ${border ? styles.buttonBorder : ""}`} 
  on:click={() => dispatch('close')}
>
  <svg
    class={styles.svg}
    viewBox="0 0 17 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      class={styles.path}
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M8.32497 10.025L15.5499 16.6499L16.6249 15.5749L10.025 8.32497L16.6249 1.075L15.5499 0L8.32497 6.62498L1.075 0.0249999L0 1.1L6.62498 8.32497L0 15.5499L1.075 16.6249L8.32497 10.025Z"
    />
  </svg>
</button>

<style lang="scss">
  /* Guardian close button styles adapted from component.scss */
  button {
    border: none;
    margin: 0;
    padding: 0;
    text-align: inherit;
    font: inherit;
    border-radius: 50%;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .buttonBorderClass {
    border: 1px solid var(--border-divider-color, #dcdcdc);
  }
  button:hover:enabled {
    background-color: var(--news-grey-05, #f6f6f6);
  }
  button:active {
    background-color: var(--highlight-color, #ffe500);
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  ._svg_1bibm_22 {
    width: 18px;
    height: 18px;
    display: block;
  }
  ._path_1bibm_29 {
    stroke: var(--primary-text-color, #121212);
    fill: var(--primary-text-color, #121212);;
    stroke-width: 1;
  }
</style>
