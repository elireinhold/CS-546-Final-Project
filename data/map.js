import fetch from "node-fetch";
import { getAllEventsByUser, getEventById } from "./events.js";


// Geocodes location and returns cooridinates
export async function geocodeLocation(eventLocation) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(eventLocation)}`;
const res = await fetch(url, {
  headers: {
    "User-Agent": "NYSeeNowApp/1.0 (ereinhol@stevens.edu)"
  }
});  const data = await res.json();
  if (!data[0]) return null;
  
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

// Uses geocoding to get all events with coordinates that user saved
export async function getAllSavedEventsWithCoordinates(userId) {
  const eventsList = await getAllEventsByUser(userId)

  const result = [];
  // For each event get coordinates and push all obj containing info into result array
  for (const event of eventsList) {
    if (event.eventLocation) {
        // Need to convert location to an address
        const parkName = event.eventLocation.split(":")[0].trim() + ", New York, NY";
        const coordinates = await geocodeLocation(parkName);
        if (coordinates) {
            result.push({
                title: event.eventName,
                location: event.eventLocation,
                lat: coordinates.lat,
                lon: coordinates.lon
            });
        }
    }
  }

  return result;
}

// Uses geocoding to get event with coordinate for event page
export async function getEventWithCoordinates(eventId) {
  const eventData = await getEventById(eventId)

  const result = [];
  if (eventData.eventLocation) {
        // Need to convert location to an address
        const parkName = eventData.eventLocation.split(":")[0].trim() + ", New York, NY";
        const coordinates = await geocodeLocation(parkName);
        if (coordinates) {
            result.push({
                title: eventData.eventName,
                location: eventData.eventLocation,
                lat: coordinates.lat,
                lon: coordinates.lon
            });
        }
    }
    return result;
  }
  