var express = require("express");
var router = express.Router({mergeParams : true});
var Campsite = require ("../models/campsite");
var Comment = require ("../models/comment");
var User = require("../models/user");


router.get("/:id", function(req,res){
	
	User.findById(req.params.id).exec(function(err, foundUser){
		if (err){
			console.log(err);
		}
		else{
				Campsite.find().where("author.id").equals(foundUser._id).exec((err, allCampsites) => {
					if (err)
					{
						console.log(err);
					}
					else
					{	
						res.render("userProfile", {campsites : allCampsites, user : foundUser});

					}
				});
			}
		});
});



module.exports = router;