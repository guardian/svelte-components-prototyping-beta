
<script>
    // Component props using $props()
    let { 
        label = "Read more",
        colour = "#ffe500",
        background = "#121212",
        onClick = () => {}
    } = $props();

    // Reactive state using $state()
    let width = $state(0);

    // Effect to handle width changes
    $effect(() => {
        // Any side effects based on width changes can go here
        console.debug('Button width updated:', width);
    });
</script>
  
<button class="guardian-button button-sm" on:click={onClick} style="background-color: {background}; width: {width + 15}px;">
    <div class="_button_wrap" bind:clientWidth={width}>
        <div class="label" style="color:{colour}">{label}</div>
        <div class="icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="{colour}" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M.033 10.823h16.575l-6.5 7.779.845.845 9.035-9.057v-.867L10.953.467l-.845.845 6.5 7.778H.033v1.733z" fill={colour} />
        </svg>
        </div>
    </div>
</button>
  
<style lang="scss">
    /* Guardian button styles adapted from component.scss */
    button {
        background-color: transparent;
        border: none;
        margin: 0;
        padding: 0;
        text-align: inherit;
        font: inherit;
        border-radius: 0;
        box-sizing: border-box;
    }
    .guardian-button {
        padding: 0 5px;
        border: none;
        border-radius: 36px;
        margin-top: 12px;
        height: 36px;
        cursor: pointer;
        transition: background 0.2s;

        div {
            float: left;
        }

        ._button_wrap {
            display: flex;
            align-items: center;
            height: 100%;
            padding: 0 5px;
        }
        
        .label {
            display: flex;
            vertical-align: middle;
            font-family: var(--text-sans);
            font-size: var(--sans-small);
            line-height: var(--sans-line-height);
            font-weight: 700;
            padding: 0 4px;
            color: var(--primary-button-text-color, #fff);
        }
        
        .icon {
            display: flex;
        }
        
        &.button-md {
            height: 44px;
            padding: 0 12px;
        }
        &:hover:enabled {
            background-color: var(--primary-button-highlight-color, #333);
        }
        &:active {
            background-color: var(--highlight-color, #ffe500);
        }
        &:disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
</style>
  