import { Router } from "express";
import { getRecommendedEventsForUser } from "../data/events.js";
import { getAllSavedEventsWithCoordinates } from "../data/map.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    let recommendedEvents = [];
    let eventLocation = [];

    if (req.session.user) {
      const userId = req.session.user._id;      
      recommendedEvents = await getRecommendedEventsForUser(userId, 5);
      eventLocation = await getAllSavedEventsWithCoordinates(userId);
    } 

    res.render("home", {
      recommendedEvents,
      eventLocation
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


export default router;
