document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([40.7128, -74.0060], 12);
  if (!map) return;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  if (navigator.geolocation && eventLocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      // Add user marker
      L.marker([userLat, userLon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

      const ev = eventLocation; // single event object

      if (ev.lat && ev.lon) {
        // Compute distance to this event
        const distance = geolib.getDistance(
          { latitude: userLat, longitude: userLon },
          { latitude: Number(ev.lat), longitude: Number(ev.lon) }
        );

        console.log(`Distance to ${ev.title}: ${distance} meters`);

        // Add marker for the event
        L.marker([ev.lat, ev.lon])
          .addTo(map)
          .bindPopup(`
            <b>${ev.title}</b><br>
            ${ev.location}<br>
            Distance: ${distance} meters<br>
            <a href="/events/${ev.id}">View Event</a>
          `);

        map.flyTo([ev.lat, ev.lon], 13);
      }
    }, err => console.error("Geolocation error:", err));
  }
});
