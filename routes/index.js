import { Router } from "express";
import eventsRoutes from "./events.js";
import usersRoutes from "./users.js";
import homeRoutes from "./home.js";
import calendarRoutes from "./calendar.js";

const constructorMethod = (app) => {
  
  // Home routes
  app.use("/", homeRoutes);

  // Events routes
  app.use("/events", eventsRoutes);

  // Users routes (you can add later)
  app.use("/users", usersRoutes);

  app.use("/calendar", calendarRoutes);

  // 404 fallback
  


  //don't delete this, it's a fakeid for temporary testing purposes
  app.get("/testlogin", (req, res) => {
    req.session.user = {
      _id: "6935b41a74e0dabcb657159b",
      username: "ru_test"
    };

    res.send("Logged in as test user: ru_test");
  });

};

export default constructorMethod;