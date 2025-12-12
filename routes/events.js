import { Router } from "express";
import events from "../data/events.js";
import * as usersd from "../data/users.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";


import { requireLogin } from "../middleware.js";
import { getEventWithCoordinates, getUpcomingEventsWithCoordinates, getClosestEvents } from "../data/map.js";
import helpers from "../helpers/eventHelpers.js";
import xss from "xss";

const router = Router();

router.get("/create", requireLogin, async (req, res) => {
  try {
    res.render("createEvent", {
      title: "Create New Event",
      user: req.session.user,
    });
  } catch (e) {
    res.status(500).render("error", { error: e.message });
  }
});

router.post("/create", requireLogin, async (req, res) => {
  let {
    eventName,
    eventType,
    eventLocation,
    eventBorough,
    startDateTime,
    endDateTime,
    streetClosureType,
    isPublic,
  } = req.body;

  if (eventName) eventName = xss(eventName);
  if (eventType) eventType = xss(eventType);
  if (eventLocation) eventLocation = xss(eventLocation);
  if (eventBorough) eventBorough = xss(eventBorough);
  if (startDateTime) startDateTime = xss(startDateTime);
  if (endDateTime) endDateTime = xss(endDateTime);
  if (streetClosureType) streetClosureType = xss(streetClosureType);
  if (isPublic) isPublic = xss(isPublic);

  if (
    !eventName ||
    !eventType ||
    !eventLocation ||
    !eventBorough ||
    !startDateTime ||
    !endDateTime ||
    !isPublic
  ) {
    let missingFields = [];
    if (!eventName) {
      missingFields.push("eventName");
    }
    if (!eventType) {
      missingFields.push("eventType");
    }
    if (!eventLocation) {
      missingFields.push("eventLocation");
    }
    if (!eventBorough) {
      missingFields.push("eventBorough");
    }
    if (!startDateTime) {
      missingFields.push("startDateTime");
    }
    if (!endDateTime) {
      missingFields.push("endDateTime");
    }
    if (!isPublic) {
      missingFields.push("isPublic");
    }
    return res.status(400).render("createEvent", {
      error:
        "Error: The following fields are missing: " + missingFields.join(", "),
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      startDateTime,
      endDateTime,
      streetClosureType,
      isPublic,
    });
  }
  try {
    eventName = helpers.validEventName(eventName);
    eventType = helpers.validEventType(eventType);
    eventLocation = helpers.validLocation(eventLocation);
    eventBorough = helpers.validBorough(eventBorough);
    startDateTime = helpers.validDateTime(startDateTime);
    endDateTime = helpers.validDateTime(endDateTime);
    helpers.validStartEndTimeDate(startDateTime, endDateTime);
    //isPublic = helpers.validPublicity(isPublic);
  } catch (e) {
    return res.status(400).render("createEvent", {
      error: `${e}`,
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      startDateTime,
      endDateTime,
      streetClosureType,
      isPublic,
    });
  }

  try {
    const event = await events.userCreateEvent(
      req.session.user._id,
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      startDateTime,
      endDateTime,
      streetClosureType,
      isPublic
    );
    const userId = req.session.user._id
    const eventId = event.eventId

    await usersd.saveEvent(userId, eventId);

    if (event.registrationCompleted) {
      return res.redirect("/events/create/success");
    } else {
      return res.status(500).render("error", {
        error: "Internal Server Error: Registration failed.",
        title: "Error",
      });
    }
  } catch (e) {
    res.status(400).render("createEvent", {
      error: e,
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      startDateTime,
      endDateTime,
      streetClosureType,
      isPublic,
    });
  }
});

router.get("/create/success", requireLogin, (req, res) => {
  res.render("createEventSuccess", {
    title: "Event Created Successfully",
    user: req.session.user,
  });
});


router.get("/search", async (req, res) => {
  try {
    let { keyword, borough, eventType, startDate, endDate, page } = req.query;

    page = parseInt(page) || 1;
    if (page < 1) page = 1;

    borough = Array.isArray(borough) ? borough : borough ? [borough] : [];
    eventType = Array.isArray(eventType)
      ? eventType
      : eventType
      ? [eventType]
      : [];

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
        currentUrl: req.originalUrl,
        error: "Start date cannot be after end date",
        totalPages: 0,
        currentPage: 1,
      });
    }

    const { results, totalEvents, totalPages, currentPage } =
      await events.searchEvents({
        keyword: keyword || "",
        borough,
        eventType,
        startDate,
        endDate,
        page,
      });

    let savedList = [];
    if (req.session.user) {
      savedList = (await usersd.getSavedEvents(req.session.user._id)).map((id) =>
        id.toString()
      );
    }

    const eventIds = results.map((e) => e._id.toString());
    const countMap = await usersd.countUsersWhoSavedMany(eventIds);

    results.forEach((evt) => {
      const id = evt._id.toString();
      evt.saved = savedList.includes(id);
      evt.userCount = countMap[id] || 0;
    });

    let eventLocation = []
    if (req.session.user) {
      const userId = req.session.user._id;
      if (userId) {
        const userCollection = await users();

        // Get user information
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
          throw "Error: User not found";
        }

        let userHomeBorough = user.homeBorough || null;
        eventLocation = await getUpcomingEventsWithCoordinates(userHomeBorough);

      }
    }

    res.render("search", {
      keyword: keyword || "",
      borough,
      eventType,
      startDate,
      endDate,
      results,
      eventTypes,
      boroughs,
      totalEvents,
      totalPages,
      currentPage,
      currentUrl: req.originalUrl,
      eventLocation
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/save", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.session.user._id
    
    await usersd.saveEvent(userId, eventId);

    const userCount = await usersd.countUsersWhoSaved(eventId);
    res.json({ saved: true, userCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/unsave", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.session.user._id
    await usersd.unsaveEvent(userId, eventId);

    const userCount = await usersd.countUsersWhoSaved(eventId);
    res.json({ saved: false, userCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const eventId = req.params.id

    const event = await events.getEventById(eventId);
    const eventLocation = await getEventWithCoordinates(eventId);

    let saved = false;
    if (req.session.user) {
      const userId = req.session.user._id
      const savedList = await usersd.getSavedEvents(userId);
      saved = savedList.map((x) => x.toString()).includes(eventId);
    }

    const userCount = await usersd.countUsersWhoSaved(eventId);

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
    let { commentText, parentId } = req.body;
    if (commentText) commentText = xss(commentText);
    if (parentId) parentId = xss(parentId);
    

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const eventId = req.params.id
    const userId = req.session.user._id

    const comment = await events.addComment(
      eventId,
      userId,
      req.session.user.username,
      commentText,
      parentId || null
    );

    res.json({ success: true, comment });
  } catch (e) {
    console.error("comment error:", e);
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id/comments/:commentId", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.session.user._id
    const commentId = req.params.commentId

    await events.deleteComment(
      eventId,
      commentId,
      userId
    );
    res.json({ success: true });
  } catch (e) {
    console.error("delete comment error:", e);
    res.status(400).json({ error: e.message });
  }
});

export default router;
