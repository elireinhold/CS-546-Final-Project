export function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
}

export function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.redirect("/");
  }
  next();
}

export function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/users/login");
  }
  next();
}

export function requestLogger(req, res, next) {
  const time = new Date().toLocaleTimeString();
  const user = req.session.user ? req.session.user.username : "guest";
  // console.log(`[${time}] ${req.method} ${req.originalUrl} [${user}]`);
  next();
}
