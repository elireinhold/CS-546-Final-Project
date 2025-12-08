import { events } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

// Normalize NYC data; borough abbreviations map
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
export async function searchEvents({ keyword, borough, eventType, startDate, endDate }) {
  const eventCollection = await events();
  const query = {};

  // Keyword search (case-insensitive)
  if (keyword && keyword.trim()) {
    query.eventName = { $regex: keyword.trim(), $options: "i" };
  }

  // Borough multi-select array
  if (Array.isArray(borough) && borough.length > 0 && !borough.includes("all")) {
    query.eventBorough = { $in: borough };
  }

  // EventType multi-select array
  if (Array.isArray(eventType) && eventType.length > 0 && !eventType.includes("all")) {
    query.eventType = { $in: eventType };
  }

  // Date range inclusive; convert stored startDateTime to Date
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
  return types.filter(t => t && t.trim());
}

// Get distinct boroughs
export async function getDistinctBoroughs() {
  const eventCollection = await events();
  const boroughs = await eventCollection.distinct("eventBorough");

  return boroughs.filter(b => b && b.trim());
}

// Add comment to event
export async function addComment(eventId, userId, username, commentText) {
  if (!ObjectId.isValid(eventId)) throw "Invalid event ID";
  if (!ObjectId.isValid(userId)) throw "Invalid user ID";
  if (!commentText || !commentText.trim()) throw "Comment text is required";

  const eventCollection = await events();
  const comment = {
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    username: username,
    text: commentText.trim(),
    createdAt: new Date()
  };

  const result = await eventCollection.updateOne(
    { _id: new ObjectId(eventId) },
    { $push: { comments: comment } }
  );

  if (result.matchedCount === 0) throw "Event not found";
  return comment;
}

// Delete comment from event
export async function deleteComment(eventId, commentId, userId) {
  if (!ObjectId.isValid(eventId)) throw "Invalid event ID";
  if (!ObjectId.isValid(commentId)) throw "Invalid comment ID";
  if (!ObjectId.isValid(userId)) throw "Invalid user ID";

  const eventCollection = await events();
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
  if (!event) throw "Event not found";

  const comment = event.comments.find(c => c._id.toString() === commentId);
  if (!comment) throw "Comment not found";
  if (comment.userId.toString() !== userId) throw "You can only delete your own comments";

  const result = await eventCollection.updateOne(
    { _id: new ObjectId(eventId) },
    { $pull: { comments: { _id: new ObjectId(commentId) } } }
  );

  if (result.modifiedCount === 0) throw "Failed to delete comment";
  return { deleted: true };
}