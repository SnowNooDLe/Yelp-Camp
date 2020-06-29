const User = require("./models/user");

var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  methodOverride = require("method-override"),
  flash = require("connect-flash");
require("dotenv").config();

// Requiring routes
var commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

mongoose.set("useUnifiedTopology", true);

// DEVELOPMENT
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("connected to DB!");
  })
  .catch((err) => {
    console.log("Error: ", err.message);
  });

// Apply to avoid getting warning with findOneAndUpdate
mongoose.set("useFindAndModify", false);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// __dirname is the directory name that this script is running
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
// seedDB();  // seed the database

// PASSPORT CONFIGURATION
app.use(
  require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// Think it as setting up a global variable
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  // MOST IMPORTANT as this is a middleware that will run for every single route.
  // If we don't have this next, it will just stop.
  // So we need to have the next() in order to move on to that next middleware which will actually be the route handler.
  next();
});

// Using Express router instead of having them all in app.js
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

//  ===================
//  Everywhere else
//  ===================
app.get("*", function (req, res) {
  res.render("error")
})

app.listen(process.env.PORT || 3000, function () {
  console.log("The YelpCamp Server Has Started!");
});
