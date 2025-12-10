import fetch from "node-fetch";
import { dbConnection } from "../config/mongoConnection.js";
import * as events from "../data/events/index.js";
import { settings } from "../config/settings.js";

const NYC_API_URL = `${settings.nycApi.baseUrl}?$limit=${settings.nycApi.limit}`;

async function updateNYCEvents() {
  const db = await dbConnection();
  const eventCollection = db.collection("events");

  const response = await fetch(NYC_API_URL);
  const rawEvents = await response.json();

  let updatedCount = 0;
  let insertedCount = 0;

  // For each NYC event, update or insert
  for (const evt of rawEvents) {
    const cleaned = events.normalizeNYCEvent(evt);

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
