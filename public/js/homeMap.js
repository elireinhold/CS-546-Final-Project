document.addEventListener("DOMContentLoaded", () => {
  // Initialize map centered on NYC
  const map = L.map("map").setView([40.7128, -74.0060], 12);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Try to get user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Center map on user's location
      map.setView([lat, lon], 13);

      // Add a marker for user's location
      L.marker([lat, lon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    });
  }

  // Add event markers
  const bounds = [];
  if (eventLocation) {
    eventLocation.forEach(ev => {
      if (ev.lat && ev.lon) {
        const marker = L.marker([ev.lat, ev.lon])
          .addTo(map)
          .bindPopup(`
            <b>${ev.title}</b><br>
            ${ev.location}<br>
            <a href="/events/${ev.id}">View Event</a>
          `);
        bounds.push([ev.lat, ev.lon]);
      }
    });
  }

  // Center and zoom the map to fit all markers
  if (bounds.length > 0) {
    map.fitBounds(bounds, { maxZoom: 13 });
  }
});
