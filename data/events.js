import { events } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import helpers from "../helpers/eventHelpers.js";

// Normalize NYC data; borough abbreviations map
const boroughMap = {
  M: "Manhattan",
  BX: "Bronx",
  BK: "Brooklyn",
  Q: "Queens",
  SI: "Staten Island",
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
    eventStreetSide:
      rawEvent.street_side || rawEvent.street_side_description || null,
    streetClosureType: rawEvent.street_closure_type || null,
    communityBoard: rawEvent.community_board || null,
    coordinates: rawEvent.coordinates || null,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };
}

// Insert NYC events
export async function insertManyNYCEvents(eventArray) {
  if (!Array.isArray(eventArray)) {
    throw "insertManyNYCEvents: argument must be an array";
  }

  const eventCollection = await events();
  const result = await eventCollection.insertMany(eventArray);
  return result.insertedCount;
}

// Clear NYC events
export async function clearNYCEvents() {
  const eventCollection = await events();
  return await eventCollection.deleteMany({ eventSource: "NYC" });
}

// Get one event
export async function getEventById(id) {
  const eventCollection = await events();

  if (!ObjectId.isValid(id)) throw "Invalid event ID";

  const event = await eventCollection.findOne({ _id: new ObjectId(id) });
  if (!event) throw "Event not found";

  return event;
}

// Search events with keyword/borough/type/date range
export async function searchEvents({
  keyword,
  borough,
  eventType,
  startDate,
  endDate,
}) {
  const eventCollection = await events();
  const query = {};

  // Keyword search (case-insensitive)
  if (keyword && keyword.trim()) {
    query.eventName = { $regex: keyword.trim(), $options: "i" };
  }

  // Borough multi-select array
  if (
    Array.isArray(borough) &&
    borough.length > 0 &&
    !borough.includes("all")
  ) {
    query.eventBorough = { $in: borough };
  }

  // EventType multi-select array
  if (
    Array.isArray(eventType) &&
    eventType.length > 0 &&
    !eventType.includes("all")
  ) {
    query.eventType = { $in: eventType };
  }

  // Date range inclusive; convert stored startDateTime to Date
  const dateExpr = [];
  const dateValue = {
    $convert: {
      input: "$startDateTime",
      to: "date",
      onError: null,
      onNull: null,
    },
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
    // Ensure converted date is not null
    query.$expr = { $and: [{ $ne: [dateValue, null] }, ...dateExpr] };
  }

  return await eventCollection.find(query).limit(200).toArray();
}

// Get distinct event types
export async function getDistinctEventTypes() {
  const eventCollection = await events();
  const types = await eventCollection.distinct("eventType");

  // Remove null / empty / undefined values
  return types.filter((t) => t && t.trim());
}

// Get distinct boroughs
export async function getDistinctBoroughs() {
  const eventCollection = await events();
  const boroughs = await eventCollection.distinct("eventBorough");

  return boroughs.filter((b) => b && b.trim());
}

// Called when user submits a create event form. Validates input, creates event, and adds it to the database.
export async function userCreateEvent(
  id, //mongoDB _id of user who created the event
  eventName,
  eventType,
  eventLocation,
  eventBorough,
  startDateTime,
  endDateTime,
  streetClosureType,
  communityBoard,
  isPublic
) {
  // Optional Fields
  if (!streetClosureType) {
    streetClosureType = null;
  } else {
    streetClosureType = helpers.validStreetClosure(streetClosureType);
  }

  if (!communityBoard) {
    communityBoard = null;
  } else {
    communityBoard = helpers.validCommunityBoard(communityBoard);
  }

  //Required input validation
  eventName = helpers.validEventName(eventName);
  eventType = helpers.validEventType(eventType);
  eventLocation = helpers.validLocation(eventLocation);
  eventBorough = helpers.validBorough(eventBorough);
  isPublic = helpers.validPublicity(isPublic);
  id = await helpers.validUserId(id);

  startDateTime = helpers.validDateTime(startDateTime);
  endDateTime = helpers.validDateTime(endDateTime);
  helpers.validStartEndTimeDate(startDateTime, endDateTime);

  const newEvent = {
    eventId: null,
    eventName: eventName,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    eventSource: `User Created: ${id}`,
    eventType: eventType,
    eventBorough: eventBorough,
    eventLocation: eventLocation,
    eventStreetSide: null,
    streetClosureType: streetClosureType,
    communityBoard: communityBoard,
    coordinates: null,
    userIdWhoCreatedEvent: id,
    isPublic: isPublic,
    createdAt: new Date(),
    updatedAt: null,
    comments: [],
  };

  const eventCollection = await events();
  const insertInfo = await eventCollection.insertOne(newEvent);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw "Error: Could not add event.";
  }
  return { registrationCompleted: true };
}

const exportedMethods = {
  normalizeNYCEvent,
  insertManyNYCEvents,
  getEventById,
  searchEvents,
  getDistinctEventTypes,
  getDistinctBoroughs,
  userCreateEvent,
};

export default exportedMethods;
