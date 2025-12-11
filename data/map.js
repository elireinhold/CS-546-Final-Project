import fetch from "node-fetch";
import { getEventById } from "./events.js";
import { getSavedEvents } from "./users.js"
import helpers from "../helpers/eventHelpers.js";

// For geocodeLocation to speed up times
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const geocodeCache = new Map();

// Geocodes location and returns coordinates
export async function geocodeLocation(eventLocation, throttleMs = 0) {
  if (!eventLocation || typeof eventLocation !== "string") {
    throw "Error: Invalid eventLocation";
  }

  // Return cached result (speeds up loading times)
  if (geocodeCache.has(eventLocation)) {
    return geocodeCache.get(eventLocation);
  }

  // Limit the search location to just NYC (speeds up loading times)
  const nycBounds = [-74.25909, 40.477399, -73.70018, 40.917577];

  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: eventLocation,
      format: "json",
      limit: "1",
      addressdetails: "0",
      bounded: "1",
      viewbox: nycBounds.join(","),
    });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "NYSeeNowApp/1.0 (ereinhol@stevens.edu)"
    }
  });

  const data = await res.json();
  if (!data[0]) return null;

  const coords = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };

  // Save location in cache
  geocodeCache.set(eventLocation, coords);

  // Throttle if needed
  if (throttleMs > 0) await delay(throttleMs);

  return coords;
}


// Uses geocoding to get all events with coordinates that user saved
export async function getAllSavedEventsWithCoordinates(userId) {
  userId = await helpers.validUserId(userId);
  const eventIds = await getSavedEvents(userId);
  // Fetch each event by ID
  const eventsList = [];
  for (const id of eventIds) {
    const ev = await getEventById(id);
    if(ev) {
      eventsList.push(ev);
    }
  }

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
                id: event._id,
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
  eventId = helpers.checkId(eventId);
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
                id: eventData._id,
                lat: coordinates.lat,
                lon: coordinates.lon
            });
        }
    }
    return result;
  }

  