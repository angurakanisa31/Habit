const mongoose = require("mongoose");
const signupSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  password: String,
  lastEmailSentDate: { type: String, default: "" }
});
const Signup = mongoose.model("Signup", signupSchema);
module.exports = Signup;
