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

  // Users routes
  app.use("/users", usersRoutes);

  // Calendar routes
  app.use("/calendar", calendarRoutes);

  // 404 fallback
  app.use("*", (req, res) => {
    res.status(404).render("error", { 
      title: "404 Not Found",
      error: "Page Not Found"
    });
  });

};

export default constructorMethod;


