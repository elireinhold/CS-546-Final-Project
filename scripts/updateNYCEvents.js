import fetch from "node-fetch";
import { dbConnection } from "../config/mongoConnection.js";
import { normalizeNYCEvent } from "../data/events.js";
import { settings } from "../config/settings.js";

const NYC_API_URL = `${settings.nycApi.baseUrl}?$limit=${settings.nycApi.limit}`;

async function updateNYCEvents() {
  console.log("Connecting to database...");
  const db = await dbConnection();
  const eventCollection = db.collection("events");

  console.log("Fetching latest NYC events...");
  const response = await fetch(NYC_API_URL);
  const rawEvents = await response.json();
  console.log(`Fetched ${rawEvents.length} NYC events.`);

  let updatedCount = 0;
  let insertedCount = 0;

  // For each NYC event, update or insert
  for (const evt of rawEvents) {
    const cleaned = normalizeNYCEvent(evt);

    const result = await eventCollection.updateOne(
      { eventId: cleaned.eventId },     // match by NYC eventId
      { $set: cleaned },                // update data
      { upsert: true }                  // insert if not exist
    );

    if (result.matchedCount > 0) updatedCount++;
    if (result.upsertedCount > 0) insertedCount++;
  }

  console.log(`NYC Events updated: ${updatedCount}`);
  console.log(`NYC Events inserted: ${insertedCount}`);
  console.log("Update completed!");
  
  process.exit(0);
}

updateNYCEvents();