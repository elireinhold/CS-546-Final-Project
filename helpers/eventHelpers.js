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
  validKeyword(keyword) {
    if (typeof keyword !== "string") {
      throw "Error: Event name must be a string.";
    }
    keyword = keyword.trim();
    if (keyword.length < 2) {
      throw "Error: Event name must be at least 2 characters long.";
    }
    return keyword;
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
    if (!eventLocation || !(eventLocation.trim())) {
      throw "Error: Must provide an event location.";
    }
    if (typeof eventLocation !== "string") {
      throw "Error: eventLocation must be a string.";
    }
    eventLocation = eventLocation.trim()
    return eventLocation;
  },
  // Validate event coordinayes: Eli To Do
  // input coordinate array
  validCoordinates(coordinates) {
    if (!Array.isArray(arr) || arr.length !== 2) {
      throw "Error: Input must be an array of two numbers: [longitude, latitude]";
    }
    const [lng, lat] = arr;
    if (typeof lng !== "number" || typeof lat !== "number") {
      throw "Error: Both values in the array must be numbers";
    }
    if (lng < -180 || lng > 180) {
      throw "Error: Longitude must be between -180 and 180";
    }
    if (lat < -90 || lat > 90) {
      throw "Error: Latitude must be between -90 and 90";
    }
    // Format for Geospace search
    return {
      type: "Point",
      coordinates: [lng, lat]
    };
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
  // SYNC WITH CLIENT
  validPublicity(publicity) {
    if(typeof publicity === 'boolean') return publicity;
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
  // Changes publicity from a bool to a string.
  publicityString(isPublic) {
    if(typeof isPublic !== 'boolean') throw "Error: isPublic must be a boolean.";
    return isPublic ? 'public' : 'private';
  },
  //Validates that street closure is valid format. Returns closure.trim()
  validStreetClosure(closure) {
    if(closure) { // optional
      if (typeof closure !== "string") {
        throw "Error: Street closure must be a string.";
      }
      closure = closure.trim();
      if (closure.length < 4) {
        throw "Error: Street closure infromation must be atleast 4 character long.";
      }
      return closure;
    }
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
  // Validates that startDateTime or endDateTime format [2025-11-15T09:00:00.000]. Date must be real date, time must be real time. Return validiated time.
  validDateTime(dateTime) {
    if (!dateTime) throw "Error: Must provide date/time";

    const d = new Date(dateTime);
    if (isNaN(d.getTime())) throw "Error: Date/Time must be valid";

    // Return a proper Date object instead of string
    return d;
  },

  // Validates that startDateTime occurs before endDateTime. Returns True if no error.
  validStartEndTimeDate(startDateTime, endDateTime) {
    if(!startDateTime) throw "Error: Must provide start date/time";
    if(!endDateTime) throw "Error: Must provide end date/time";
    const sd = new Date(exportedMethods.validDateTime(startDateTime));
    const ed = new Date(exportedMethods.validDateTime(endDateTime));
    if(sd >= ed) throw "Error: Start date/time must occur before end date/time"
    return true;
  },
  async validUserId(id) {
    // id = exportedMethods.checkId(id);

    // const usersCollection = await users();
    // const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    // if (!user) {
    //   throw "Error: No user with that id";
    // }
    // return id;
      if (!id || typeof id !== "string") throw "userId must be a string";
      id = id.trim();
      if (id.length === 0) throw "userId cannot be empty";
    
      // 2. must be objectId string
      if (!ObjectId.isValid(id)) throw "userId is not a valid ObjectId";
    
      // 3. check existence in DB
      const usersCollection = await users();
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (!user) throw "User not found";
    
      // always return string form
      return id;
  },
  async validId(id, varName) {
    if (!id) throw `${varName} is required`;
    if (typeof id !== "string") throw `${varName} must be a string`;
    id = id.trim();
    if (id.length === 0) throw `${varName} cannot be empty`;
    if (!ObjectId.isValid(id)) throw `${varName} is not a valid ObjectId`;
    return id;
  },
  async formatDateTime(dt) {
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d)) return null;
    return d.toISOString().replace("T", " ").split(".")[0];
  },
 async validateDateMMDDYYYY(dateStr) {
  if (!dateStr) return null;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    throw "Date must be in mm/dd/yyyy format";
  }
  const [mm, dd, yyyy] = dateStr.split("/").map(Number);

  if (mm < 1 || mm > 12) throw "Invalid month in date";
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);

  if (isNaN(d.getTime())) throw "Invalid date";

  if (
    d.getUTCFullYear() !== yyyy ||
    d.getUTCMonth() + 1 !== mm ||
    d.getUTCDate() !== dd
  ) {
    throw "Invalid calendar date";
  }

  return dateStr;
}
}

export default exportedMethods;
