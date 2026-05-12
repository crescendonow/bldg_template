let map, draw, resultLayerId;

const THAILAND_BOUNDS = [
  [97.0, 5.5],
  [106.0, 20.8],
];

const BOUNDARY_LAYERS = [
  {
    id: "boundary-country",
    checkboxId: "toggle-boundary-country",
    url: "/static/data/thailand_boundary.geojson",
    label: "ขอบเขตประเทศไทย/จังหวัด",
    lineColor: "#38bdf8",
    fillColor: "#0ea5e9",
    lineWidth: 1.2,
  },
  {
    id: "boundary-amphoe",
    checkboxId: "toggle-boundary-amphoe",
    url: "/static/data/thailand_amphoe.geojson",
    label: "ขอบเขตอำเภอ",
    lineColor: "#facc15",
    fillColor: "#eab308",
    lineWidth: 0.8,
  },
  {
    id: "boundary-tambon",
    checkboxId: "toggle-boundary-tambon",
    url: "/static/data/thailand_tambon.geojson",
    label: "ขอบเขตตำบล",
    lineColor: "#34d399",
    fillColor: "#10b981",
    lineWidth: 0.45,
  },
];

function initMap() {
  map = new maplibregl.Map({
    container: "map",
    bounds: THAILAND_BOUNDS,
    fitBoundsOptions: { padding: 20 },
    style: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        "esri-imagery": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles &copy; Esri",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "esri-imagery",
          type: "raster",
          source: "esri-imagery",
        },
      ],
    },
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

  MapboxDraw.constants.classes.CANVAS = "maplibregl-canvas";
  MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
  MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
  MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";
  MapboxDraw.constants.classes.ATTRIBUTION = "maplibregl-ctrl-attrib";

  const drawModes = MapboxDraw.modes;
  const rectangleMode = window.DrawRectangleMode || window.DrawRectangle;
  if (rectangleMode) {
    drawModes.draw_rectangle = rectangleMode.default || rectangleMode;
  }

  draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: drawModes,
    controls: {
      polygon: true,
      trash: true,
    },
    defaultMode: "draw_polygon",
    styles: getDrawStyles(),
  });
  map.addControl(draw, "top-left");
  addRectangleDrawButton();

  map.on("draw.create", handleDrawChange);
  map.on("draw.update", handleDrawChange);
  map.on("draw.delete", handleDrawDelete);

  map.on("load", () => {
    addBoundaryLayers();
    setupBoundaryToggles();
  });
}

function addRectangleDrawButton() {
  if (!MapboxDraw.modes.draw_rectangle) return;

  const drawControls = document.querySelector(".maplibregl-ctrl-group .mapbox-gl-draw_polygon")?.parentElement;
  if (!drawControls || document.getElementById("draw-rectangle")) return;

  const button = document.createElement("button");
  button.id = "draw-rectangle";
  button.type = "button";
  button.title = "Draw rectangle";
  button.className = "mapbox-gl-draw_ctrl-draw-btn";
  button.innerHTML = "▭";
  button.style.fontSize = "18px";
  button.style.lineHeight = "24px";
  button.addEventListener("click", () => draw.changeMode("draw_rectangle"));
  drawControls.insertBefore(button, drawControls.firstChild);
}

function getDrawStyles() {
  return [
    {
      id: "gl-draw-polygon-fill-inactive",
      type: "fill",
      filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
      paint: { "fill-color": "#facc15", "fill-opacity": 0.18 },
    },
    {
      id: "gl-draw-polygon-fill-active",
      type: "fill",
      filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
      paint: { "fill-color": "#facc15", "fill-opacity": 0.28 },
    },
    {
      id: "gl-draw-polygon-stroke-inactive",
      type: "line",
      filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#facc15", "line-width": 2 },
    },
    {
      id: "gl-draw-polygon-stroke-active",
      type: "line",
      filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#fde047", "line-dasharray": [0.2, 2], "line-width": 2 },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-halo-active",
      type: "circle",
      filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      paint: { "circle-radius": 6, "circle-color": "#ffffff" },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-active",
      type: "circle",
      filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      paint: { "circle-radius": 4, "circle-color": "#facc15" },
    },
  ];
}

function handleDrawChange(e) {
  const features = draw.getAll().features;
  const latestFeature = e.features && e.features[0] ? e.features[0] : features[features.length - 1];

  features.forEach((feature) => {
    if (!latestFeature || feature.id !== latestFeature.id) {
      draw.delete(feature.id);
    }
  });

  window.currentROI = latestFeature ? latestFeature.geometry : null;
  document.getElementById("btn-extract").disabled = !window.currentROI;
  updateROIInfo();
}

