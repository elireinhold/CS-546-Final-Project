import express from "express";
import exphbs from "express-handlebars";
import session from "express-session";
import cookieParser from "cookie-parser";
import configRoutes from "./routes/index.js";

const app = express();

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies & Sessions
app.use(cookieParser());
app.use(
  session({
    name: "AuthState",
    secret: "super secret string",
    resave: false,
    saveUninitialized: false,
  })
);

// Handlebars setup
app.engine(
  "handlebars",
  exphbs.engine({
    defaultLayout: "main",
  })
);
app.set("view engine", "handlebars");

// Static folder
app.use("/public", express.static("public"));

// Load routes
configRoutes(app);

// Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
