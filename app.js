import express from "express";
import exphbs from "express-handlebars";
import session from "express-session";
import cookieParser from "cookie-parser";
import configRoutes from "./routes/index.js";
import { settings } from "./config/settings.js";
import handlebarsHelpers from "./helpers/handlebarsHelpers.js";
import {
  attachUser,
  redirectIfLoggedIn,
  requestLogger,
} from "./middleware.js";

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
    cookie: { maxAge: 60000 * 60 },
  })
);

// sends session data to every page
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use(attachUser);

app.use(requestLogger);

const hbs = exphbs.create({
  defaultLayout: "main",
  helpers: handlebarsHelpers
});


app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use("/public", express.static("public"));

app.use("/users/login", redirectIfLoggedIn);
app.use("/users/register", redirectIfLoggedIn);

configRoutes(app);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
