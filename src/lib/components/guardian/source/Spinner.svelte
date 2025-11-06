<script>
  import "@guardian/interactive-source-components/spinner.css";

  let { size = "medium", label = "Loading content" } = $props();
  /*

  Read more... https://github.com/guardian/interactive-source-components/blob/main/src/spinner/README.md
| Class                   | Description                                         | Default |
| ----------------------- | --------------------------------------------------- | ------- |
| `src-spinner--medium`   | A regular-size spinner (30px).                      | ✅      |
| `src-spinner--small`    | A smaller spinner (26px).                           |         |
| `src-spinner--xsmall`   | A very small spinner (20px).                       |         |
  */
</script>

<div
  class="src-spinner src-spinner--{size}"
  aria-label="{label}"
  role="status"
></div>