import { events } from "../config/mongoCollections.js";
import { ObjectId, ReturnDocument } from "mongodb";
import helpers from "../helpers/eventHelpers.js";
import { users } from "../config/mongoCollections.js";

// NYCevents
export function normalizeNYCEvent(rawEvent) {
  return {
    eventId: rawEvent.event_id || null,
    eventName: rawEvent.event_name || "Unnamed Event",
    startDateTime: rawEvent.start_date_time ? new Date(rawEvent.start_date_time) : null,
    endDateTime: rawEvent.end_date_time ? new Date(rawEvent.end_date_time) : null,
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
    keyword = helpers.validKeyword(keyword);

    const lower = keyword.toLowerCase();
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

  // Validate dates if provided
  if (startDate || endDate) {
    if (startDate) {
      const start = new Date(startDate + "T00:00:00");
      if (isNaN(start.getTime())) {
        throw "Invalid start date format.";
      }
    }
    if (endDate) {
      const end = new Date(endDate + "T23:59:59");
      if (isNaN(end.getTime())) {
        throw "Invalid end date format.";
      }
    }
    if (startDate && endDate) {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");
      if (start > end) {
        throw "Start date cannot be after end date.";
      }
    }
    
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
  id, 
  eventName,
  eventType,
  eventLocation,
  eventBorough,
  startDateTimestr,
  endDateTimestr,
  streetClosureType,
  isPublic
) {
  if (!streetClosureType) {
    streetClosureType = null;
  } else {
    streetClosureType = helpers.validStreetClosure(streetClosureType);
  }

  eventName = helpers.validEventName(eventName);
  eventType = helpers.validEventType(eventType);
  eventLocation = helpers.validLocation(eventLocation);
  eventBorough = helpers.validBorough(eventBorough);
  isPublic = helpers.validPublicity(isPublic);
  id = await helpers.validUserId(id);

  // startDateTime = helpers.validDateTime(startDateTimestr);
  // endDateTime = helpers.validDateTime(endDateTimestr);
  helpers.validStartEndTimeDate(startDateTimestr, endDateTimestr);

  const usersCollection = await users();
  const user = await usersCollection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    throw "Error: User not found";
  }

  const startDateTimeNY = new Date(new Date(startDateTimestr).getTime() - 5 * 60 * 60 * 1000);
  const endDateTimeNY = new Date(new Date(endDateTimestr).getTime() - 5 * 60 * 60 * 1000);

  const username = user.username;
  const newEvent = {
    eventId: null,
    eventName: eventName,
    startDateTime: startDateTimeNY,
    endDateTime: endDateTimeNY,
    eventSource: `User Created: ${username}`,
    eventType: eventType,
    eventBorough: eventBorough,
    eventLocation: eventLocation,
    eventStreetSide: null,
    streetClosureType: streetClosureType,
    communityBoard: null,
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

  // insert into user made events
  if(isPublic) {
    usersCollection.updateOne(
      {"_id": new ObjectId(id)},
      {$push: {"publicEvents":insertInfo.insertedId}}
    )
  } else {
    usersCollection.updateOne(
      {"_id": new ObjectId(id)},
      {$push: {"personalEvents":insertInfo.insertedId}}
    )
  }

  return {
    registrationCompleted: true,
    eventId: insertInfo.insertedId.toString(),
  };
}

export async function editEvent(
  eventId,
  userId,
  eventName,
  eventType,
  eventLocation,
  eventBorough,
  startDateTime,
  endDateTime,
  streetClosureType,
  isPublic
) {

  userId = await helpers.validUserId(userId);
  eventId = await helpers.validEventId(eventId);

  eventName = helpers.validEventName(eventName);
  eventType = helpers.validEventType(eventType);
  eventLocation = helpers.validLocation(eventLocation);
  eventBorough = helpers.validBorough(eventBorough);
  startDateTime = helpers.validDateTime(startDateTime,'Start');
  endDateTime = helpers.validDateTime(endDateTime, 'End');
  helpers.validStartEndTimeDate(startDateTime,endDateTime);
  streetClosureType = helpers.validStreetClosure(streetClosureType);
  isPublic = helpers.validPublicity(isPublic);

  const eventInfo = {eventName,eventType,eventLocation,eventBorough,startDateTime,endDateTime,streetClosureType,isPublic};

  const eventCollection = await events();
  const event = await eventCollection.findOne(
    {_id: new ObjectId(eventId)},
    {projection: {userIdWhoCreatedEvent:1}}
  )

  if(!event) throw "Error: Could not edit event";

  if(event.userIdWhoCreatedEvent !== userId) throw "Error: User cannot edit this event";

  const updatedEvent = await eventCollection.findOneAndUpdate(
    {_id: new ObjectId(eventId)},
    {$set: eventInfo},
    {returnDocument: 'after'}
  );

  if(!updatedEvent) throw "Error: Could not edit event";

  return {edited:true};

}

export async function deleteEvent(eventId,userId) {
  eventId = await helpers.validEventId(eventId);
  userId = await helpers.validUserId(userId);

  const eventCollection = await events();
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
  if (!event) throw "Could not find event to delete";

  if(event.userIdWhoCreatedEvent) {
    if(event.userIdWhoCreatedEvent !== userId) throw 'You can only delete your own events.'
  }
  else {
    throw 'Cannot delete non-user created events.';
  }
  
  const removedEvent = await eventCollection.findOneAndDelete({_id: new ObjectId(eventId)});
  if(!removedEvent) throw "Could not delete event";

  // REMOVE EVENTS FROM PUBLIC or PERSONAL EVENTS

  return {deleted:true};
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
  commentText = helpers.validCommentText(commentText);
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

  const newComment = {
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    username: username,
    text: commentText.trim(),
    createdAt: new Date(),
    parentId: parentId ? new ObjectId(parentId) : null,
  };

  event.comments.push(newComment);

  const updated = await eventCollection.replaceOne(
    { _id: new ObjectId(eventId) },
    event
  );

  if (!updated.matchedCount) throw "Could not update event";

  return newComment;
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
  const idsToRemove = new Set();

  function collect(id) {
    idsToRemove.add(id);
    event.comments.forEach(c => {
      if (c.parentId && c.parentId.toString() === id) {
        collect(c._id.toString());
      }
    });
  }

  collect(commentId);

  event.comments = event.comments.filter(
    c => !idsToRemove.has(c._id.toString())
  );

  const updated = await eventCollection.replaceOne(
    { _id: new ObjectId(eventId) },
    event
  );

  if (!updated.modifiedCount) throw "Failed to delete comment";

  return { deleted: true };
}


// Gets all events in the database
export async function getAllEvents() {
  const eventCollection = await events();

  const allEvents = await eventCollection.find({}).toArray();

  return allEvents.map(event => ({
    ...event,
    _id: event._id.toString(),
  }));
}

// Gets all events in the specified borough
export async function getEventsByBorough(borough) {
  const eventCollection = await events();
  
  const eventsInBorough = await eventCol.find({eventBorough: borough}).toArray();

  return eventsInBorough.map(e => ({ ...e, _id: e._id.toString() }));
}

const exportedMethods = {
  normalizeNYCEvent,
  insertManyNYCEvents,
  getEventById,
  searchEvents,
  getDistinctEventTypes,
  getDistinctBoroughs,
  userCreateEvent,
  deleteEvent,
  editEvent,
  addComment,
  deleteComment,
  getRecommendedEventsForUser,
  getAllEvents,
  getEventsByBorough
};

export default exportedMethods;
