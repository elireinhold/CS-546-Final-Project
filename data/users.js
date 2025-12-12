import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";
import helpers from "../helpers/userHelpers.js";
import bcrypt from "bcrypt";

// User input validation. Creates new user and adds them to database. Returns { registrationCompleted: true }
export async function register(
  userName,
  firstName,
  lastName,
  password,
  preferredBorough,
  preferredEventType,
  email,
  birthday
) {
  /* Input Validation */
  //Required Inputs
  if (!firstName) {
    throw "Error: Must provide first name.";
  }
  if (!lastName) {
    throw "Error: must provide last name.";
  }
  userName = await helpers.validUserNameRegister(userName);
  firstName = helpers.validFirstOrLastName(firstName);
  lastName = helpers.validFirstOrLastName(lastName);
  password = helpers.validPassword(password);
  email = await helpers.validEmailServer(email);
  birthday = helpers.validAge(birthday);
  preferredEventType = helpers.validEventType(preferredEventType);

  //Optional Inputs
  if (
    preferredBorough === null ||
    !preferredBorough ||
    preferredBorough.trim() === ""
  ) {
    preferredBorough = null;
  } else {
    preferredBorough = helpers.validBorough(preferredBorough);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    username: userName,
    email: email,
    password: hashedPassword,
    firstName: firstName,
    lastName: lastName,
    homeBorough: preferredBorough,
    favoriteEventTypes: [preferredEventType],
    birthday: birthday,
    savedEvents: [],
    publicEvents: [],
    personalEvents: [],
  };

  const usersCollection = await users();
  const insertInfo = await usersCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw "Error: Could not add user.";
  }
  return { registrationCompleted: true };
}

export async function login(userName, password) {
  userName = await helpers.validUserNameLogin(userName);
  password = helpers.validPassword(password);

  const usersCollection = await users();
  const lowerUserName = userName.toLowerCase();
  const user = await usersCollection.findOne({ username: lowerUserName });
  if (user === null) {
    throw "Error: Either the userId or password is invalid.";
  }

  const storedHashedPassword = user.password;
  const compareToMatch = await bcrypt.compare(password, storedHashedPassword);
  if (!compareToMatch) {
    throw "Error: Either the userId or password is invalid.";
  }

  return user;
}

// Helper: convert string to ObjectId
function toObjectId(id) {
  if (!id || typeof id !== "string") throw new Error("Invalid ID");
  if (!ObjectId.isValid(id)) throw new Error("Invalid ObjectId format");
  return new ObjectId(id);
}

// Save event to savedEvents array
export async function saveEvent(userId, eventId) {
  const userCollection = await users();

  const result = await userCollection.updateOne(
    { _id: toObjectId(userId) },
    { $addToSet: { savedEvents: toObjectId(eventId) } }
  );

  return { saved: result.modifiedCount > 0 };
}

// Unsave event from savedEvents
export async function unsaveEvent(userId, eventId) {
  const userCollection = await users();

  const result = await userCollection.updateOne(
    { _id: toObjectId(userId) },
    { $pull: { savedEvents: toObjectId(eventId) } }
  );

  return { saved: !(result.modifiedCount > 0) };
}

// Get saved events for user
export async function getSavedEvents(userId) {
  const userCollection = await users();

  const user = await userCollection.findOne({ _id: toObjectId(userId) });
  if (!user) throw new Error("User not found");

  return user.savedEvents || [];
}

// Count users who saved one event
export async function countUsersWhoSaved(eventId) {
  const userCollection = await users();

  return await userCollection.countDocuments({
    savedEvents: toObjectId(eventId),
  });
}

// Count users who saved many events (batch)
export async function countUsersWhoSavedMany(eventIds) {
  const userCollection = await users();

  // Convert to ObjectId list
  const objIds = eventIds.map((id) => toObjectId(id));

  // One MongoDB aggregation (fast)
  const pipeline = [
    { $match: { savedEvents: { $in: objIds } } },
    { $unwind: "$savedEvents" },
    { $match: { savedEvents: { $in: objIds } } },
    {
      $group: {
        _id: "$savedEvents",
        count: { $sum: 1 },
      },
    },
  ];

  const results = await userCollection.aggregate(pipeline).toArray();

  // Convert aggregation result to lookup map
  const countMap = {};
  for (const r of results) {
    countMap[r._id.toString()] = r.count;
  }

  // Ensure all eventIds exist in map (even with 0 saves)
  for (const id of eventIds) {
    if (!countMap[id]) countMap[id] = 0;
  }

  return countMap;
}

const exportedMethods = {
  register,
  login,
  saveEvent,
  unsaveEvent,
  countUsersWhoSaved,
  countUsersWhoSavedMany,
  getSavedEvents,
};

export default exportedMethods;
