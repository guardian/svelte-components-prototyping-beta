## 1) Smallest working map

**CDN version (fastest to try):**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link
      href="https://unpkg.com/maplibre-gl@5.16.0/dist/maplibre-gl.css"
      rel="stylesheet"
    />
    <script src="https://unpkg.com/maplibre-gl@5.16.0/dist/maplibre-gl.js"></script>
    <style>
      html, body { height: 100%; margin: 0; }
      #map { height: 100%; }
    </style>
  </head>

  <body>
    <div id="map"></div>

    <script>
      const map = new maplibregl.Map({
        container: "map",
        style: "YOUR_STYLE_URL_OR_STYLE_JSON",
        center: [151.21, -33.87], // lng, lat
        zoom: 10
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
      map.addControl(new maplibregl.FullscreenControl(), "top-right");
      map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");
    </script>
  </body>
</html>
```

You’ll need a **style** (either a URL to a style JSON, or an inlined style object). Styles are the “map recipe”: **sources + layers + glyphs + sprites**. ([MapLibre][1])

## 2) The “default options” you’ll actually care about

MapLibre has a big `MapOptions` surface; these are the ones you’ll touch constantly:

* `container` (required): element or element id ([MapLibre][2])
* `style`: style URL/object (if `center/zoom` aren’t supplied, it can also provide defaults)
* `center`: defaults to `[0, 0]` if not in options or style ([MapLibre][2])
* `zoom`: defaults to `0` if not in options or style ([MapLibre][2])
* `pitch`: defaults to `0` ([MapLibre][2])
* `bearing` / `roll`: default `0` ([MapLibre][2])
* `interactive`: default is interactive (you typically don’t set this unless you want a “static map”)
* `attributionControl`: on by default; you can disable then re-add as compact ([MapLibre][3])
* `cooperativeGestures`: **highly recommended** for embedded maps (details below) ([MapLibre][4])

For the full list, the `MapOptions` page is the canonical reference. ([MapLibre][2])

## 3) “Zoom buttons” and the common built-in controls

MapLibre’s built-in controls are added with `map.addControl(...)`:

* **Zoom/compass UI**: `new NavigationControl()` ([MapLibre][5])
* **Locate me**: `new GeolocateControl()` (HTTPS required; may be unavailable/blocked) ([MapLibre][6])
* **Scale bar**: `new ScaleControl()` ([MapLibre][7])
* **Fullscreen**: `new FullscreenControl()` ([MapLibre][8])
* **Attribution**: `new AttributionControl({ compact: true })` (often nice on mobile) ([MapLibre][3])

## 4) Best practice for scroll/gesture UX (especially mobile)

This is the big one. By default, maps can “steal” scroll/pan when embedded in a scrolly page. ([GitHub][9])

You’ve got three common strategies:

### A) Cooperative gestures (recommended for most editorial pages)

Makes interaction intentional:

* Desktop: requires Ctrl/⌘ + scroll to zoom
* Mobile: requires **two fingers** to pan/zoom

```js
const map = new maplibregl.Map({
  container: "map",
  style: "...",
  cooperativeGestures: true
});
```

This is a first-class option in MapLibre now. ([MapLibre][4])

### B) Disable scroll-to-zoom (simple + effective)

Great when the map sits in an article and you don’t want scroll-jacking:

```js
map.scrollZoom.disable();
```

([MapLibre][10])

### C) Fine-grained toggles for all interactions (when you want full control)

MapLibre exposes handlers you can enable/disable (drag pan, drag rotate, box zoom, double click zoom, keyboard, touch zoom/rotate, etc.). The examples page “Toggle interactions” is a handy reference. ([MapLibre][11])

## 5) The mental model for “making maps” in MapLibre

Think in three layers:

1. **Style JSON**: defines the look + data plumbing (sources, layers, fonts, sprites). ([MapLibre][1])
2. **Runtime changes**: `setPaintProperty`, `setLayoutProperty`, `setFilter`, `setFeatureState`, etc.
3. **Custom overlays**: markers/popups, custom HTML, or a canvas overlay (for special viz)

If you already come from D3/TopoJSON land, the key MapLibre shift is: *you don’t “draw paths”; you configure sources + layers, and let the renderer handle it.*

## 6) A couple of “usual useful map things” patterns

### Add a marker + popup quickly

```js
new maplibregl.Marker()
  .setLngLat([151.21, -33.87])
  .setPopup(new maplibregl.Popup().setHTML("<strong>Hello</strong>"))
  .addTo(map);
```

### Add your own GeoJSON as a layer (the standard workflow)

* `map.addSource("my", { type: "geojson", data: geojson })`
* `map.addLayer({ id, type, source, paint... })`

The style spec sections on **Sources** and **Layers** are the best reference for this. ([MapLibre][12])

---

[1]: https://www.maplibre.org/maplibre-style-spec/?utm_source=chatgpt.com "Introduction - MapLibre Style Spec"
[2]: https://www.maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/?utm_source=chatgpt.com "MapOptions - MapLibre GL JS"
[3]: https://www.maplibre.org/maplibre-gl-js/docs/API/classes/AttributionControl/?utm_source=chatgpt.com "AttributionControl - MapLibre GL JS"
[4]: https://www.maplibre.org/maplibre-gl-js/docs/API/classes/CooperativeGesturesHandler/?utm_source=chatgpt.com "CooperativeGesturesHandler - MapLibre GL JS"
[5]: https://www.maplibre.org/maplibre-gl-js/docs/examples/display-map-navigation-controls/?utm_source=chatgpt.com "Display map navigation controls - MapLibre GL JS"
[6]: https://www.maplibre.org/maplibre-gl-js/docs/API/classes/GeolocateControl/?utm_source=chatgpt.com "GeolocateControl - MapLibre GL JS"
[7]: https://www.maplibre.org/maplibre-gl-js/docs/API/classes/ScaleControl/?utm_source=chatgpt.com "ScaleControl - MapLibre GL JS"
[8]: https://www.maplibre.org/maplibre-gl-js/docs/API/classes/FullscreenControl/?utm_source=chatgpt.com "FullscreenControl - MapLibre GL JS"
[9]: https://github.com/maplibre/maplibre-gl-js/issues/234?utm_source=chatgpt.com "MapLibre GL JS Default Scrolling Behavior Proposal #234"
[10]: https://www.maplibre.org/maplibre-gl-js/docs/API/classes/ScrollZoomHandler/?utm_source=chatgpt.com "ScrollZoomHandler - MapLibre GL JS"
[11]: https://www.maplibre.org/maplibre-gl-js/docs/examples/toggle-interactions/?utm_source=chatgpt.com "Toggle interactions - MapLibre GL JS"
[12]: https://www.maplibre.org/maplibre-style-spec/sources/?utm_source=chatgpt.com "Sources - MapLibre Style Spec"
