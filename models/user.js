var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	firstName : String,
	lastName : String,
	email : {type : String, unique : true, required : true},
	resetPasswordToken : String,
	resetPasswordExpires : Date,
	username: String,
	password: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);