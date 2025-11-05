<script>
  import { onMount } from 'svelte';
  import SearchIcon from '$lib/components/guardian/SearchIcon.svelte';
  import CloseButton from '$lib/components/guardian/CloseButton.svelte';

  // Props (with defaults where applicable)
  export let placeholder = "";
  export let inputValue = "";
  export let maxSuggestions = 5;
  export let onInputChange = async (val) => [];
  // Note: onSubmit now expects to receive either a suggestion object (if available)
  // or false if there are no matching items.
  export let onSubmit = (val) => {};
  export let onSelect = (suggestion) => {};
  export let onClear = () => {};
  export let onFocus = () => {};

  // Local state
  let value = inputValue;
  let selectedIndex = -1;
  let suggestions = [];
  let showSuggestions = true;
  let inputRef;

  async function inputChanged(newValue) {
    value = newValue;
    let sugg = await onInputChange(newValue);
    suggestions = sugg ? sugg.slice(0, maxSuggestions) : [];
    selectedIndex = -1;
    if (newValue.trim() !== "") {
      showSuggestions = true;
    }
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      // Update onSubmit behavior:
      // If any suggestions exist, return the first item in the array,
      // otherwise, return false.
      if (suggestions.length > 0) {
        onSubmit(suggestions[selectedIndex] || suggestions[0]);
        handleClear();
      } else {
        onSubmit(false);
        handleClear();
      }
    }
  }

  function onSelectSuggestion(suggestion) {
    onSelect(suggestion);
    value = suggestion.text;
    inputRef.blur();
  }

  function handleClear() {
    console.log("Clearing search input");
    showSuggestions = false;
    value = "";

    inputChanged("");
    inputRef.focus();
    onClear();
  }

  function handleBlur() {
    showSuggestions = false;
  }

  function handleFocus(event) {
    event.target.select();
    showSuggestions = true;
  }

  // Compute whether to show the clear button
  $: showClearButton = value && value !== "";
</script>

<div class="search-container">
  <input
    name="search"
    placeholder={placeholder}
    bind:this={inputRef}
    type="text"
    aria-label="Search input"
    bind:value
    on:keydown={handleKeyDown}
    on:input={(e) => inputChanged(e.target.value)}
    on:blur={handleBlur}
    on:focus={handleFocus}
    class="search-input"
  />
  <div class="search-icon">
    <SearchIcon />
  </div>
  {#if showClearButton}
    <div class="clear-button">
      <CloseButton border={false} on:close={handleClear} />
    </div>
  {/if}
  {#if showSuggestions && suggestions.length}
    <ul class="suggestions" aria-label="Search suggestions">
      {#each suggestions as suggestion, index}
        <li
          aria-label={suggestion.text}
          class="suggestion {index === selectedIndex ? 'selected' : ''}"
          on:mousedown|preventDefault
          on:mouseover={() => { selectedIndex = index; }}
          on:click={() => onSelectSuggestion(suggestion)}
        >
          {#each suggestion.text.split(new RegExp(`(${value})`, "ig")) as part, i}
            {#if i % 2 === 1}
              <span class="highlighted">{part}</span>
            {:else}
              {part}
            {/if}
          {/each}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
:global(:root), :root {
  --primary-bg-color: #fff;
  --primary-text-color: #121212;
  --secondary-bg-color: #f3f3f3;
  --secondary-text-color: #707070;
  --highlight-color: #ffe500;
  --highlighted-text-color: #121212;
  --border-divider-color: #dcdcdc;
  --sans-medium: 17px;
  --sans-small: 15px;
  --text-sans: 'GuardianTextSans', 'Helvetica Neue', Arial, sans-serif;
  --space-2: 8px;
  --space-9: 36px;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  color: var(--primary-text-color);
  font-family: var(--text-sans);
  font-size: var(--sans-medium);
  line-height: 1.3;
  background-color: var(--primary-bg-color);
  padding: var(--space-2) var(--space-9);
  border: 1px solid var(--border-divider-color);
  border-radius: 999px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
}

.search-input:focus {
  border: 1px solid var(--primary-text-color);
}

.search-icon {
  position: absolute;
  top: 11px;
  left: 12px;
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.clear-button {
  position: absolute;
  top: 2px;
  right: 4px;
}

.suggestions {
  position: absolute;
  width: 100%;
  margin-top: var(--space-2);
  z-index: 100;
  background-color: var(--primary-bg-color);
  border: 1px solid var(--border-divider-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: clip;
  pointer-events: all;
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion {
  cursor: pointer;
  padding: 6px 8px;
  background-color: var(--primary-bg-color);
  color: var(--primary-text-color);
  font-family: var(--text-sans);
  font-size: var(--sans-small);
  line-height: 1.3;
}

.suggestion.selected {
  background-color: var(--secondary-bg-color);
}

.highlighted {
  color: var(--highlighted-text-color);
  background-color: var(--highlight-color);
}
</style>
