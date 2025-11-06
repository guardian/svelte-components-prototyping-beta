<script>
  import "@guardian/interactive-source-components/button.css"
  import "@guardian/interactive-source-components/icons.css"

  let { label = "Click me", icon = "add-to-basket", variant = "default" } = $props();

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
  <div class="src-icon--{icon}"></div>
  {label}
</button>