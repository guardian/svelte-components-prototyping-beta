<script>
  import { onMount } from "svelte"
  import Button from "$lib/components/source/Button.svelte"
  import Icons from "$lib/components/source/Icons.svelte"
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

  <h2 class="src-article-15">Guardian source components</h2>

  <Button icon="all-recipes" />
  <Icons icon="add-to-basket" size="medium" />
  <!--
  {#if exampledata.animals}
    {#each exampledata.animals as animal}
      <p>The {animal.animal} is {animal.size} and has {animal.legCount} legs.</p>
    {/each}
  {/if}
  -->

  
  <!-- <Scrolly></Scrolly> -->
</div>

<style lang="scss">
  @include mq($until: tablet) {
    h2 {
      margin-bottom: 30px;
    }
  }
</style>
