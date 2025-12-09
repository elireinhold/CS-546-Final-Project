import express from "express";
import exphbs from "express-handlebars";
import session from "express-session";
import cookieParser from "cookie-parser";
import configRoutes from "./routes/index.js";
import { settings } from "./config/settings.js";
// import configMiddleware from './middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    name: settings.session.cookieName,
    secret: settings.session.secret,
    resave: false,
    saveUninitialized: false,
  })
);

// Session Middleware
app.use((req,res,next) => {
  res.locals.session = req.session;
  next();
}); // inserts session into every view

// Handlebars setup (+ contains helper)
const hbs = handlebars.create({
  defaultLayout: "main",
  helpers: {
    ifEquals(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    },
    contains(arr, value) {
      if (!arr) return false;
      if (!Array.isArray(arr)) return arr === value;
      return arr.includes(value);
    },
    toString(value) {
      if (!value) return "";
      return value.toString();
    },
    eq(a, b) {
      return String(a) === String(b);
    },
    json(data) {
      return JSON.stringify(data);
    }
  })
);

app.set("view engine", "handlebars");

app.use("/public", express.static("public"));

// configMiddleware(app);

configRoutes(app);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});