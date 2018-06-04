var express = require("express");
var router = express.Router({mergeParams : true});
var Campsite = require ("../models/campsite");
var Comment = require ("../models/comment");
var User = require("../models/user");


//New comment, GET
router.get("/new", isLoggedIn, function(req,res){
	Campsite.findById(req.params.id, function(err, campsite){
		if (err)
		{
			console.log(err);
		}
		else
		{	
			res.render("comments/new", {campsite : campsite});
		}
	})
});


//New comment, POST
router.post("/", isLoggedIn, function(req, res){
	Campsite.findById(req.params.id, function(err, campsite){
		if (err)
		{
			console.log(err);
			res.redirect("/campsites");
		} 
		else
		{
			Comment.create(req.body.comment, function(err, comment){
				if (err)
				{
					console.log(err);
				}
				else
				{

					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					campsite.comments.push(comment);
					campsite.save();
					req.flash("success", "Successfully added comment!");
					res.redirect("/campsites/" + campsite._id);
				}
			});
		}

	});
});


//Editing a comment
router.get("/:comment_id/edit", commentOwnershipAuthentication , function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if (err){
			res.redirect("back");
		}
		else
		{
			res.render("comments/edit", {campsite_id : req.params.id, comment: foundComment});

		}
	});
});


//Updating a Comment
router.put("/:comment_id", commentOwnershipAuthentication, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if (err){
			res.redirect("back");
		} else
		{
			res.redirect("/campsites/" + req.params.id);
		}
	});
});

//Deleting a Comment
router.delete("/:comment_id", commentOwnershipAuthentication,  function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if (err){
			res.redirect("back");
		}
		else
		{
			req.flash("success", "Comment Deleted!");
			res.redirect("/campsites/" + req.params.id);
		}

	});
});



//************ Middleware Functions :  **************

//Authentication to verify if the comment's owner is the user
function commentOwnershipAuthentication(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				req.flash("error", "Comment not found!");
				res.redirect("back");
			}  else {
				if(foundComment.author.id.equals(req.user._id)) {
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

module.exports = router;