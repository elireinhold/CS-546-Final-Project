import { Router } from "express";
import events from "../data/events.js";     
import users from "../data/users.js";        
import { requireLogin } from "../middleware.js";
import { getEventWithCoordinates } from "../data/map.js";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    let { keyword, borough, eventType, startDate, endDate } = req.query;

    borough = Array.isArray(borough) ? borough : borough ? [borough] : [];
    eventType = Array.isArray(eventType) ? eventType : eventType ? [eventType] : [];

    const eventTypes = (await events.getDistinctEventTypes()).sort();
    const boroughs = (await events.getDistinctBoroughs()).sort();

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
        error: "Start date cannot be after end date",
        currentUrl: req.originalUrl,
      });
    }

    const results = await events.searchEvents({
      keyword: keyword || "",
      borough,
      eventType,
      startDate,
      endDate,
    });

    let savedList = [];
    if (req.session.user) {
      savedList = (await users.getSavedEvents(req.session.user._id)).map(id => id.toString());
    }

    const eventIds = results.map(e => e._id.toString());
    const countMap = await users.countUsersWhoSavedMany(eventIds);

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
      currentUrl: req.originalUrl,
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/save", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    await users.saveEvent(req.session.user._id, eventId);

    const userCount = await users.countUsersWhoSaved(eventId);
    res.json({ saved: true, userCount });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/unsave", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    await users.unsaveEvent(req.session.user._id, eventId);

    const userCount = await users.countUsersWhoSaved(eventId);
    res.json({ saved: false, userCount });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await events.getEventById(req.params.id);
    const eventLocation = await getEventWithCoordinates(req.params.id);

    let saved = false;
    if (req.session.user) {
      const savedList = await users.getSavedEvents(req.session.user._id);
      saved = savedList.map(x => x.toString()).includes(req.params.id);
    }

    const userCount = await users.countUsersWhoSaved(req.params.id);

    res.render("eventDetails", {
      event,
      eventLocation,
      saved,
      userCount,
      returnTo: req.query.returnTo || "/events/search",
    });

  } catch (e) {
    res.status(404).send("Event not found");
  }
});

router.post("/:id/comments", requireLogin, async (req, res) => {
  try {
    const { commentText, parentId } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const comment = await events.addComment(
      req.params.id,
      req.session.user._id,
      req.session.user.username,
      commentText,
      parentId || null
    );

    res.json({ success: true, comment });

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id/comments/:commentId", requireLogin, async (req, res) => {
  try {
    await events.deleteComment(req.params.id, req.params.commentId, req.session.user._id);
    res.json({ success: true });

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;