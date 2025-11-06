<script>
  import "@guardian/interactive-source-components/button.css"
  import Icons from "$lib/components/source/Icons.svelte"

  let { label = "Click me", icon = "", variant = "default", iconSize = "medium" } = $props();

  let hasIcon = $derived(icon != "" ? true : false);

  /*

  Read more... https://github.com/guardian/interactive-source-components/blob/main/src/button/README.md?plain=1

| Class                   | Description                                         | Default |
| ----------------------- | --------------------------------------------------- | ------- |
| `src-button--default`   | Dark background, light text.                        | ✅      |
| `src-button--secondary` | Pale background, dark text.                         |         |
| `src-button--tertiary`  | Transparent background, dark border and text.       |         |
| `src-button--subdued`   | Transparent background, no border, underlined text. |         |
| `src-button--medium`    | Smaller than normal.                                | ✅      |
| `src-button--small`     | Smaller than normal.                                |         |
| `src-button--xsmall`    | Extra-smaller than normal.                          |         |

  */

</script>

<button class="src-button src-button--{variant}">
  {#if hasIcon}
    <Icons icon="{icon}" size="{iconSize}" />
  {/if}
  {label}
</button>