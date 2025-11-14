

// =============================================================================
// NETWORK & DATA UTILITIES
// =============================================================================

/**
 * Fetches JSON data from a URL with error handling
 * @param {string} url - The URL to fetch JSON from
 * @returns {Promise<Array|Object>} The JSON data or empty array on error
 */
export async function getJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`getJson: HTTP ${response.status} fetching ${url}`);
      return [];
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`getJson: could not load JSON from ${url}`, err);
    return [];
  }
}

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

/**
 * Checks if the current environment is a mobile app (iOS or Android)
 * @returns {boolean} True if running in mobile app, false otherwise
 */
const isMobileApp = () => {
  const parentIsIos = document.querySelector(".ios")
  const parentIsAndroid = document.querySelector(".android")
  return parentIsIos || parentIsAndroid
}


// =============================================================================
// OBJECT & ARRAY UTILITIES
// =============================================================================

/**
 * Recursively merges properties from one object into another
 * @param {Object} to - The target object to merge into
 * @param {Object} from - The source object to merge from
 * @returns {Object} The merged object
 */
export function merge(to, from) {
  for (const n in from) {
    if (typeof to[n] != 'object') {
      to[n] = from[n];
    } else if (typeof from[n] == 'object') {
      to[n] = merge(to[n], from[n]);
    }
  }
  return to;
}

/**
 * Checks if an array or string contains a value or any of multiple values
 * @param {Array|string} a - The array or string to search in
 * @param {*|Array} b - The value(s) to search for
 * @returns {boolean} True if the value(s) are found, false otherwise
 */
export function contains(a, b) {
  if (Array.isArray(b)) {
    return b.some(x => a.indexOf(x) > -1);
  }
  return a.indexOf(b) > -1;
}

/**
 * Sorts an array by a specified property in descending order
 * @param {Array} arr - The array to sort
 * @param {string} value - The property name to sort by
 * @param {boolean} ranked - Whether to add rank property (1-indexed)
 * @returns {Array} The sorted array
 */
export function sort(arr, value, ranked = false) {
  let ordered = arr.sort((a, b) => (a[value] < b[value]) ? 1 : -1)
  if (ranked) {
    ordered.forEach((item, index) => {
      item.rank = index + 1
    });
  }
  return ordered
}

/**
 * Calculates the sum of a specific property across all items in an array
 * @param {Array} arr - The array of objects
 * @param {string} prop - The property name to sum
 * @returns {number} The total sum
 */
