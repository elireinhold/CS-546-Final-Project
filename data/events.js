import { events } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import helpers from "../helpers/eventHelpers.js";
import { users } from "../config/mongoCollections.js";

//NYCevents
function formatDateTime(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d)) return null;
  return d.toISOString().replace("T", " ").split(".")[0];
}

export function normalizeNYCEvent(rawEvent) {
  return {
    eventId: rawEvent.event_id || null,
    eventName: rawEvent.event_name || "Unnamed Event",
    startDateTime: formatDateTime(rawEvent.start_date_time) || null,
    endDateTime: formatDateTime(rawEvent.end_date_time) || null,
    eventSource: "NYC",
    eventType: rawEvent.event_type || null,
    eventBorough: rawEvent.event_borough || null,
    eventLocation: rawEvent.event_location || null,
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

export async function insertManyNYCEvents(eventArray) {
  if (!Array.isArray(eventArray)) {
    throw "insertManyNYCEvents: argument must be an array";
  }
  const eventCollection = await events();
  const result = await eventCollection.insertMany(eventArray);
  return result.insertedCount;
}

export async function clearNYCEvents() {
  const eventCollection = await events();
  return await eventCollection.deleteMany({ eventSource: "NYC" });
}

//eventsDetails
export async function getEventById(id) {
  const eventCollection = await events();

  if (!ObjectId.isValid(id)) throw "Invalid event ID";

  const event = await eventCollection.findOne({ _id: new ObjectId(id) });
  if (!event) throw "Event not found";

  return event;
}

// eventsSearch
export async function searchEvents({
  keyword,
  borough,
  eventType,
  startDate,
  endDate,
  page = 1,
}) {
  const eventCollection = await events();

  let all = await eventCollection.find({}).toArray();

  if (keyword && keyword.trim()) {
    const lower = keyword.trim().toLowerCase();
    all = all.filter(
      (evt) => evt.eventName && evt.eventName.toLowerCase().includes(lower)
    );
  }

  if (
    Array.isArray(borough) &&
    borough.length > 0 &&
    !borough.includes("all")
  ) {
    all = all.filter((evt) => borough.includes(evt.eventBorough));
  }
  if (
    Array.isArray(eventType) &&
    eventType.length > 0 &&
    !eventType.includes("all")
  ) {
    all = all.filter((evt) => eventType.includes(evt.eventType));
  }

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate + "T00:00:00") : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null;

    all = all.filter((evt) => {
      const evtDate = new Date(evt.startDateTime);
      if (isNaN(evtDate)) return false;

      if (start && evtDate < start) return false;
      if (end && evtDate > end) return false;
      return true;
    });
  }

  const pageSize = 50;
  const totalEvents = all.length;
  const totalPages = Math.ceil(totalEvents / pageSize) || 1;

  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;

  const results = all.slice(startIdx, endIdx);

  return {
    results,
    totalEvents,
    totalPages,
    currentPage: safePage,
  };
}

export async function getDistinctEventTypes() {
  const eventCollection = await events();
  const types = await eventCollection.distinct("eventType");
  return types.filter((t) => t && t.trim());
}

export async function getDistinctBoroughs() {
  const eventCollection = await events();
  const boroughs = await eventCollection.distinct("eventBorough");

  return boroughs.filter((b) => b && b.trim());
}

// eventsRecommendations
export async function getRecommendedEventsForUser(userId, limit = 5) {
  const userCollection = await users();
  const eventCollection = await events();

  userId = await helpers.validUserId(userId);
  const user = await userCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) throw "User not found";

  const savedIds = (user.savedEvents || []).map((id) => id.toString());
  const now = new Date();

  const allEvents = await eventCollection.find({}).toArray();

  const futureEvents = allEvents.filter((evt) => {
    const dt = new Date(evt.startDateTime);

    return dt > now && !savedIds.includes(evt._id.toString());
  });

  const savedEventsDocs = allEvents.filter((evt) =>
    savedIds.includes(evt._id.toString())
  );

  const typeCount = {};
  const boroughCount = {};

  for (const evt of savedEventsDocs) {
    if (evt.eventType) {
      typeCount[evt.eventType] = (typeCount[evt.eventType] || 0) + 1;
    }
    if (evt.eventBorough) {
      boroughCount[evt.eventBorough] =
        (boroughCount[evt.eventBorough] || 0) + 1;
    }
  }

  const maxType = Math.max(0, ...Object.values(typeCount));
  const frequentTypes = Object.keys(typeCount).filter(
    (t) => typeCount[t] === maxType
  );

  const maxBorough = Math.max(0, ...Object.values(boroughCount));
  const frequentBoroughs = Object.keys(boroughCount).filter(
    (b) => boroughCount[b] === maxBorough
  );

  const scored = futureEvents.map((evt) => {
    let score = 0;

    if (user.favoriteEventType && evt.eventType === user.favoriteEventType) {
      score += 2;
    }

    if (user.homeBorough && evt.eventBorough === user.homeBorough) {
      score += 2;
    }

    if (frequentTypes.includes(evt.eventType)) {
      score += 1;
    }

    if (frequentBoroughs.includes(evt.eventBorough)) {
      score += 1;
    }

    return { evt, score };
  });

  scored.sort((a, b) => b.score - a.score);

  let recommendations = scored.slice(0, limit).map((s) => s.evt);

  if (recommendations.length < limit) {
    const missing = limit - recommendations.length;

    const notPicked = futureEvents.filter(
      (evt) =>
        !recommendations.some((r) => r._id.toString() === evt._id.toString())
    );

    notPicked.sort(() => Math.random() - 0.5);

    recommendations = [...recommendations, ...notPicked.slice(0, missing)];
  }

  return recommendations;
}

// EventsCreate
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
    eventSource: `User Created: ${id.username}`,
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

// eventsComments
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

const exportedMethods = {
  normalizeNYCEvent,
  insertManyNYCEvents,
  getEventById,
  searchEvents,
  getDistinctEventTypes,
  getDistinctBoroughs,
  userCreateEvent,
  addComment,
  deleteComment,
  getRecommendedEventsForUser,
};

export default exportedMethods;
