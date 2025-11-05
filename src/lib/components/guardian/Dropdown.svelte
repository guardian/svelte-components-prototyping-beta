<script>
  import { createEventDispatcher } from "svelte";

  // Component props using $props()
  let { 
    dropdowns = [],
    currentSelection = null,
    label = "Select an option"
  } = $props();

  // Create event dispatcher
  const dispatch = createEventDispatcher();

  // Reactive state using $state()
  let selectedValue = $state(currentSelection);

  // Computed value for the selected label
  let selectedLabel = $derived(
    selectedValue 
      ? dropdowns.find(item => item.value === selectedValue)?.label 
      : null
  );

  // Effect to handle selection changes
  $effect(() => {
    if (selectedValue) {
      dispatch("updateDropdown", {
        value: selectedValue,
        label: selectedLabel
      });
    }
  });

  // Handle dropdown change
  function handleChange(event) {
    selectedValue = event.target.value;
  }
</script>

<div class="filters">
  <div class="filter">
    <div class="filter-label">
      {selectedLabel ? `${label} :` : ""} {selectedLabel || "Select an option"}
    </div>
    <select 
      value={selectedValue} 
      on:change={handleChange}
      aria-label={label}
    >
      {#each dropdowns as dropdown}
        <option value={dropdown.value}>{dropdown.label}</option>
      {/each}
    </select>
  </div>
</div>
                
<style lang="scss">
  .filters {
    width: 100%;
    max-width: 360px;
    display: inline-block;
    line-height: 30px;
    height: 40px;
    color: black;
    font-size: 16px;
    cursor: pointer;

    .filter {
      line-height: 30px;
      height: 40px;
      z-index: 10;
      font-family: 'Guardian Text Sans Web', 'Agate Sans', sans-serif;
      position: relative;
      margin: 0px;
      padding-left: 0px;
      box-sizing: border-box;
      border: 1px solid lightgrey;
      color: black;
      padding: 5px;

      select {
        z-index: 90;
        opacity: 0;
        width: 100%;
        line-height: 30px;
        height: 40px;
        -webkit-appearance: menulist-button;
        position: absolute;
        top: 0;
        display: block;
        left: 0;
        color: #333;
        cursor: pointer;

        option {
          font-size: 18px;
        }
      }
    }

    .filter-label {
      width: 100%;
      padding-right: 30px;

      .current_selection {
        font-weight: bold;
      }

      .selection-name {
        color: black;
        font-weight: bold;
      }
    }

    .filter-label:after {
      display: block;
      position: absolute;
      right: 5px;
      top: 10px;
      width: 24px;
      height: 20px;
      padding-left: 10px;
      content: "";
      background: url(https://interactive.guim.co.uk/embed/aus/2022/11/australian-event-guide/arrow-down.svg) no-repeat center;
    }
  }
</style>