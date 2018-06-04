var express = require("express");
var router = express.Router();
var Campsite = require ("../models/campsite");


//Image Upload Config
var multer = require('multer');
var storage = multer.diskStorage({
	filename: function(req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});
var imageFilter = function (req, file, cb) {
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
	cloud_name: 'hiddencampers', 
	api_key: 311281915568112, 
	api_secret: "EWWuFEZzy5wRLW-T4KszRouxdxg"
});


//Viewing all campsites, homepage
router.get("/", function(req,res){
	if (req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campsite.find({location : regex}, function(err, allCampsites){
			if (err){
				console.log(err);
			}
			else
				res.render("campsites/index",{campsites : allCampsites, currentUser : req.user});
		});
	}
	else
	{

		Campsite.find({}, function(err, allCampsites){
			if (err){
				console.log(err);
			}
			else
				res.render("campsites/index",{campsites : allCampsites, currentUser : req.user});
		});
	}
});


//Creating a new campsite, GET
router.get("/add", isLoggedIn, function(req,res){
	res.render("campsites/new");
});

//Creating a new campsite, POST
router.post("/", isLoggedIn, upload.single('image'), function(req, res) {
	cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
		if(err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		req.body.campsite.image = result.secure_url;
		req.body.campsite.imageId = result.public_id;
		req.body.campsite.author = {
			id: req.user._id,
			username: req.user.username
		}
		Campsite.create(req.body.campsite, function(err, campsite) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/campsites/' + campsite.id);
		});
	});
});

// Show campsite
router.get("/:id", function(req,res){
	Campsite.findById(req.params.id).populate("comments").exec(function(err, foundCampsite){
		if(err){
			console.log(err);
		} else {
			res.render("campsites/show", {campsite : foundCampsite});
		}
	});
});


//Editing a campsite
router.get("/:id/edit", campsiteOwnershipAuthentication,  function(req, res){
	Campsite.findById(req.params.id, function(err, foundCampsite){
		res.render("campsites/edit", {campsite : foundCampsite});
	});
});


//Updating a campsite
router.put("/:id", upload.single('image'), function(req, res){
	Campsite.findById(req.params.id, async function(err, campsite){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			if (req.file) {
				try {
					await cloudinary.v2.uploader.destroy(campsite.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					campsite.imageId = result.public_id;
					campsite.image = result.secure_url;
				} catch(err) {
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}
			campsite.name = req.body.campsite.name;
			campsite.description = req.body.campsite.description;
			campsite.location = req.body.campsite.location;
			campsite.features = req.body.campsite.features;
			campsite.activities = req.body.campsite.activities;
			campsite.save();
			req.flash("success","Successfully Updated!");
			res.redirect("/campsites/" + campsite._id);
		}
	});
});


//Deleting a campsite
router.delete('/:id', function(req, res) {
	Campsite.findById(req.params.id, async function(err, campsite) {
		if(err) {
			req.flash("error", err.message);
			return res.redirect("back");
		}
		try {
			await cloudinary.v2.uploader.destroy(campsite.imageId);
			campsite.remove();
			req.flash('success', 'Campsite deleted successfully!');
			res.redirect('/campsites');
		} catch(err) {
			if(err) {
				req.flash("error", err.message);
				return res.redirect("back");
			}
		}
	});
});


//************ Middleware Functions :  **************
//Authentication to verify if the user is a campsite's owner
function campsiteOwnershipAuthentication(req, res, next){
	if(req.isAuthenticated()){
		Campsite.findById(req.params.id, function(err, foundCampsite){
			if(err){
				req.flash("error", "Campsite not found!");
				res.redirect("back");
			}  else {
				if(foundCampsite.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You do not have permission to do that!");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that!");
		res.redirect("back");
	}
}


//Authentication to verify if the user is logged in
function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that!");
	res.redirect("/login");
}

//Search
function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;