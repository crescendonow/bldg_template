let map, drawnItems, drawControl, resultLayer;

function initMap() {
  map = L.map("map", { center: [13.0, 101.0], zoom: 12 });

  // Esri World Imagery satellite basemap
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
      maxZoom: 19,
    }
  ).addTo(map);

  // Draw layer
  drawnItems = new L.FeatureGroup().addTo(map);
  drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: {
      polygon: { shapeOptions: { color: "#facc15", weight: 2 } },
      rectangle: { shapeOptions: { color: "#facc15", weight: 2 } },
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
    },
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, (e) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    window.currentROI = e.layer.toGeoJSON().geometry;
    document.getElementById("btn-extract").disabled = false;
    updateROIInfo();
  });

  map.on(L.Draw.Event.DELETED, () => {
    window.currentROI = null;
    document.getElementById("btn-extract").disabled = true;
    document.getElementById("roi-info").textContent = "ยังไม่ได้วาด ROI";
  });
}

function updateROIInfo() {
  const info = document.getElementById("roi-info");
  if (!info) return;
  const bounds = drawnItems.getBounds();
  if (bounds.isValid()) {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    info.textContent = `SW: ${sw.lat.toFixed(4)}, ${sw.lng.toFixed(4)} | NE: ${ne.lat.toFixed(4)}, ${ne.lng.toFixed(4)}`;
  }
}

function showResultLayer(geojsonData) {
  if (resultLayer) map.removeLayer(resultLayer);
  resultLayer = L.geoJSON(geojsonData, {
    style: { color: "#ef4444", weight: 1, fillOpacity: 0.3 },
  }).addTo(map);
  if (resultLayer.getBounds().isValid()) map.fitBounds(resultLayer.getBounds());
}
