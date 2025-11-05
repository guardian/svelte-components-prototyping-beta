<!-- src/lib/components/DropdownSelect.svelte -->
<script>
  import { database } from '$lib/stores/choro.svelte.js';
  
  let { 
    selectedIndex, 
    options = [], 
    label = '', 
    changeType = '', 
    mapContainer = '' 
  } = $props();

  function handleChange(event) {
    selectedIndex = +event.target.value;
    let target = options[selectedIndex];
    if (changeType === 'changeData') {
      database.currentIndex = selectedIndex;
      database.currentKey = target.data || null;
    } else if (changeType === 'changeLocation') {
      mapContainer.zoomToLocation(+target.centreLat, +target.centreLon, +target.zoomScale);
    }
  }
</script>

<div class="dropdown">
  <label>{label}</label>
  <select onchange={handleChange} bind:value={selectedIndex}>
    {#each options as opt, i}
      <option value={i}>{opt.display}</option>
    {/each}
  </select>
</div>

<style>
  .dropdown {
    margin-bottom: 5px;
    width: 100%;
  }
  
  label {
    font-family: 'Guardian Text Sans Web', Arial, sans-serif;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 10px;
    color: #333;
  }
  
  select {
    padding: 0.4em;
    margin-top: 5px;
    width: 100%;
  }
</style>
