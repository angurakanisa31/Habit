const mongoose = require("mongoose");
const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Signup", required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  color: { type: String, default: "#6366f1" }, // Hex color code or Tailwind name
  completedDates: { type: [String], default: [] }, // Array of YYYY-MM-DD strings
  createdAt: { type: Date, default: Date.now }
});
const Habit = mongoose.model("Habit", habitSchema);
module.exports = Habit;
