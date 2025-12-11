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

      // Add a marker for user's location
      L.marker([lat, lon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    });
  }

  // Add event marker
  if (Array.isArray(eventLocation) && eventLocation.length > 0) {
    const ev = eventLocation[0];

    if (ev.lat && ev.lon) {
      // Add marker
      L.marker([ev.lat, ev.lon])
        .addTo(map)
        .bindPopup(`
          <b>${ev.title}</b><br>
          ${ev.location}<br>
          <a href="/events/${ev.id}">View Event</a>
        `)

        map.flyTo([ev.lat, ev.lon], 13);
    }
  }
});
