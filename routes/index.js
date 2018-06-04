var express = require("express");
var router = express.Router();
var passport = require("passport");
var Campsite = require ("../models/campsite");
var User = require("../models/user");


//Homepage, Search
router.get("/", function(req,res){
	let noMatch = null;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campsite.find({name: regex}, function(err, allCampsites) {
			if (err) { console.log(err); }
			else {
				if (allCampsites.length < 1) {
					noMatch = "No campgrounds found, please try again.";
				}
				res.render("campsites/index", { campsites: allCampsites, page: "campsites", noMatch: noMatch });  
			}
		});
	} else {
    // Get all camgrounds from DB
    Campsite.find({}, function(err, allCampsites) {
    	if (err) { console.log(err); }
    	else {
    		res.render("campsites/index", { campsites: allCampsites, page: "campsites", noMatch: noMatch });  
    	}
    }); 
}
});  



// Login, GET & POST
router.get("/login", function(req,res){
	res.render("login");
});


router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash("error", "Invalid username or password");
      return res.redirect("/login");
    }
    req.logIn(user, err => {
      if (err) { return next(err); }
      let redirectTo = req.session.redirectTo ? req.session.redirectTo : '/campsites';
      delete req.session.redirectTo;
      req.flash("success", "Good to see you again, " + user.firstName);
      res.redirect(redirectTo);
    });
  })(req, res, next);
});



//Register
router.get("/register", function(req, res){
	res.render("register");
});

router.post("/register", function(req, res){
	var firstname = req.body.firstName;
	var lastname = req.body.lastName;
	var email = req.body.email;
	var newUser = new User({ firstName : firstname , lastName : lastname, email : email, username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			return res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to Hidden Campers " + user.username);
			res.redirect("/campsites"); 
		});
	});
});

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully logged out!");
	res.redirect("/campsites");
});


module.exports = router;