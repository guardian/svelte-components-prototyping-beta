<script>
  import { onMount } from "svelte"

  // import {getExampleData, exampledata} from '$lib/stores/example.svelte.js';
  // import Scrolly from '$lib/components/Scrolly.svelte'

  onMount(async () => {
    // await getExampleData()
    // setInterval(async () => {
    //   await getExampleData()
    // }, 60000)
  })

  let { name } = $props()
</script>

<div class="atom">
  <!--
  {#if exampledata.animals}
    {#each exampledata.animals as animal}
      <p>The {animal.animal} is {animal.size} and has {animal.legCount} legs.</p>
    {/each}
  {/if}
  -->

  <h2 class="src-article-15">Hello {name}</h2>
  <!-- <Scrolly></Scrolly> -->
</div>

<style lang="scss">
  @include mq($until: tablet) {
    h2 {
      margin-bottom: 30px;
    }
  }
</style>
