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

router.post("/login", async (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render("users/login", {
      error: "Error: Both username and password are required.",
      title: "Login Error",
      username: username || "",
    });
  }

  if (typeof username !== "string") {
    return res.status(400).render("users/login", {
      error: "Error: Username must be a string.",
      title: "Login Error",
    });
  }
  username = username.trim();
  if (username.length === 0) {
    return res.status(400).render("users/login", {
      error: "Error: Username cannot be an empty string or just spaces.",
      title: "Login Error",
    });
  }
  if (username.length < 5 || username.length > 10) {
    return res.status(400).render("users/login", {
      error: "Error: Username must be between 5 and 10 characters long.",
      title: "Login Error",
    });
  }
  if (typeof password !== "string") {
    return res.status(400).render("users/login", {
      error: "Error: Password must be a string.",
      title: "Login Error",
    });
  }
  password = password.trim();
  if (password.length === 0) {
    return res.status(400).render("users/login", {
      error: "Error: Password cannot be an empty string or just spaces.",
      title: "Login Error",
    });
  }
  if (password.length < 8) {
    return res.status(400).render("users/login", {
      error: "Error: Password must be at least 8 characters long.",
      title: "Login Error",
    });
  }
  try {
    password = userHelpers.validPassword(password);
  } catch (e) {
    return res.status(400).render("users/login", {
      error: "Error: Either the username or password is invalid.",
      title: "Login Error",
    });
  }

  try {
    const user = await userData.login(username, password);
    req.session.user = {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      preferredBorough: user.homeBorough || null,
      birthday: user.birthday,
      favoriteEventTypes: user.favoriteEventTypes || [],
    };

    return res.redirect("/");
  } catch (e) {
    return res.status(400).render("users/login", {
      error: "Error: Either the userId or password is invalid.",
      title: "Login Error",
    });
  }
});

router.get("/register", (req, res) => {
  res.render("users/register");
});

router.post("/register", async (req, res) => {
  let {
    username,
    firstName,
    lastName,
    password,
    confirmPassword,
    email,
    preferredBorough,
    preferredEventType,
    birthday,
  } = req.body;

  if (
    !username ||
    !firstName ||
    !lastName ||
    !password ||
    !confirmPassword ||
    !preferredEventType ||
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
    if (!preferredEventType) {
      missingFields.push("preferredEventType");
    }

    return res.status(400).render("users/register", {
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

    username = await userHelpers.validUserNameRegister(username);

    password = userHelpers.validPassword(password);
    confirmPassword = confirmPassword.trim();
    if (password !== confirmPassword) {
      return res.status(400).render("users/register", {
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
    preferredEventType = userHelpers.validEventType(preferredEventType);
  } catch (e) {
    return res.status(400).render("users/register", {
      error: e,
      title: "Registration Error",
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
      birthday: birthday,
      preferredBorough: preferredBorough || "",
      preferredEventType: preferredEventType,
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
        preferredEventType: [preferredEventType],
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
    return res.status(400).render("users/register", {
      error: e,
      title: "Registration Error",
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
      birthday: birthday,
      preferredBorough: preferredBorough || "",
      preferredEventType: preferredEventType,
    });
  }
});

router.route("/logout").get(async (req, res) => {
  try {
    if (req.session.user) {
      req.session.destroy();
      res.render("logout", { title: "Sign Out" });
    } else {
      res.redirect("login");
    }
  } catch (e) {
    res.status(500).render("error", {
      error: e,
      title: "Error",
    });
  }
});
export default router;
