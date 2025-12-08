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

// Search events (multi-filter)
router.get("/search", async (req, res) => {
  try {
    let { keyword, borough, eventType, startDate, endDate } = req.query;

    // Always convert to arrays
    if (!borough) borough = [];
    else if (!Array.isArray(borough)) borough = [borough];

    if (!eventType) eventType = [];
    else if (!Array.isArray(eventType)) eventType = [eventType];

    const eventTypes = await getDistinctEventTypes();
    const boroughs = await getDistinctBoroughs();
    eventTypes.sort();
    boroughs.sort();

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return res.status(400).render("search", {
        keyword: keyword || "",
        borough,
        eventType,
        startDate,
        endDate,
        results: [],
        eventTypes,
        boroughs,
        currentUrl: req.originalUrl,
        error: "Start date cannot be after end date"
      });
    }

    const results = await searchEvents({
      keyword,
      borough,
      eventType,
      startDate,
      endDate
    });

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
      borough,
      eventType,
      startDate,
      endDate,
      results,
      eventTypes,
      boroughs,
      currentUrl: req.originalUrl // ⭐ returnTo
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Save event
router.post("/:id/save", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    await saveEvent(req.session.user._id, eventId);

    const userCount = await countUsersWhoSaved(eventId);

    return res.json({ saved: true, userCount });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unsave event
router.post("/:id/unsave", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    await unsaveEvent(req.session.user._id, eventId);

    const userCount = await countUsersWhoSaved(eventId);

    return res.json({ saved: false, userCount });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Event details
router.get("/:id", async (req, res) => {
  try {
    const event = await getEventById(req.params.id);

    let saved = false;
    if (req.session.user) {
      const savedList = await getSavedEvents(req.session.user._id);
      saved = savedList.map(x => x.toString()).includes(req.params.id);
    }

    const userCount = await countUsersWhoSaved(req.params.id);

    res.render("eventDetails", {
      event,
      saved,
      userCount,
      returnTo: req.query.returnTo || "/events/search"
    });

  } catch (e) {
    res.status(404).send("Event not found");
  }
});

export default router;