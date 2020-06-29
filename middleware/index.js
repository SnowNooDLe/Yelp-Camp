// All the middleware goes here
var middlewareObject = {};
var Campground = require("../models/campground");
var Comment = require("../models/comment");

middlewareObject.checkCampgroundOwnership = function checkCampgroundOwnership(
  req,
  res,
  next
) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, function (err, foundCampground) {
      // Also to check that we found campground
      if (err || !foundCampground) {
        req.flash("error", "Campground not found");
        res.redirect("/campgrounds");
      } else {
        // does user own the campground?
        if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          return res.render("error");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/campgrounds/" + req.params.id);
  }
};

middlewareObject.checkCommentOwnership = function checkCommentOwnership(
  req,
  res,
  next
) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if (err || !foundComment) {
        req.flash("error", "Comment not found");
        res.redirect("/campgrounds");
      } else {
        // does user own the comment?
        if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          return res.render("error");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/campgrounds/" + req.params.id);
  }
};

middlewareObject.isLoggedIn = function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // Whenever we want to display a message whether it's success msg or an error msg whatever it is, we're going to use this line right here.
  // req.flash and then we pass in a key and a value and we do that before we redirect.
  // It is very imporatant to put it before redirect.
  req.flash("error", "You need to be logged in to do that");
  res.redirect("/login");
};

module.exports = middlewareObject;
