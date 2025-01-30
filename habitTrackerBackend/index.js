const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Signup = require("./models/signupSchema");
const Habit = require("./models/habitSchema");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connection Successful"))
  .catch((err) => console.log("MongoDB Connection Unsuccessful", err));

app.get("/", (req, res) => {
  res.send(
    "Welcome to Backend my friend\n Your RollerCoster starts from now on\n Fasten your codabase so you can catch up with what is being taught"
  );
});

// Signup
app.post("/signup", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer = new Signup({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
    });
    await newCustomer.save();
    res.status(201).send("Signup Successful");
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(400).send("Signup Unsuccessful", err);
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Signup.findOne({ email }); // Ensure correct model
    if (user) {
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (isPasswordCorrect) {
        const payload = { email: user.email };
        const token = jwt.sign(payload, process.env.SECRET_KEY, {
          expiresIn: "1h",
        });
        res.status(200).jsonp({ message: "Login Successful", token });
      } else {
        res.status(401).send("Login Unsuccessful");
      }
    } else {
      res.status(401).send("User not found, please signup!");
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send({ message: "Error during login" });
  }
});

// Add Habit
app.post("/addhabit", async (req, res) => {
  const { userId, habitName } = req.body;
  try {
    const newHabit = new Habit({
      userId,
      name: habitName,
      progress: new Array(7).fill(false),
    });
    await newHabit.save();
    res.status(201).send("Habit added successfully");
  } catch (err) {
    console.error("Add Habit Error:", err);
    res.status(500).send("Error adding habit", err);
  }
});

// Get all habits for a user
app.get("/habits/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const habits = await Habit.find({ userId });
    res.status(200).json(habits);
  } catch (err) {
    console.error("Get Habits Error:", err);
    res.status(500).send("Error fetching habits", err);
  }
});

// Toggle habit completion
app.post("/toggleCompletion", async (req, res) => {
  const { userId, habitId, dayIndex } = req.body; 
  try {
    const habit = await Habit.findOne({ _id: habitId, userId });
    habit.progress[dayIndex] = !habit.progress[dayIndex];
    await habit.save();
    res.status(200).send("Habit progress updated successfully");
  } catch (err) {
    console.error("Toggle Completion Error:", err);
    res.status(500).send("Error updating habit progress", err);
  }
});

// Get Signup details
app.get("/getsignupdet", async (req, res) => {
  try {
    const signUpdet = await Signup.find();
    res.status(200).json(signUpdet);
  } catch (err) {
    console.error("Get Signup Details Error:", err);
    res.status(500).send("Error fetching signup details", err);
  }
});

app.listen(5000, () => {
  console.log("Server Started");
});
