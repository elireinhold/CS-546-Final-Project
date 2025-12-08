import { events } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";


// -----------------------------
// Normalize NYC Dataset Entry
// -----------------------------
// NYC borough abbreviations → full names
const boroughMap = {
  M: "Manhattan",
  BX: "Bronx",
  BK: "Brooklyn",
  Q: "Queens",
  SI: "Staten Island"
};

export function normalizeNYCEvent(rawEvent) {
  return {
    eventId: rawEvent.event_id || null,
    eventName: rawEvent.event_name || "Unnamed Event",
    startDateTime: rawEvent.start_date_time || null,
    endDateTime: rawEvent.end_date_time || null,
    eventSource: "NYC",
    eventType: rawEvent.event_type || null,
    eventBorough: rawEvent.event_borough || null,
    eventLocation: rawEvent.location || rawEvent.site_location || null,
    eventStreetSide: rawEvent.street_side || rawEvent.street_side_description || null,
    streetClosureType: rawEvent.street_closure_type || null,
    communityBoard: rawEvent.community_board || null,
    coordinates: rawEvent.coordinates || null,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };
}


// -----------------------------
// Insert Many Normalized NYC Events
// -----------------------------
export async function insertManyNYCEvents(eventArray) {
  if (!Array.isArray(eventArray)) {
    throw "insertManyNYCEvents: argument must be an array";
  }

  const eventCollection = await events();
  const result = await eventCollection.insertMany(eventArray);
  return result.insertedCount;
}


// -----------------------------
// Clear Old NYC Events
// -----------------------------
export async function clearNYCEvents() {
  const eventCollection = await events();
  return await eventCollection.deleteMany({ eventSource: "NYC" });
}


// -----------------------------
// Get One Event
// -----------------------------
export async function getEventById(id) {
  const eventCollection = await events();

  if (!ObjectId.isValid(id)) throw "Invalid event ID";

  const event = await eventCollection.findOne({ _id: new ObjectId(id) });
  if (!event) throw "Event not found";

  return event;
}


// -----------------------------
// Search Events
// Supports: keyword, borough (multi), eventType (multi), date range
// -----------------------------
export async function searchEvents({ keyword, borough, eventType, startDate, endDate }) {
  const eventCollection = await events();
  const query = {};

  // ------------------------------------
  // Keyword search (case-insensitive)
  // ------------------------------------
  if (keyword && keyword.trim()) {
    query.eventName = { $regex: keyword.trim(), $options: "i" };
  }

  // ------------------------------------
  // Borough multi-select array support
  // borough = ["Manhattan", "Brooklyn"]
  // ------------------------------------
  if (Array.isArray(borough) && borough.length > 0 && !borough.includes("all")) {
    query.eventBorough = { $in: borough };
  }

  // ------------------------------------
  // EventType multi-select array support
  // eventType = ["Special Event", "Sport - Youth"]
  // ------------------------------------
  if (Array.isArray(eventType) && eventType.length > 0 && !eventType.includes("all")) {
    query.eventType = { $in: eventType };
  }

  // ------------------------------------
  // Date range (inclusive) — tolerate string or Date in DB
  // startDate/endDate are yyyy-mm-dd strings from the UI
  // Convert stored startDateTime to Date on the fly to handle string data
  // ------------------------------------
  const dateExpr = [];
  const dateValue = {
    $convert: {
      input: "$startDateTime",
      to: "date",
      onError: null,
      onNull: null
    }
  };

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    if (!isNaN(start)) {
      dateExpr.push({ $gte: [dateValue, start] });
    }
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (!isNaN(end)) {
      dateExpr.push({ $lte: [dateValue, end] });
    }
  }

  if (dateExpr.length) {
    // Ensure the converted date is not null to avoid matching invalid/empty values
    query.$expr = { $and: [{ $ne: [dateValue, null] }, ...dateExpr] };
  }

  return await eventCollection.find(query).limit(200).toArray();
}

// -----------------------------
// Get distinct event types
// -----------------------------
export async function getDistinctEventTypes() {
  const eventCollection = await events();
  const types = await eventCollection.distinct("eventType");

  // Remove null / empty / undefined values
  return types.filter(t => t && t.trim());
}

// -----------------------------
// Get distinct boroughs
// -----------------------------
export async function getDistinctBoroughs() {
  const eventCollection = await events();
  const boroughs = await eventCollection.distinct("eventBorough");

  return boroughs.filter(b => b && b.trim());
}