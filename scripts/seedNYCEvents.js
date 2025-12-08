import fetch from "node-fetch";
import { dbConnection } from "../config/mongoConnection.js";
import { normalizeNYCEvent, insertManyNYCEvents } from "../data/events.js";
import { settings } from "../config/settings.js";

const NYC_API_URL = `${settings.nycApi.baseUrl}?$limit=${settings.nycApi.limit}`;

async function seedNYC() {
  console.log("Connecting to database...");
  const db = await dbConnection();
  const eventCollection = db.collection("events");

  console.log("Fetching NYC event dataset...");
  const response = await fetch(NYC_API_URL);
  const rawEvents = await response.json();
  
  console.log(`Fetched ${rawEvents.length} events.`);

  console.log("Normalizing event data...");
  const cleanedEvents = rawEvents.map(evt => normalizeNYCEvent(evt));

  console.log("Clearing old NYC events...");
  await eventCollection.deleteMany({ eventSource: "NYC" });

  console.log("Inserting cleaned NYC events...");
  await insertManyNYCEvents(cleanedEvents);

  console.log("NYC event seeding completed!");
  process.exit(0);
}

seedNYC();