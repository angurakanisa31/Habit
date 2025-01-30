const mongoose = require("mongoose");
const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup" },
  name: String,
  progress:{type: [Boolean],default:[]}
});
const Habit = mongoose.model("Habit", habitSchema);
module.exports = Habit;
