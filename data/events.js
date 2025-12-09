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
    eventLocation: rawEvent.event_location || rawEvent.site_location || null,
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

// Add comment or reply to event (parentId is null for top-level comments)
export async function addComment(
  eventId,
  userId,
  username,
  commentText,
  parentId = null
) {
  if (!ObjectId.isValid(eventId)) throw "Invalid event ID";
  if (!ObjectId.isValid(userId)) throw "Invalid user ID";
  if (!commentText || !commentText.trim()) throw "Comment text is required";
  if (parentId && !ObjectId.isValid(parentId)) throw "Invalid parent ID";

  const eventCollection = await events();
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
  if (!event) throw "Event not found";

  // If parentId is provided, verify parent comment exists
  if (parentId) {
    const parentComment = event.comments.find(
      (c) => c._id.toString() === parentId
    );
    if (!parentComment) throw "Parent comment not found";
  }

  const comment = {
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    username: username,
    text: commentText.trim(),
    createdAt: new Date(),
    parentId: parentId ? new ObjectId(parentId) : null,
  };

  const result = await eventCollection.updateOne(
    { _id: new ObjectId(eventId) },
    { $push: { comments: comment } }
  );

  if (result.matchedCount === 0) throw "Event not found";
  return comment;
}

// Delete comment or reply from event (supports any level)
export async function deleteComment(eventId, commentId, userId) {
  if (!ObjectId.isValid(eventId)) throw "Invalid event ID";
  if (!ObjectId.isValid(commentId)) throw "Invalid comment ID";
  if (!ObjectId.isValid(userId)) throw "Invalid user ID";

  const eventCollection = await events();
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
  if (!event) throw "Event not found";

  const comment = event.comments.find((c) => c._id.toString() === commentId);
  if (!comment) throw "Comment not found";
  if (comment.userId.toString() !== userId)
    throw "You can only delete your own comments";

  // Collect all IDs to delete (comment + all its descendants)
  const idsToDelete = new Set();

  const collectChildren = (parentId) => {
    idsToDelete.add(parentId);
    const children = event.comments.filter(
      (c) => c.parentId && c.parentId.toString() === parentId
    );
    children.forEach((child) => collectChildren(child._id.toString()));
  };

  collectChildren(commentId);

  // Delete all collected comments in one operation
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(eventId) },
    {
      $pull: {
        comments: {
          _id: { $in: Array.from(idsToDelete).map((id) => new ObjectId(id)) },
        },
      },
    }
  );

  if (result.modifiedCount === 0) throw "Failed to delete comment";
  return { deleted: true };
}

// Gets all events user saved
export async function getAllEventsByUser(userId) {
  if (!userId) throw "You must provide a user ID";
  const eventCollection = await events();
  const eventData = await eventCollection.find({ userId }).toArray();

  return eventData.map((event) => ({
    title: event.title,
    date: event.date,
    eventId: event._id.toString(),
  }));
}

// Gets all events in database
export async function getAllEvents() {
  const eventCollection = await events();
  return await eventCollection.find({}).toArray();
}
