import { Router } from "express";
import { getRecommendedEventsForUser } from "../data/events.js";
import { getSavedEvents } from "../data/users.js";
import { getAllSavedEventsWithCoordinates } from "../data/homeMap.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    let recommended = [];
    let savedEventCount = 0;
     
    if (req.session.user) {
      const userId = req.session.user._id;
      const savedEvents = await getSavedEvents(userId);
      savedEventCount = savedEvents.length;
      recommended = await getRecommendedEventsForUser(userId, 5);
      events = await getAllSavedEventsWithCoordinates(userId);
    } 

    res.render("home", {
      user: req.session.user || null,
      recommendedEvents: recommended,
      savedEventCount,
      events
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


export default router;