import express from 'express';
const router = express.Router();
import * as usersData from '../data/users.js';
import { requireLogin } from "../middleware.js";


router.get("/", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const events = await usersData.getSavedEvents(userId);
        
    res.render("calendar", { events });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;