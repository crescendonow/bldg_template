const FORMAT_LABELS = {
  gpkg: "GeoPackage (.gpkg)",
  geojson: "GeoJSON (.geojson)",
  fgb: "FlatGeobuf (.fgb)",
  shp: "Shapefile (.zip)",
  tab: "MapInfo TAB (.zip)",
  kml: "KML (.kml)",
};

function renderDownloadButtons(jobId, formatsReady) {
  if (!formatsReady || formatsReady.length === 0) return "";
  return formatsReady
    .map(
      (fmt) => `
    <a href="${getDownloadUrl(jobId, fmt)}" download
       class="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium text-white transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      ${FORMAT_LABELS[fmt] || fmt}
    </a>`
    )
    .join("");
}
