import express from "express";
import handlebars from "express-handlebars";
import session from "express-session";
import cookieParser from "cookie-parser";
import configRoutes from "./routes/index.js";
import { settings } from "./config/settings.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
app.use(
  session({
    name: settings.session.cookieName,
    secret: settings.session.secret,
    resave: false,
    saveUninitialized: false
  })
);

// ⭐ Handlebars Setup (Correct & Clean Version)
const hbs = handlebars.create({
  defaultLayout: "main",
  helpers: {
    ifEquals(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    }
  }
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Static files
app.use("/public", express.static("public"));

// Routes
configRoutes(app);

// Server
app.listen(settings.server.port, () => {
  console.log(`Server running at http://localhost:${settings.server.port}`);
});