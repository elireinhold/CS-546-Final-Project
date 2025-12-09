import { Router } from "express";
const router = Router();
import * as userData from "../data/users.js";
import { requireLogin, redirectIfLoggedIn } from "../middleware.js";
// Placeholder routes — you can replace later

router.get("/", (req, res) => {
  res.send("Users route placeholder");
});

router.get("/login", (req, res) => {
  res.render("users/login");
});

router.get("/register", (req, res) => {
  res.render("users/register");
});

export default router;
