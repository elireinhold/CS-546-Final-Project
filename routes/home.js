import { Router } from "express";
import { getRecommendedEventsForUser } from "../data/events.js";
import { getAllSavedEventsWithCoordinates } from "../data/map.js";
import helpers from "../helpers/eventHelpers.js"
const router = Router();
import xss from "xss";

router.get("/", async (req, res) => {
  try {
    let recommendedEvents = [];
    let eventLocation = [];

    if (req.session.user) {
      const userId = req.session.user._id   
      recommendedEvents = await getRecommendedEventsForUser(userId, 5);
      eventLocation = await getAllSavedEventsWithCoordinates(userId);
    } 

    res.render("home", {
      recommendedEvents,
      eventLocation
    });

  } catch (e) {
    let errMsg;
    if(e.message) {
      errMsg = e.message;
    } else {
      errMsg = e;
    }
    res.status(500).json({ error: errMsg });
  }
});


export default router;
