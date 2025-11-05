<!-- src/lib/components/SearchBox.svelte -->
<script>
  import { database } from  '$lib/stores/choro.svelte.js';

  let { mapContainer = null } = $props();

  /**
   * Filters items by a query string, matching the given key.
   * @param {string} query - The search string.
   * @param {Array} data - The dataset to search.
   * @param {string} key - The key to match in each object.
   * @returns {Array} Filtered array.
   */

   
  function autocomplete(query, data, DefaultKey = 'meta') {
    const q = query.toLowerCase();
    
    if (!q || q.length === 0) {
      return [];
    }

    const key = isNaN(q) ? 'place_name' : DefaultKey ;

    // Find items that start with the query (higher priority)
    const topSuggestions = data.filter(item => {
      const value = item[key] || '';
      return value.toLowerCase().startsWith(q);
    });

    // Find items that contain the query but don't start with it
    const otherSuggestions = data.filter(item => {
      const value = item[key] || '';
      const lowerValue = value.toLowerCase();
      // Skip if already in topSuggestions
      if (lowerValue.startsWith(q)) {
        return false;
      }
      return lowerValue.includes(q);
    });

    // Return top 10 suggestions with starting items first
    return [...topSuggestions, ...otherSuggestions].slice(0, 10);
  }

  function handleInput(e) {
    const query = e.target.value;
    database.searchBlock = query;
    database.displayOverlay = query.length > 2;
    database.autocompleteArray = query.length > 2 && database.codes ? autocomplete(query, database.codes, 'meta') : [];
  }

  function handleSelect(item) {
    // Clear the search input and dropdown
    database.searchBlock = '';
    database.autocompleteArray = [];
    database.displayOverlay = false;

    // Zoom to the selected location
    if (mapContainer) {
      // Try different possible field names for latitude and longitude
      const lat = item.lat || item.latitude || item.centreLat;
      const lng = item.lon || item.lng || item.longitude || item.centreLon;
      const postcode = item.postcode || item.postal_code || item.zip;
      
      if (lat && lng) {
        // Use postcode-based zoom if available, otherwise fall back to coordinate zoom
        if (postcode && mapContainer.zoomToPostcode) {
          mapContainer.zoomToPostcode(postcode, lat, lng);
        } else if (mapContainer.zoomToLocation) {
          mapContainer.zoomToLocation(lat, lng, 4);
        }
      }
    }
  }
</script>

<div class="search__container">
  <input
    class="search__input"
    type="text"
    placeholder="Enter a postcode"
    bind:value={database.searchBlock}
    oninput={handleInput}
    autocomplete="off"
  />
  {#if database.autocompleteArray.length > 0}
    <div class="search__dropdown">
      {#each database.autocompleteArray as item}
        <div class="search__item" role="button" tabindex="0" onclick={() => handleSelect(item)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(item); }}>
          {item.postcode} | {item.place_name}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>

  .search__container {
    position: relative;
    width: 100%;
    margin-bottom: 10px;
  }

  .search__input {
    width: 100%;
    padding: 0.5em;
    font-size: 1em;
  }
  .search__dropdown {
    background: white;
    border: 1px solid #ccc;
    margin-top: 0.2em;
    max-height: 200px;
    overflow-y: auto;
  }
  .search__item {
    padding: 0.5em;
    cursor: pointer;
  }
  .search__item:hover {
    background: #f0f0f0;
  }
</style>
