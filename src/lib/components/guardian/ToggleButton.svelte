
<script>
    import { createEventDispatcher } from 'svelte';

    let { 
        label = "Toggle button",
        radius = 50,
        iconOn = "unmuted.svg",
        iconOff = "muted.svg",
        background = "transparent",   // button background behind the icon
        iconColor = "#c70000",          // Icon colour
        value = false,               // external value (can be controlled by parent)
        onChange = undefined         // optional callback from parent
    } = $props();

    const dispatch = createEventDispatcher();

    // Internal toggle state mirrors external value
    let toggle = $state(value);

    // Keep internal state in sync if parent changes `value`
    $effect(() => {
        toggle = value;
    });

    function handleClick() {
        toggle = !toggle;
        // reflect back to parent consumables
        value = toggle;
        if (typeof onChange === 'function') onChange(toggle);
        dispatch('change', { value: toggle });
    }

    // Build dynamic style for either masked (tinted) or image background
    let styleAttr = $derived(iconColor 
        ? `background-color: ${iconColor}; width: ${radius}px; height: ${radius}px; -webkit-mask-image: url(__assetsPath__/icons/${toggle ? iconOn : iconOff}); mask-image: url(__assetsPath__/icons/${toggle ? iconOn : iconOff}); -webkit-mask-position: center; mask-position: center; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-size: 80%; mask-size: 80%;`
        : `background-image: url(__assetsPath__/icons/${toggle ? iconOn : iconOff}); background-color: ${background}; width: ${radius}px; height: ${radius}px;`);
</script>
  
<button type="button" class="toggleSwitch" 
    aria-pressed={toggle}
    aria-label={label}
    onclick={handleClick} 
    style={styleAttr}
></button>
  
<style lang="scss">

    .toggleSwitch {
        cursor: pointer;
        background-position: center;
        background-size: 80%;
        background-repeat: no-repeat;
        border-radius: 50%;
    }
</style>
  