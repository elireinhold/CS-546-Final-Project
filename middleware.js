// export function attachUser(req, res, next) {
//   res.locals.user = req.session.user || null;
//   next();
// }

// export function redirectIfLoggedIn(req, res, next) {
//   if (req.session.user) {
//     return res.redirect("/");
//   }
//   next();
// }

export function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(403).json({ error: "You must be logged in to do this." });
  }
  next();
} 