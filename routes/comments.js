var express = require("express");
// By having mergeParams: true, so inside comments routes, we are able to access :id
var router = express.Router({ mergeParams: true });
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//  ===================
//  COMMENTS NEW
//  ===================
router.get("/new", middleware.isLoggedIn, function (req, res) {
  // Find campground by id
  Campground.findById(req.params.id, function (err, campground) {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { campground: campground });
    }
  });
});

//  ===================
//  COMMENTS CREATE
//  ===================
router.post("/", middleware.isLoggedIn, function (req, res) {
  // Lookup campground using ID
  Campground.findById(req.params.id, function (err, campground) {
    if (err) {
      req.flash("error", "Something went wrong");
      res.redirect("/campgrounds");
    } else {
      // Create new comment
      // Because from new.ejs, we store value as an object, so we can use req.body.comment
      Comment.create(req.body.comment, function (err, comment) {
        if (err) {
          console.log(err);
        } else {
          // add username and id to comment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          // save comment
          comment.save();
          // Connect new comment to campground
          campground.comments.push(comment);
          campground.save();
          req.flash("success", "Successfully added a comment");
          // Redirect to campground show page
          res.redirect("/campgrounds/" + campground._id);
        }
      });
    }
  });
});

// COMMENTS EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (
  req,
  res
) {
  Campground.findById(req.params.id, function (err, foundCampground) {
    if (err || !foundCampground) {
      req.flash("error", "Campground not found");
      return res.render("error");
    } else {
      Comment.findById(req.params.comment_id, function (err, foundComment) {
        if (err) {
          return res.render("error");
        } else {
          res.render("comments/edit", {
            campground_id: req.params.id,
            comment: foundComment,
          });
        }
      });
    }
  });
});

// COMMENTS UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function (
  req,
  res
) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (
    err,
    updatedComment
  ) {
    if (err) {
      return res.render("error");
    } else {
      // Because inside app.js, we already have a url with comment, /campgrounds/:id/comments so params id is user id not comment id
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// COMMENTS DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function (
  req,
  res
) {
  // FindbyIdANdRemove
  Comment.findByIdAndRemove(req.params.comment_id, function (err) {
    if (err) {
      return res.render("error");
    } else {
      req.flash("success", "Comment deleted");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;
