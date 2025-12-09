document.addEventListener("DOMContentLoaded", () => {
  // Initialize map centered on NYC
  const map = L.map("map").setView([40.7128, -74.0060], 12);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Add event markers
  if (Array.isArray(events)) {
    events.forEach(ev => {
      if (ev.lat && ev.lon) {
        L.marker([ev.lat, ev.lon])
          .addTo(map)
          .bindPopup(`<b>${ev.title}</b><br>${ev.location}`);
      }
    });
  }
});