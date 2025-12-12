document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([40.7128, -74.0060], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  if (navigator.geolocation && Array.isArray(eventLocation)) {
    navigator.geolocation.getCurrentPosition(position => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      // Add marker for user location
      L.marker([userLat, userLon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

      // Compute distance to events
      const eventsWithDistance = eventLocation.map(ev => ({
        ...ev,
        distance: geolib.getDistance(
          { latitude: userLat, longitude: userLon },
          { latitude: Number(ev.lat) , longitude: Number(ev.lon) }
        )
      }));
      // Sort by distance, take top 5 closest
      const closestEvents = eventsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      // Add markers for closest events
      const bounds = [];
      closestEvents.forEach(ev => {
        if (ev.lat && ev.lon) {
          L.marker([ev.lat, ev.lon])
            .addTo(map)
            .bindPopup(`
              <b>${ev.title}</b><br>
              ${ev.location}<br>
              <a href="/events/${ev.id}">View Event</a>
            `);
          bounds.push([ev.lat, ev.lon]);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { maxZoom: 13 });
      }
    });
  }
});
