const mongoose = require("mongoose");
const signupSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  password: String,
});
const Signup = mongoose.model("Signup", signupSchema);
module.exports = Signup;
