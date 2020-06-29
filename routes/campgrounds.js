var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var multer = require("multer");
// by giving directory name with index.js, they use index.js as default setting
var middleware = require("../middleware")

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "dfzbgsto4",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})


//  ===================================
//  INDEX ROUTES - SHOW ALL CAMPGROUNDS
//  ===================================
router.get("/", function (req, res) {
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Get all campground from DB that contains search query
    Campground.find({"name": regex}, function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        if (allCampgrounds.length < 1) {
          req.flash("error", "No such campground found that contains: " + req.query.search);
          res.redirect("/campgrounds");
        } else {
          req.flash("success", allCampgrounds.length + " campgrounds are found");
          res.render("campgrounds/index", { campgrounds: allCampgrounds, page: "campgrounds" });
        }
      }
    });
  } else {
    // Get all campground from DB
    Campground.find({}, function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        res.render("campgrounds/index", { campgrounds: allCampgrounds, page: "campgrounds" });
      }
    });
  }
});

// RESTful convention, will be back to this later on about REST

//  ===================================
//  CREATE - ADD A NEW CAMPGROUND TO DB
//  ===================================
router.post("/", middleware.isLoggedIn, upload.single("image"), function (req, res) {
  cloudinary.v2.uploader.upload(req.file.path, {width: 900, height: 600, crop: "scale"}, function(err, result) {
    if (err) {
      req.flash("error", err.message);
      return res.render("error");
    }
    // add cloudinary url for the image to the campground object under image property
    req.body.campground.image = result.secure_url;
    // add image's public_id to campground object
    req.body.campground.imageId = result.public_id;
    // add author to campground
    req.body.campground.author = {
      id: req.user._id,
      username: req.user.username
    }
    Campground.create(req.body.campground, function(err, campground) {
      if (err) {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        req.flash("success", "Campground successfully created!");
        // Redirect back to campgrounds page
        res.redirect("/campgrounds");
      }
    });
  });
});

// Another RESTful convention
//  ==========================================
//  NEW - SHOW FORM TO CREATE A NEW CAMPGROUND
//  ==========================================
router.get("/new", middleware.isLoggedIn, function (req, res) {
  res.render("campgrounds/new");
});

// Make sure this comes after /campgrounds/new otherwise /campground/:id will come up first because it will cound new as :id
//  =====================================
//  SHOW - SHOW INFO ABOUT ONE CAMPGROUND
//  =====================================
router.get("/:id", function (req, res) {
  // find the campground with provided ID
  Campground.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundCampground) {
      if (err || !foundCampground) {
        return res.render("error");
      } else {
        // render show template with that campground
        res.render("campgrounds/show", { campground: foundCampground });
      }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findById(req.params.id, function (err, foundCampground) {
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res) {
  // find and update the correct campground
  Campground.findById(req.params.id, async function (
    err,
    foundCampground
  ) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("/campgrounds");
    } else {
      try {
        await cloudinary.v2.uploader.destroy(foundCampground.imageId)
        let result = await cloudinary.v2.uploader.upload(req.file.path, {width: 900, height: 600, crop: "scale"})
        foundCampground.imageId = result.public_id;
        foundCampground.image = result.secure_url;
      } catch(err) {
        req.flash("error", err.message);
        return res.redirect("/campgrounds");
      }
      foundCampground.name = req.body.campground.name;
      foundCampground.description = req.body.campground.description;
      foundCampground.price = req.body.campground.price;
      foundCampground.save();
      req.flash("success", "Successfully updated!");
      // redirect somewhere(normally show page)
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findById(req.params.id, async function (err, foundCampground) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("/campgrounds");
    }

    try {
      await cloudinary.v2.uploader.destroy(foundCampground.imageId);
      foundCampground.remove();
      req.flash("success", "Campground deleted successfully!");
      res.redirect("/campgrounds");
    } catch(err) {
      req.flash("error", err.message);
      return res.redirect("/campgrounds")
    }
  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
