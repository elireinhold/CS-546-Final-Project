import express from 'express';
const router = express.Router();
import * as usersData from '../data/users.js';
import { requireLogin } from "../middleware.js";
import { getEventById } from '../data/events.js'


router.get("/", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const eventIds = await usersData.getSavedEvents(userId);
    // Fetch each event by ID
    const events = [];
    if(eventIds) {
      for (const id of eventIds) {
        const ev = await getEventById(id);
        events.push(ev);
      }
    }
    
    res.render("calendar", { events });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;