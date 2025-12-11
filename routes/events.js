import { Router } from "express";
import events from "../data/events.js";
import users from "../data/users.js";
import { requireLogin } from "../middleware.js";
import { getEventWithCoordinates } from "../data/map.js";
import helpers from "../helpers/eventHelpers.js";

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
    communityBoard,
    isPublic,
  } = req.body;

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
      communityBoard,
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
    communityBoard = helpers.validCommunityBoard(communityBoard);
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
      communityBoard,
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
      communityBoard,
      isPublic
    );

    await users.saveEvent(req.session.user._id, event.eventId)

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
      communityBoard,
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
/*
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
*/
router.get("/search", async (req, res) => {
  try {
    let { keyword, borough, eventType, startDate, endDate, page } = req.query;

    // page 转成数字，并且至少为 1
    page = parseInt(page) || 1;
    if (page < 1) page = 1;

    // normalize types
    borough = Array.isArray(borough) ? borough : borough ? [borough] : [];
    eventType = Array.isArray(eventType)
      ? eventType
      : eventType
      ? [eventType]
      : [];

    // distinct lists
    const eventTypes = (await events.getDistinctEventTypes()).sort();
    const boroughs = (await events.getDistinctBoroughs()).sort();

    // date validation
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

    // 从 searchEvents 取得分页结构
    const { results, totalEvents, totalPages, currentPage } =
      await events.searchEvents({
        keyword: keyword || "",
        borough,
        eventType,
        startDate,
        endDate,
        page,
      });

    // 是否登录 拿 saved events
    let savedList = [];
    if (req.session.user) {
      savedList = (await users.getSavedEvents(req.session.user._id)).map((id) =>
        id.toString()
      );
    }

    // userCount
    const eventIds = results.map((e) => e._id.toString());
    const countMap = await users.countUsersWhoSavedMany(eventIds);

    // annotate results
    results.forEach((evt) => {
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
      totalEvents,
      totalPages,
      currentPage,
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
      saved = savedList.map((x) => x.toString()).includes(req.params.id);
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
    await events.deleteComment(
      req.params.id,
      req.params.commentId,
      req.session.user._id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
