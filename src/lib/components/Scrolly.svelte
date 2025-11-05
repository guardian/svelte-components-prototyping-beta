<script>
  import Scroller from "@sveltejs/svelte-scroller"

  let top = $state(0)
  let bottom = $state(1)
  let threshold = $state(0.5)
  let count = $state(0)
  let index = $state(0)
  let offset = $state(0)
  let progress = $state(0)

  let colors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "orange",
    "pink",
    "brown",
    "gray",
  ]
</script>

<div class="scrolly">
  <Scroller
    {top}
    {threshold}
    {bottom}
    bind:count
    bind:index
    bind:offset
    bind:progress
  >
    {#snippet background()}
      <div
        class="background"
        style="background-color: {colors[index]}; height: 75vh"
      ></div>
    {/snippet}
    {#snippet foreground()}
      {#each Array.from({ length: 5 }) as _, i}
        <section style="height: 50vh">
          <h2>Slide {i}</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </section>
      {/each}
    {/snippet}
  </Scroller>
</div>

<style lang="scss">
  h2 {
    @include f-headline();
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
  }
</style>
