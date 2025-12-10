    import { events } from "../../config/mongoCollections.js";
    import { users } from "../../config/mongoCollections.js";
    import { ObjectId } from "mongodb";

    export async function getRecommendedEventsForUser(userId, limit = 5) {
    const userCollection = await users();
    const eventCollection = await events();

    const user = await userCollection.findOne({ _id: ObjectId(userId) });
    if (!user) throw "User not found";

    const savedEvents = user.savedEvents || [];
    if (savedEvents.length === 0) {
    return await eventCollection
        .aggregate([
        { $match: { startDateTime: { $gte: new Date().toISOString() } } },
        { $sample: { size: limit } }
        ]).toArray();
    }
    const lastFiveIds = savedEvents.slice(-5).map(id => new ObjectId(id));
    const lastFiveEvents = await eventCollection
    .find({ _id: { $in: lastFiveIds } })
    .toArray();
    const boroughCounts = {};
    const typeCounts = {};
    lastFiveEvents.forEach(evt => {
    if (evt.eventBorough)
        boroughCounts[evt.eventBorough] =
        (boroughCounts[evt.eventBorough] || 0) + 1;
    if (evt.eventType)
        typeCounts[evt.eventType] =
        (typeCounts[evt.eventType] || 0) + 1;
    });
    const most = obj =>
    Object.keys(obj).sort((a, b) => obj[b] - obj[a])[0];
    const favoriteBorough = most(boroughCounts);
    const favoriteType = most(typeCounts);
    const now = new Date().toISOString();
    const candidates = await eventCollection
    .find({
        _id: { $nin: savedEvents.map(id => new ObjectId(id)) },
        startDateTime: { $gte: now }
    })
    .toArray();
    const scored = candidates.map(evt => {
    let score = 0;
    if (evt.eventBorough === favoriteBorough) score++;
    if (evt.eventType === favoriteType) score++;
    return { evt, score };
    });
    scored.sort((a, b) => b.score - a.score);
    let recommendations = scored
    .filter(s => s.score > 0)
    .slice(0, limit)
    .map(s => s.evt);
    if (recommendations.length < limit) {
    const missingCount = limit - recommendations.length;
    const randomFiller = await eventCollection
        .aggregate([
        { $match: { 
            startDateTime: { $gte: now },
            _id: { $nin: [...savedEvents.map(id => new ObjectId(id)), ...recommendations.map(r => r._id)] }
        }},
        { $sample: { size: missingCount } }
        ])
        .toArray();

    recommendations = [...recommendations, ...randomFiller];
    }

    return recommendations;
    }
