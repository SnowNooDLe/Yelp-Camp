var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

//  ===================
//  ROOT ROUTES
//  ===================
router.get("/", function (req, res) {
  res.render("landing");
});

//  ===================
//  ABOUT ROUTES
//  ===================
router.get("/about", function (req, res) {
  res.render("about", {page: "about"});
})

// AUTH ROUTES
//  ===================
//  SHOW REGISTER FORM
//  ===================
router.get("/register", function (req, res) {
  res.render("register", {page: "register"});
});

//  ===================
//  HANDLE SIGN UP LOGIC
//  ===================
router.post("/register", function (req, res) {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("register");
    }
    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome to YelpCamp, " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

// LOGIN ROUTES
//  ===================
//  SHOW LOGIN FORM
//  ===================
router.get("/login", function (req, res) {
  res.render("login", {page: "login"});
});

//  ===================
//  HANDLING LOGIN LOGIC
//  ===================
// router.post(
//   "/login",
//   passport.authenticate("local", {
//     successRedirect: "/campgrounds",
//     failureRedirect: "/login",
//   }),
//   function (req, res) {}
// );
router.post("/login", function (req, res, next) {
  passport.authenticate("local",{
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome to YelpCamp, " + req.body.username + "!"
  })(req, res);
})

//  ===================
//  LOGOUT ROUTES
//  ===================
router.get("/logout", function (req, res) {
  req.logout();
  req.flash("success", "Logged you out!");
  res.redirect("/campgrounds");
});

module.exports = router;