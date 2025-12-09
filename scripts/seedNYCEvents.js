import fetch from "node-fetch";
import { dbConnection } from "../config/mongoConnection.js";
import { normalizeNYCEvent, insertManyNYCEvents } from "../data/events.js";
import { settings } from "../config/settings.js";

const NYC_API_URL = `${settings.nycApi.baseUrl}?$limit=${settings.nycApi.limit}`;

async function seedNYC() {
  const db = await dbConnection();
  const eventCollection = db.collection("events");

  const response = await fetch(NYC_API_URL);
  const rawEvents = await response.json();
  

  const cleanedEvents = rawEvents.map(evt => normalizeNYCEvent(evt));

  await eventCollection.deleteMany({ eventSource: "NYC" });

  await insertManyNYCEvents(cleanedEvents);

  process.exit(0);
}

seedNYC();
