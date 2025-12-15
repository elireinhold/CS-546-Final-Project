import { Router } from "express";
import events from "../data/events.js";
import * as usersd from "../data/users.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";


import { requireLogin, requireLoginAjax } from "../middleware.js";
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

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Check if valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid date input");
    }
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

    // Validate keyword (optional, but if provided must be at least 2 characters)
    if (keyword && keyword.trim()) {
      if (keyword.trim().length < 2) {
        return res.render("search", {
          error: "Keyword must be at least 2 characters long.",
          keyword,
          borough,
          eventType,
          startDate,
          endDate,
          results: [],
          eventTypes,
          boroughs,
          totalPages: 0,
          currentPage: 1,
          currentUrl: req.originalUrl
        });
      }
      // Validate keyword format
      if (typeof keyword !== "string") {
        return res.render("search", {
          error: "Keyword must be a string.",
          keyword,
          borough,
          eventType,
          startDate,
          endDate,
          results: [],
          eventTypes,
          boroughs,
          totalPages: 0,
          currentPage: 1,
          currentUrl: req.originalUrl
        });
      }
    }

    function isValidDate(d) {
      return d instanceof Date && !isNaN(d);
    }

    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;

    if (startDate && !isValidDate(start)) {
      return res.render("search", {
        error: "Invalid start date.",
        keyword,
        borough,
        eventType,
        startDate,
        endDate,
        results: [],
        eventTypes,
        boroughs,
        totalPages: 0,
        currentPage: 1,
        currentUrl: req.originalUrl
      });
    }

    if (endDate && !isValidDate(end)) {
      return res.render("search", {
        error: "Invalid end date.",
        keyword,
        borough,
        eventType,
        startDate,
        endDate,
        results: [],
        eventTypes,
        boroughs,
        totalPages: 0,
        currentPage: 1,
        currentUrl: req.originalUrl
      });
    }

    if (start && end && start > end) {
      return res.render("search", {
        error: "Start date cannot be after end date.",
        keyword,
        borough,
        eventType,
        startDate,
        endDate,
        results: [],
        eventTypes,
        boroughs,
        totalPages: 0,
        currentPage: 1,
        currentUrl: req.originalUrl
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

    const resultsWithLocalTime = results.map(evt => ({
      ...evt,
      startDateTimeLocal: new Date(evt.startDateTime).toLocaleString("en-US", { timeZone: "America/New_York" }),
      endDateTimeLocal: new Date(evt.endDateTime).toLocaleString("en-US", { timeZone: "America/New_York" })
    }));


    res.render("search", {
      keyword: keyword || "",
      borough,
      eventType,
      startDate,
      endDate,
      results: resultsWithLocalTime,
      eventTypes,
      boroughs,
      totalEvents,
      totalPages,
      currentPage,
      currentUrl: req.originalUrl,
      eventLocation
    });
  } catch (e) {
    console.error("search error:", e);
    return res.render("search", {
      error: e.toString(),
      keyword: req.query.keyword || "",
      borough: req.query.borough || [],
      eventType: req.query.eventType || [],
      startDate: req.query.startDate || "",
      endDate: req.query.endDate || "",
      results: [],
      eventTypes: await events.getDistinctEventTypes(),
      boroughs: await events.getDistinctBoroughs(),
      currentUrl: req.originalUrl,
      totalPages: 0,
      currentPage: 1
    });
  }
});

