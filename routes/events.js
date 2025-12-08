import { Router } from "express";

import { 
  searchEvents, 
  getDistinctEventTypes, 
  getDistinctBoroughs,
  getEventById
} from "../data/events.js";

import { 
  saveEvent, 
  unsaveEvent, 
  getSavedEvents,
  countUsersWhoSaved,
  countUsersWhoSavedMany
} from "../data/users.js";

import { requireLogin } from "../middleware.js";

const router = Router();

/* -----------------------------
   SEARCH EVENTS (multi-filter)
------------------------------ */
router.get("/search", async (req, res) => {
  try {
    const { keyword, borough, eventType } = req.query;

    const eventTypes = await getDistinctEventTypes();
    const boroughs = await getDistinctBoroughs();

    eventTypes.sort();
    boroughs.sort();

    const results = await searchEvents({ keyword, borough, eventType });

    let savedList = [];
    if (req.session.user) {
      savedList = (await getSavedEvents(req.session.user._id))
        .map(id => id.toString());
    }

    const eventIds = results.map(evt => evt._id.toString());
    const countMap = await countUsersWhoSavedMany(eventIds);

    results.forEach(evt => {
      const id = evt._id.toString();
      evt.saved = savedList.includes(id);
      evt.userCount = countMap[id] || 0;
    });

    res.render("search", {
      keyword: keyword || "",
      borough: borough || "all",
      eventType: eventType || "all",
      results,
      eventTypes,
      boroughs
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/* -----------------------------
   SAVE EVENT — requires login
------------------------------ */
router.post("/:id/save", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    await saveEvent(req.session.user._id, eventId);

    const userCount = await countUsersWhoSaved(eventId.toString());

    return res.json({ 
      saved: true,
      userCount
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/* -----------------------------
   UNSAVE EVENT — requires login
------------------------------ */
router.post("/:id/unsave", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    await unsaveEvent(req.session.user._id, eventId);

    const userCount = await countUsersWhoSaved(eventId.toString());

    return res.json({
      saved: false,
      userCount
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/* -----------------------------
   EVENT DETAILS PAGE
------------------------------ */
router.get("/:id", async (req, res) => {
  try {
    const event = await getEventById(req.params.id);

    let saved = false;
    if (req.session.user) {
      const savedList = await getSavedEvents(req.session.user._id);
      saved = savedList.map(x => x.toString()).includes(req.params.id);
    }

    const userCount = await countUsersWhoSaved(req.params.id.toString());

    res.render("eventDetails", {
      event,
      saved,
      userCount
    });

  } catch (e) {
    res.status(404).send("Event not found");
  }
});

export default router;