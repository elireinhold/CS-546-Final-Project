import { events } from "../../config/mongoCollections.js";
import { ObjectId } from "mongodb";

export async function getEventById(id) {
  if (!ObjectId.isValid(id)) throw "Invalid event ID";

  const col = await events();
  const event = await col.findOne({ _id: new ObjectId(id) });

  if (!event) throw "Event not found";
  return event;
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
  