router.post("/:id/save", requireLoginAjax, async (req, res) => {
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

router.post("/:id/unsave", requireLoginAjax, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.session.user._id
    await usersd.unsaveEvent(userId, eventId);

    if(req.body.ownEvent) {
      return res.json({error:'Cannot unsave your own event.'});
    }

    const userCount = await usersd.countUsersWhoSaved(eventId);
    res.json({ saved: false, userCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id/edit", requireLogin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.session.user._id;
    const eventInfo = await events.getEventById(eventId);

    if(eventInfo.userIdWhoCreatedEvent !== userId) {
      return res.status(403).render("error",{title: "403 forbidden", error:"You do not have access to this page"});
    }

    let {eventName,eventType,eventLocation,eventBorough,startDateTime,endDateTime,streetClosureType,isPublic} = eventInfo;

    isPublic = helpers.publicityString(isPublic);

    eventBorough = eventBorough.toLowerCase();

    const fixTime = (timeStr) => {
        let d = new Date(timeStr);
        const date = d.toISOString().split("T")[0];
        const time = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        return `${date}T${time}`;
    }

    startDateTime = fixTime(startDateTime);
    endDateTime = fixTime(endDateTime);

    res.render('editEvent',{
      eventId,
      userId,
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      streetClosureType,
      startDateTime,
      endDateTime,
      isPublic
    })

  } catch (e) {
    res.status(500).json({error: e.message })
  }
})
.post("/:id/edit", requireLogin, async (req, res) => {
  let {
    eventName,
    eventType,
    eventLocation,
    eventBorough,
    startDateTime,
    endDateTime,
    streetClosureType,
    isPublic
  } = req.body;

  let userId = req.session.user._id;
  let eventId = req.params.id;

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
    return res.status(400).render("editEvent", {
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
    startDateTime = helpers.validDateTime(startDateTime,'Start');
    endDateTime = helpers.validDateTime(endDateTime,'End');
    streetClosureType = helpers.validStreetClosure(streetClosureType);
    isPublic = helpers.validPublicity(isPublic);

    //isPublic = helpers.validPublicity(isPublic);
  } catch(e) {
    res.status(400).render({
      error:e,
      eventName,
      eventType,
      eventLocation,
      evenBorough,
      startDateTime,
      endDateTime,
      isPublic,
      eventId
    })
  }

  try{
    const newEvent = await events.editEvent(
      eventId,
      userId,
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      startDateTime,
      endDateTime,
      streetClosureType,
      isPublic
    );

    if(newEvent.edited){
      return res.redirect(`/events/${eventId}`);
    } else {
      return res.status(500).render("error", {
        error: "Internal Server Error: Registration failed.",
        title: "Error",
      });
    }

  } catch(e) {
    res.status(400).render('editEvent', {
      error: e,
      eventName,
      eventType,
      eventLocation,
      eventBorough,
      startDateTime,
      endDateTime,
      isPublic,
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const eventId = req.params.id

    const event = await events.getEventById(eventId);
    const eventLocation = await getEventWithCoordinates(eventId);

    let saved = false;
    let ownEvent = false;
    if (req.session.user) {
      const userId = req.session.user._id
      const savedList = await usersd.getSavedEvents(userId);
      saved = savedList.map((x) => x.toString()).includes(eventId);
      ownEvent = (userId === event.userIdWhoCreatedEvent);
    }

    if(!event.isPublic && !ownEvent) {
      return res.status(403).render('error',{title: "403 forbidden", error:"You do not have access to this page"});
    }

    const userCount = await usersd.countUsersWhoSaved(eventId);

    const eventLocal = {
      ...event,
      startDateTimeLocal: new Date(event.startDateTime).toLocaleString("en-US", { timeZone: "America/New_York" }),
      endDateTimeLocal: new Date(event.endDateTime).toLocaleString("en-US", { timeZone: "America/New_York" })
    };

    const creatorId = event.userIdWhoCreatedEvent;

    res.render("eventDetails", {
      event: eventLocal,
      eventLocation,
      saved,
      userCount,
      returnTo: req.query.returnTo || "/events/search",
      ownEvent,
      creatorId,
    });
  } catch (e) {
    res.status(404).send("Event not found");
  }
});

router.delete("/:id", requireLoginAjax, async(req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.session.user._id;

    const event = await events.deleteEvent(
      eventId,
      userId
    )
    res.json({deleted:true});
  } catch(e) {
    res.status(500).json({deleted:false, error:e});
  }
});

router.post("/:id/comments", requireLoginAjax, async (req, res) => {
  try {
    let { commentText, parentId } = req.body;
    if (commentText) commentText = xss(commentText);
    if (parentId) parentId = xss(parentId);
    
    // Validate comment text
    if (!commentText || typeof commentText !== "string") {
      return res.status(400).json({ error: "Comment text is required" });
    }
    commentText = commentText.trim();
    if (commentText.length < 2) {
      return res.status(400).json({ error: "Comment text must be at least 2 characters long." });
    }
    if (commentText.length > 500) {
      return res.status(400).json({ error: "Comment text must be no more than 500 characters long." });
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
    res.status(400).json({ error: e || e.message || "Error adding comment" });
  }
});

router.delete("/:id/comments/:commentId", requireLoginAjax, async (req, res) => {
  try {
    const eventId = xss(req.params.id);
    const userId = req.session.user._id;
    const commentId = xss(req.params.commentId);

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