function handleDrawDelete() {
  const features = draw.getAll().features;
  window.currentROI = features[0] ? features[0].geometry : null;
  document.getElementById("btn-extract").disabled = !window.currentROI;

  if (window.currentROI) {
    updateROIInfo();
  } else {
    const info = document.getElementById("roi-info");
    if (info) info.textContent = "ยังไม่ได้วาด ROI";
  }
}

function addBoundaryLayers() {
  BOUNDARY_LAYERS.forEach((layer) => {
    if (map.getSource(layer.id)) return;

    map.addSource(layer.id, {
      type: "geojson",
      data: layer.url,
    });

    map.addLayer({
      id: `${layer.id}-fill`,
      type: "fill",
      source: layer.id,
      layout: { visibility: "none" },
      paint: {
        "fill-color": layer.fillColor,
        "fill-opacity": 0.04,
      },
    });

    map.addLayer({
      id: `${layer.id}-line`,
      type: "line",
      source: layer.id,
      layout: { visibility: "none" },
      paint: {
        "line-color": layer.lineColor,
        "line-opacity": 0.9,
        "line-width": layer.lineWidth,
      },
    });
  });
}

function setupBoundaryToggles() {
  BOUNDARY_LAYERS.forEach((layer) => {
    const checkbox = document.getElementById(layer.checkboxId);
    if (!checkbox) return;

    checkbox.addEventListener("change", () => {
      const visibility = checkbox.checked ? "visible" : "none";
      [`${layer.id}-fill`, `${layer.id}-line`].forEach((mapLayerId) => {
        if (map.getLayer(mapLayerId)) {
          map.setLayoutProperty(mapLayerId, "visibility", visibility);
        }
      });
    });
  });
}

function updateROIInfo() {
  const info = document.getElementById("roi-info");
  if (!info || !window.currentROI) return;

  const bounds = getGeometryBounds(window.currentROI);
  if (!bounds) return;

  info.textContent = `SW: ${bounds.minY.toFixed(4)}, ${bounds.minX.toFixed(4)} | NE: ${bounds.maxY.toFixed(4)}, ${bounds.maxX.toFixed(4)}`;
}

function getGeometryBounds(geometry) {
  const coordinates = [];
  collectCoordinates(geometry.coordinates, coordinates);
  if (!coordinates.length) return null;

  return coordinates.reduce(
    (bounds, coord) => ({
      minX: Math.min(bounds.minX, coord[0]),
      minY: Math.min(bounds.minY, coord[1]),
      maxX: Math.max(bounds.maxX, coord[0]),
      maxY: Math.max(bounds.maxY, coord[1]),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

function collectCoordinates(value, output) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    output.push(value);
    return;
  }
  value.forEach((item) => collectCoordinates(item, output));
}

function showResultLayer(geojsonData) {
  if (!map.isStyleLoaded()) {
    map.once("load", () => showResultLayer(geojsonData));
    return;
  }

  if (resultLayerId) {
    ["result-fill", "result-line"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("result")) map.removeSource("result");
  }

  map.addSource("result", {
    type: "geojson",
    data: geojsonData,
  });

  map.addLayer({
    id: "result-fill",
    type: "fill",
    source: "result",
    paint: { "fill-color": "#ef4444", "fill-opacity": 0.32 },
  });

  map.addLayer({
    id: "result-line",
    type: "line",
    source: "result",
    paint: { "line-color": "#fecaca", "line-width": 1.2 },
  });

  resultLayerId = "result";
  fitToGeoJSON(geojsonData);
}

function fitToGeoJSON(geojsonData) {
  const geometries = [];
  if (geojsonData.type === "FeatureCollection") {
    geojsonData.features.forEach((feature) => feature.geometry && geometries.push(feature.geometry));
  } else if (geojsonData.type === "Feature") {
    geometries.push(geojsonData.geometry);
  } else if (geojsonData.coordinates) {
    geometries.push(geojsonData);
  }

  const bounds = geometries.reduce((currentBounds, geometry) => {
    const geometryBounds = getGeometryBounds(geometry);
    if (!geometryBounds) return currentBounds;
    currentBounds.extend([geometryBounds.minX, geometryBounds.minY]);
    currentBounds.extend([geometryBounds.maxX, geometryBounds.maxY]);
    return currentBounds;
  }, new maplibregl.LngLatBounds());

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 40, maxZoom: 18 });
  }
}
