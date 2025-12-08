import { events } from "../config/mongoCollections.js";

async function getEvents() {
  const eventCollection = await events();
}
