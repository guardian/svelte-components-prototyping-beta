// Maybe can merge into gis.js but check with Andy first


// Update the scale control position 

export function updateScaleControlPosition() {
    let topScale = document.querySelector('.maplibregl-ctrl-bottom-right div:nth-of-type(1)');
    let bottomScale = document.querySelector('.maplibregl-ctrl-bottom-right div:nth-of-type(2)');
    let scaleContainer = document.querySelector('.maplibregl-ctrl-bottom-right');
    let topScaleWidth = topScale.getBoundingClientRect().width;
    let bottomScaleWidth = bottomScale.getBoundingClientRect().width;
    // Check if top scale bigger than bottom scale
    if (topScaleWidth > bottomScaleWidth) {
      // Offset the scale container by the width of the top scale
      scaleContainer.style.right = `${topScaleWidth - bottomScaleWidth}px`;
    } else {
      scaleContainer.style.right = `${0}px`;
    }
}

// Function to update minimap viewport rectangle
export function updateMinimap(mapInstance, minimapPath, viewportRect) {
    if (!mapInstance || !minimapPath || !viewportRect) return;

    try {
      // Get current map bounds from the main MapLibre map
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest(); // returns {lng, lat}
      const ne = bounds.getNorthEast(); // returns {lng, lat}
      
      // Create GeoJSON polygon for viewport bounds
      // D3 expects clockwise exterior rings (area to the right of boundary)
      // Order: SW -> NW -> NE -> SE -> SW (clockwise)
      const viewportGeo = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [sw.lng, sw.lat],  // SW
            [sw.lng, ne.lat],  // NW
            [ne.lng, ne.lat],  // NE
            [ne.lng, sw.lat],  // SE
            [sw.lng, sw.lat]   // close back to SW
          ]]
        }
      };

      // Use minimapPath to generate the path
      const pathData = minimapPath(viewportGeo);
      if (pathData) {
        // Calculate viewport size to adjust stroke width for small rectangles
        const lonRange = ne.lng - sw.lng;
        const latRange = ne.lat - sw.lat;
        const area = lonRange * latRange;
        
        // Increase stroke width when viewport is small (threshold is arbitrary, adjust as needed)
        const strokeWidth = area < 0.5 ? 4 : (area < 2 ? 3 : 2);
        
        viewportRect
          .attr('d', pathData)
          .attr('stroke-width', strokeWidth)
          .style('display', 'block');
      } else {
        viewportRect.style('display', 'none');
      }
    } catch (e) {
      // Silently handle errors
    }
  }