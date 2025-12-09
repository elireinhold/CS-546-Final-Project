// I just made it render a map centered on NYC
// I did not add events yet
document.addEventListener("DOMContentLoaded", () => {
  // Initialize map centered on NYC
  const map = L.map("map").setView([40.7128, -74.0060], 12);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
});