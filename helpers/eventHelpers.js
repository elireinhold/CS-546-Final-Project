import { events } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";

async function getEvents() {
  const eventCollection = await events();
  const eventList = await eventCollection.find({}).toArray();
  return eventList;
}

const exportedMethods = {
  // Validates that event type is one of the categories from the NYC dataset. CASE-SENSITIVE. Returns trimmed event type. Requires eventType
  validEventType(eventType) {
    if (!eventType) {
      throw "Error: Event type is required.";
    }
    if (typeof eventType !== "string") {
      throw "Error: Event type must be a string.";
    }
    eventType = eventType.trim();

    const eventTypes = [
      "Special Event",
      "Sport - Adult",
      "Sport - Youth",
      "Production Event",
      "Open Street Partner Event",
      "Plaza Partner Event",
      "Street Event",
      "Religious Event",
      "Farmers Market",
      "Sidewalk Sale",
      "Theater Load in and Load Outs",
      "Parade",
      "Miscellaneous",
      "Plaza Event",
      "Block Party",
      "Clean-Up",
    ];

    if (!eventTypes.includes(eventType)) {
      throw "Error: Event type must be valid. The valid event types are: 'Special Event', 'Sport - Adult', 'Sport - Youth', 'Production Event','Open Street Partner Event', 'Plaza Partner Event','Street Event','Religious Event','Farmers Market','Sidewalk Sale','Theater Load in and Load Outs','Parade','Miscellaneous','Plaza Event','Block Party','Clean-Up'";
    }
    return eventType;
  },
  // Validates eventName format. 2 < eventName.length. Returns eventName.trim() Requires eventName
  validEventName(eventName) {
    if (!eventName) {
      throw "Error: Event name is required.";
    }
    if (typeof eventName !== "string") {
      throw "Error: Event name must be a string.";
    }
    eventName = eventName.trim();

    if (eventName.length < 2) {
      throw "Error: Event name must be at least 2 characters long.";
    }
    return eventName;
  },
  // Validate borough format. borough. Return borough with capital first letter
  validBorough(borough) {
    if (typeof borough !== "string") {
      throw "Error: Borough must be a string.";
    }
    borough = borough.trim().toLowerCase();
    const validBoroughs = [
      "manhattan",
      "brooklyn",
      "queens",
      "bronx",
      "staten island",
    ];
    if (!validBoroughs.includes(borough)) {
      throw "Borough must be Manhattan, Brooklyn, Queens, Bronx, or Staten Island";
    }

    if (borough == "staten island") {
      borough = "Staten Island";
    } else {
      borough = borough.charAt(0).toUpperCase() + borough.slice(1);
    }
    return borough;
  },
  // Validate Event Location: Eli To Do
  validLocation(eventLocation) {
    return eventLocation;
  },
  // Validate event coordinayes: Eli To Do
  validCoordinates(coordinates) {
    return coordinates;
  },
  // Validate mongoDB _id field
  checkId(id) {
    if (!id) throw "Error: You must provide an id";
    if (typeof id !== "string") throw "Error: id must be a string";
    id = id.trim();
    if (id.length === 0)
      throw "Error: id cannot be an empty string or just spaces";
    if (!ObjectId.isValid(id)) throw "Error: is must be valid object ID";
    return id;
  },
  // Validates that publicity is either private or public. Case Insensetive. Returns true if public, false if private
  validPublicity(publicity) {
    if (!publicity) {
      throw "Error: Must specify if event is public or private.";
    }
    if (typeof publicity !== "string") {
      throw "Error: Publicity must be a string.";
    }
    publicity = publicity.trim().toLowerCase();
    if (publicity === "private") {
      return false;
    } else if (publicity === "public") {
      return true;
    } else {
      throw "Error: Publicity must be private or public.";
    }
  },
  //Validates that street closure is valid format. Returns closure.trim()
  validStreetClosure(closure) {
    if (typeof closure !== "string") {
      throw "Error: Street closure must be a string.";
    }
    closure = closure.trim();
    if (closure.length < 4) {
      throw "Error: Street closure infromation must be atleast 4 character long.";
    }
    return closure;
  },
  // Validates that communityBoard can be turned into a positve integer. Retuns communityBoard.trim()
  validCommunityBoard(communityBoard) {
    const trimmed = communityBoard.trim();
    const num = parseInt(trimmed);

    if (isNaN(num)) {
      throw "Error: Community board must be a positive integer.";
    }

    if (num < 1 || !Number.isInteger(num)) {
      throw "Error: Community board must be a positive integer.";
    }
    return trimmed;
  },
  // Validates that startDateTime or endDateTime format [2025-11-15T09:00:00.000]. Date must be real date, time must be real time. Return validiated time. RJ TO Do
  validDateTime(dateTime) {
    return dateTime;
  },
  // Validates that startDateTime occurs before endDateTime. Returns True if no error. RJ To Do
  validStartEndTimeDate(startDateTime, endDateTime) {
    return true;
  },
  async validUserId(id) {
    id = exportedMethods.checkId(id);

    const usersCollection = await users();
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      throw "Error: No user with that id";
    }
    return id;
  },
};


export default exportedMethods;
