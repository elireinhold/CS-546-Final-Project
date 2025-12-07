import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";

// -------------------------------
// Helper: Convert string → ObjectId
// -------------------------------
function toObjectId(id) {
  if (!id || typeof id !== "string") throw new Error("Invalid ID");
  if (!ObjectId.isValid(id)) throw new Error("Invalid ObjectId format");
  return new ObjectId(id);
}

/* =====================================================
   SAVE EVENT (adds eventId to savedEvents array)
===================================================== */
export async function saveEvent(userId, eventId) {
  const userCollection = await users();

  const result = await userCollection.updateOne(
    { _id: toObjectId(userId) },
    { $addToSet: { savedEvents: toObjectId(eventId) } }
  );

  return { saved: result.modifiedCount > 0 };
}

/* =====================================================
   UNSAVE EVENT (removes eventId from savedEvents)
===================================================== */
export async function unsaveEvent(userId, eventId) {
  const userCollection = await users();

  const result = await userCollection.updateOne(
    { _id: toObjectId(userId) },
    { $pull: { savedEvents: toObjectId(eventId) } }
  );

  return { saved: !(result.modifiedCount > 0) };
}

/* =====================================================
   GET SAVED EVENTS (returns array of event ObjectIds)
===================================================== */
export async function getSavedEvents(userId) {
  const userCollection = await users();

  const user = await userCollection.findOne({ _id: toObjectId(userId) });
  if (!user) throw new Error("User not found");

  return user.savedEvents || [];
}

/* =====================================================
   COUNT USERS WHO SAVED ONE EVENT
===================================================== */
export async function countUsersWhoSaved(eventId) {
  const userCollection = await users();

  return await userCollection.countDocuments({
    savedEvents: toObjectId(eventId)
  });
}

/* =====================================================
   ⭐ NEW: COUNT USERS WHO SAVED MANY EVENTS (Batch)
   solves N+1 query problem
===================================================== */
export async function countUsersWhoSavedMany(eventIds) {
  const userCollection = await users();

  // Convert to ObjectId list
  const objIds = eventIds.map(id => toObjectId(id));

  // One MongoDB aggregation (fast)
  const pipeline = [
    { $match: { savedEvents: { $in: objIds } } },
    { $unwind: "$savedEvents" },
    { $match: { savedEvents: { $in: objIds } } },
    {
      $group: {
        _id: "$savedEvents",
        count: { $sum: 1 }
      }
    }
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