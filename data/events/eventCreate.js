import { events } from "../../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import helpers from "../../helpers/eventHelpers.js";

export async function userCreateEvent(
  userId,
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
  // Optional fields
  streetClosureType = streetClosureType ? helpers.validStreetClosure(streetClosureType) : null;
  communityBoard = communityBoard ? helpers.validCommunityBoard(communityBoard) : null;

  // Required validations
  userId = await helpers.validUserId(userId);
  eventName = helpers.validEventName(eventName);
  eventType = helpers.validEventType(eventType);
  eventLocation = helpers.validLocation(eventLocation);
  eventBorough = helpers.validBorough(eventBorough);
  isPublic = helpers.validPublicity(isPublic);

  startDateTime = helpers.validDateTime(startDateTime);
  endDateTime = helpers.validDateTime(endDateTime);
  helpers.validStartEndTimeDate(startDateTime, endDateTime);

  const newEvent = {
    eventId: null,
    eventName,
    startDateTime,
    endDateTime,
    eventSource: `User Created: ${userId}`,
    eventType,
    eventBorough,
    eventLocation,
    eventStreetSide: null,
    streetClosureType,
    communityBoard,
    coordinates: null,
    userIdWhoCreatedEvent: userId,
    isPublic,
    createdAt: new Date(),
    updatedAt: null,
    comments: []
  };

  const eventCollection = await events();
  const insertInfo = await eventCollection.insertOne(newEvent);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw "Error: Could not add event.";
  }
  return { registrationCompleted: true };
}
