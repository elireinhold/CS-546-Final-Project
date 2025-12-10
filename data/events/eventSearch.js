import { events } from "../../config/mongoCollections.js";

export async function searchEvents({ keyword, borough, eventType, startDate, endDate }) {
  const eventCollection = await events();
  const query = {};

  if (keyword && keyword.trim())
    query.eventName = { $regex: keyword.trim(), $options: "i" };

  if (Array.isArray(borough) && borough.length && !borough.includes("all"))
    query.eventBorough = { $in: borough };

  if (Array.isArray(eventType) && eventType.length && !eventType.includes("all"))
    query.eventType = { $in: eventType };

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
    query.$expr = { $and: [{ $ne: [dateValue, null] }, ...dateExpr] };
  }

  return await eventCollection.find(query).limit(200).toArray();
}

export async function getDistinctEventTypes() {
  const col = await events();
  return (await col.distinct("eventType")).filter(t => t && t.trim());
}

export async function getDistinctBoroughs() {
  const col = await events();
  return (await col.distinct("eventBorough")).filter(b => b && b.trim());
}