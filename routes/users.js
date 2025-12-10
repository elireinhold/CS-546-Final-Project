import { Router } from "express";
const router = Router();
import * as userData from "../data/users.js";
import userHelpers from "../helpers/userHelpers.js";

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

router.post("/register", async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    password,
    confirmPassword,
    email,
    birthday,
    preferredBorough,
    preferredEventType,
  } = req.body;

  if (
    !username ||
    !firstName ||
    !lastName ||
    !password ||
    !confirmPassword ||
    !email ||
    !birthday
  ) {
    let missingFields = [];
    if (!username) {
      missingFields.push("username");
    }
    if (!firstName) {
      missingFields.push("firstName");
    }
    if (!lastName) {
      missingFields.push("lastName");
    }
    if (!password) {
      missingFields.push("password");
    }
    if (!confirmPassword) {
      missingFields.push("confirmPassword");
    }
    if (!email) {
      missingFields.push("email");
    }
    if (!birthday) {
      missingFields.push("birthday");
    }

    return res.status(400).render("register", {
      error:
        "Error: The following fields are missing: " + missingFields.join(", "),
      title: "Registration Error",
      username: username || "",
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || "",
      birthday: birthday || "",
      preferredBorough: preferredBorough || "",
      preferredEventType: preferredEventType || "",
    });
  }

  //validate inputs
  try {
    firstName = userHelpers.validFirstOrLastName(firstName);
    lastName = userHelpers.validFirstOrLastName(lastName);
    username = userHelpers.validUserNameRegister(username);

    password = userHelpers.validPassword(password);
    confirmPassword = confirmPassword.trim();
    if (password !== confirmPassword) {
      return res.status(400).render("register", {
        error: "Error: Passwords do not match",
        title: "Registration Error",
        username: username,
        firstName: firstName,
        lastName: lastName,
        email: email,
        birthday: birthday,
        preferredBorough: preferredBorough || "",
        preferredEventType: preferredEventType || "",
      });
    }
    email = userHelpers.validEmail(email);
    birthday = userHelpers.validAge(birthday);
    if (preferredBorough) {
      preferredBorough = userHelpers.validBorough(preferredBorough);
    } else {
      preferredBorough = null;
    }
    if (preferredEventType) {
      preferredEventType = userHelpers.validEventType(preferredEventType);
    } else {
      preferredEventType = null;
    }
  } catch (e) {
    return res.status(400).render("register", {
      error: e,
      title: "Registration Error",
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
      birthday: birthday,
      preferredBorough: preferredBorough || "",
      preferredEventType: preferredEventType || "",
    });
  }

  // register user
  try {
    const result = await userData.register(
      username,
      firstName,
      lastName,
      password,
      preferredBorough,
      preferredEventType,
      email,
      birthday
    );

    if (result.registrationCompleted) {
      // Auto-login after registration
      const user = await userData.login(username, password);
      req.session.user = {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferredBorough: user.homeBorough || null,
        preferredEventType: (function () {
          // Deals with passing null to an array
          if (user.favoriteEventTypes && user.favoriteEventTypes.length > 0) {
            return user.favoriteEventTypes[0];
          } else {
            return null;
          }
        })(),
        birthday: user.birthday,
      };
      return res.redirect("/");
    } else {
      return res.status(500).render("error", {
        error: "Internal Server Error: Registration failed.",
        title: "Error",
      });
    }
  } catch (e) {
    return res.status(400).render("register", {
      error: e,
      title: "Registration Error",
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
      birthday: birthday,
      preferredBorough: preferredBorough || "",
      preferredEventType: preferredEventType || "",
    });
  }
});

export default router;