export function sum(arr, prop) {
  let total = 0
  for (var i = 0, _len = arr.length; i < _len; i++) {
    total += arr[i][prop]
  }
  return total
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Formats a number with comma separators for thousands
 * @param {number|string} num - The number to format
 * @returns {string} The formatted number string
 */
export function commas(num) {
  var result = parseFloat(num).toFixed();
  result = result.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  return result
}

// =============================================================================
// DATE & TIME UTILITIES
// =============================================================================

/**
 * Converts various timestamp formats to human-readable "time ago" format
 * @param {string|number} inputTime - Unix timestamp, ISO string, or MM-DD-YYYY HH:mm:ss format
 * @returns {string} Human-friendly time difference (e.g., "7 minutes ago", "just now")
 */
export function timeAgo(inputTime) {
  if (inputTime == null) return "";

  let time;

  // Handle Unix timestamp (number or numeric string)
  if (
    typeof inputTime === "number" ||
    (typeof inputTime === "string" && /^\d+$/.test(inputTime))
  ) {
    time = new Date(Number(inputTime) * 1000);
  }
  // Handle ISO-style string (contains 'T')
  else if (typeof inputTime === "string" && inputTime.includes("T")) {
    let dateString = inputTime.replace(/(\.\d{3})\d+/, "$1");
    time = new Date(dateString);
  }
  // Handle MM-DD-YYYY HH:mm:ss format
  else if (typeof inputTime === "string" && /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/.test(inputTime)) {
    const [datePart, timePart] = inputTime.split(" ");
    const [MM, DD, YYYY] = datePart.split("-").map(Number);
    const [hh, mm, ss] = timePart.split(":").map(Number);
    time = new Date(YYYY, MM - 1, DD, hh, mm, ss);
  }
  // Fallback for old Safari compatibility
  else if (
    typeof inputTime === "string" &&
    /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/.test(inputTime)
  ) {
    const [datePart, timePart] = inputTime.split(" ");
    const [MM, DD, YYYY] = datePart.split("-").map(Number);
    const [hh, mm, ss] = timePart.split(":").map(Number);
    time = new Date(Date.UTC(YYYY, MM - 1, DD, hh, mm, ss));
  } else {
    return "";
  }

  if (isNaN(time.getTime())) return "";

  const now = new Date();
  const diffMs = now - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? "" : "s"} ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

/**
 * Converts an ISO date string to Unix timestamp
 * @param {string} isoDate - ISO date string
 * @returns {number} Unix timestamp in seconds
 */
export function isoToUnix(isoDate) {
  const msTimestamp = new Date(isoDate).getTime();
  return Math.floor(msTimestamp / 1000);
}

/**
 * Formats a Unix timestamp for Australia/Sydney timezone
 * @param {number} ts - Unix timestamp in seconds
 * @returns {string} Formatted date string for Sydney timezone
 */
export function parseAussieLocal(ts) {
  const date = new Date(ts * 1000);
  
  const sydneyString = date.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return sydneyString
}

// =============================================================================
// SEARCH & AUTOCOMPLETE
// =============================================================================

/**
 * Provides autocomplete suggestions based on input value
 * Prioritizes matches that start with the input, then includes partial matches
 * @param {string} inputValue - The search input
 * @param {Array<string>} arrayOfStuff - Array of strings to search through
 * @returns {Array<Object>} Array of suggestion objects with 'text' property (max 10)
 */
export function autocomplete(inputValue, arrayOfStuff) {
  if (!inputValue || inputValue.length === 0) {
    return []
  }

  // Find items that start with the input (higher priority)
  let topSuggestions = arrayOfStuff.filter((item) => {
    return item.toLowerCase().startsWith(inputValue.toLowerCase())
  })

  // Find items that contain the input but don't start with it
  let otherSuggestions = arrayOfStuff.filter((item) => {
    if (topSuggestions.includes(item)) {
      return false
    }
    return item.toLowerCase().includes(inputValue.toLowerCase())
  })

  // Return top 10 suggestions with proper format
  return [...topSuggestions, ...otherSuggestions].slice(0, 10).map((item) => {
    return {
      text: item
    }
  })
}

// =============================================================================
// TEMPLATING
// =============================================================================

/**
 * Lightweight Mustache-style template renderer
 * Supports variable substitution, loops, conditionals, and partials
 * @param {string} template - The template string with {{}} placeholders
 * @param {*} self - The data context for rendering
 * @param {Object} parent - Parent context for nested rendering
 * @param {boolean} invert - Whether to invert conditional logic
 * @returns {string} The rendered template
 */
export function mustache(template, self, parent, invert) {
  var render = mustache
  var output = ""
  var i

  function get(ctx, path) {
    path = path.pop ? path : path.split(".")
    ctx = ctx[path.shift()]
    ctx = ctx != null ? ctx : ""
    return (0 in path) ? get(ctx, path) : ctx
  }

  self = Array.isArray(self) ? self : (self ? [self] : [])
  self = invert ? (0 in self) ? [] : [1] : self

  for (i = 0; i < self.length; i++) {
    var childCode = ''
    var depth = 0
    var inverted
    var ctx = (typeof self[i] == "object") ? self[i] : {}
    ctx = Object.assign({}, parent, ctx)
    ctx[""] = { "": self[i] }

    template.replace(/([\s\S]*?)({{((\/)|(\^)|#)(.*?)}}|$)/g,
      function (match, code, y, z, close, invert, name) {
        if (!depth) {
          output += code.replace(/{{{(.*?)}}}|{{(!?)(&?)(>?)(.*?)}}/g,
            function (match, raw, comment, isRaw, partial, name) {
              return raw ? get(ctx, raw)
                : isRaw ? get(ctx, name)
                  : partial ? render(get(ctx, name), ctx)
                    : !comment ? new Option(get(ctx, name)).innerHTML
                      : ""
            }
          )
          inverted = invert
        } else {
          childCode += depth && !close || depth > 1 ? match : code
        }
        if (close) {
          if (!--depth) {
            name = get(ctx, name)
            if (/^f/.test(typeof name)) {
              output += name.call(ctx, childCode, function (template) {
                return render(template, ctx)
              })
            } else {
              output += render(childCode, name, ctx, inverted)
            }
            childCode = ""
          }
        } else {
          ++depth
        }
      }
    )
  }
  return output
}

// =============================================================================
// IFRAME & LAYOUT UTILITIES
// =============================================================================

/**
 * Updates the interactive atom background CSS variable based on parent article background
 * Used for consistent theming across iframe boundaries
 */
function updateParentVarFromArticleBackground() {
  try {
    const root = window.parent.document.documentElement;
    const articleBg = getComputedStyle(root).getPropertyValue('--article-background').trim();

    // Only set the property if the article background value exists
    if (articleBg) {
      root.style.setProperty('--interactive-atom-background', articleBg);
    }
  } catch (error) {
    console.log('Failed to update parent variable from article background:', error);
  }
}

/**
 * Handles iframe resizing and CSS variable synchronization for embedded content
 * Sets up observers to maintain consistent styling with parent document
 */
export function resizeIframe() {
  if (window.self !== window.top) {
    setTimeout(() => {
      if (window.resize) {
        const html = document.querySelector("html");
        const body = document.querySelector("body");

        // Remove default margins and padding for clean iframe embedding
        html.style.overflow = "hidden";
        html.style.margin = "0px";
        html.style.padding = "0px";

        body.style.overflow = "hidden";
        body.style.margin = "0px";
        body.style.padding = "0px";

        window.resize();
      }
    }, 100);

    const parentRoot = window.parent.document.documentElement;

    // Initial sync of background variables
    updateParentVarFromArticleBackground();

    // Watch for changes in parent document styles
    const observer = new window.parent.MutationObserver(() => {
      updateParentVarFromArticleBackground();
    });

    observer.observe(parentRoot, {
      attributes: true,
      attributeFilter: ['style']
    });
  }
}

// =============================================================================
// TOOLTIP UTILITIES
// =============================================================================

/**
 * Collection of utility functions for formatting tooltip data
 * These functions operate on 'this' context and format numeric values
 */
var tooltipUtilities = {
  /**
   * Formats a number with commas (operates on this[num])
   * @param {string} num - Property name to format
   * @returns {string} Formatted number with commas
   */
  commas: function (num) {
    var result = parseFloat(this[num]).toFixed();
    result = result.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    return result
  },

  /**
   * Formats large numbers with appropriate suffixes (bn, m) (operates on this[big])
   * @param {string} big - Property name to format
   * @returns {string} Formatted number with suffix or locale string
   */
  big: function (big) {
    var num = parseFloat(this[big]);

    if (num > 0) {
      if (num > 1000000000) { return (num / 1000000000).toFixed(1) + 'bn' }
      if (num > 1000000) { return (num / 1000000).toFixed(1) + 'm' }
      if (num % 1 != 0) { return num.toFixed(2) }
      else { return num.toLocaleString() }
    }

    if (num < 0) {
      var posNum = num * -1;
      if (posNum > 1000000000) return ["-" + String((posNum / 1000000000).toFixed(1)) + 'bn'];
      if (posNum > 1000000) return ["-" + String((posNum / 1000000).toFixed(1)) + 'm'];
      else { return num.toLocaleString() }
    }

    return num;
  },

  /**
   * Formats a number with specified decimal places (operates on this[property])
   * @param {string} items - Comma-separated string: "propertyName,decimalPlaces"
   * @returns {string} Number formatted to specified decimal places
   */
  decimals: function (items) {
    var nums = items.split(",")
    return parseFloat(this[nums[0]]).toFixed(nums[1]);
  }
}

export function isTouchOnlyDevice() {
  // Check if touch events are supported
  const hasTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   window.TouchEvent !== undefined;
  
  // Check if this is likely a touch-only device
  // This includes checking for mobile user agents and lack of hover capability
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasHover = window.matchMedia('(hover: hover)').matches;
  
  // Return true if device has touch AND (is mobile OR doesn't have hover capability)
  return hasTouch && (isMobile || !hasHover);
}

/**
 * Swaps the rows and columns of a 2D array.
 *
 * @param {Array} arr - The input 2D array.
 * @returns {Array} - The transposed 2D array.
 */
export function swapArray(arr) {
  return arr[0].map((col, i) => arr.map(row => row[i]));
}

  /**
   * Converts large numbers to a nice readable format.
   * @param {number|string} num - The number to format.
   * @returns {string} Formatted number.
   */
  export function niceNumber(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return num;

    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'bn';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'm';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';

    return n % 1 === 0 ? n.toString() : n.toFixed(2);
  }


// =============================================================================
// EXPORTS
// =============================================================================

export {
  tooltipUtilities
}