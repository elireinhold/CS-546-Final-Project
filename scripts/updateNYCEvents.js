import fetch from "node-fetch";
import { dbConnection } from "../config/mongoConnection.js";
import { normalizeNYCEvent } from "../data/events.js";
import { settings } from "../config/settings.js";

const NYC_API_URL = `${settings.nycApi.baseUrl}?$limit=${settings.nycApi.limit}`;

async function updateNYCEvents() {
  const db = await dbConnection();
  const eventCollection = db.collection("events");

  const response = await fetch(NYC_API_URL);
  const rawEvents = await response.json();

  let updatedCount = 0;
  let insertedCount = 0;

  for (const evt of rawEvents) {
    const cleaned = normalizeNYCEvent(evt);
    const existingEvent = await eventCollection.findOne({ eventId: cleaned.eventId });
    if (existingEvent && existingEvent.comments && existingEvent.comments.length > 0) {
      cleaned.comments = existingEvent.comments;
    }

    const result = await eventCollection.updateOne(
      { eventId: cleaned.eventId },     // match by NYC eventId
      { $set: cleaned },                // update data
      { upsert: true }                  // insert if not exist
    );

    if (result.matchedCount > 0) updatedCount++;
    if (result.upsertedCount > 0) insertedCount++;
  }

  
  process.exit(0);
}

updateNYCEvents();
