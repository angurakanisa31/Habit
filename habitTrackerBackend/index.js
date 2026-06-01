const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Signup = require("./models/signupSchema");
const Habit = require("./models/habitSchema");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connection Successful"))
  .catch((err) => console.log("MongoDB Connection Unsuccessful", err));

// Helper to format date in local YYYY-MM-DD
const getLocalDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to send email reminders
async function sendEmailReminder(user, habits) {
  const todayStr = getLocalDateStr(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);
  
  let completedToday = [];
  let pendingToday = [];
  let missedYesterday = [];
  
  habits.forEach(habit => {
    const dates = habit.completedDates || [];
    const hasToday = dates.includes(todayStr);
    const hasYesterday = dates.includes(yesterdayStr);
    
    if (hasToday) {
      completedToday.push(habit);
    } else {
      pendingToday.push(habit);
    }
    
    const createdStr = habit.createdAt ? getLocalDateStr(new Date(habit.createdAt)) : '';
    if (!hasYesterday && createdStr && createdStr <= yesterdayStr) {
      missedYesterday.push(habit);
    }
  });

  // Only send email if there are pending habits or yesterday missed habits
  if (pendingToday.length === 0 && missedYesterday.length === 0) return;

  const pendingHtml = pendingToday.map(h => `<li><strong>${h.name}</strong>${h.description ? ` - <em>${h.description}</em>` : ''} (🔥 ${h.currentStreak || 0}d streak)</li>`).join('');
  const completedHtml = completedToday.map(h => `<li><strong>${h.name}</strong> - Checked off! ✓</li>`).join('');
  const missedHtml = missedYesterday.map(h => `<li><strong>${h.name}</strong></li>`).join('');

  let htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0a0d1a; color: #f3f4f6; padding: 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08);">
      <h2 style="color: #2dd4bf; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-top: 0;">HabitSphere Daily Reminder</h2>
      <p>Hello ${user.firstName || 'User'},</p>
      <p>Here is your daily routine digest to keep your positive momentum going today!</p>
      
      ${pendingToday.length > 0 ? `
        <h3 style="color: #fbbf24; margin-top: 20px; margin-bottom: 5px;">⚡ Pending for Today</h3>
        <ul style="margin: 0; padding-left: 20px;">${pendingHtml}</ul>
      ` : ''}

      ${completedToday.length > 0 ? `
        <h3 style="color: #34d399; margin-top: 20px; margin-bottom: 5px;">✓ Completed Today</h3>
        <ul style="margin: 0; padding-left: 20px;">${completedHtml}</ul>
      ` : ''}

      ${missedYesterday.length > 0 ? `
        <h3 style="color: #f87171; margin-top: 20px; margin-bottom: 5px;">⚠️ Missed Yesterday</h3>
        <p style="margin: 0 0 5px 0;">Let's pick up the chain today and build your streak back up:</p>
        <ul style="margin: 0; padding-left: 20px;">${missedHtml}</ul>
      ` : ''}
      
      <p style="margin-top: 30px; font-size: 0.85em; color: #9ca3af; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; text-align: center;">
        Build habits. Break limits. Log back in to HabitSphere to check off your routines!
      </p>
    </div>
  `;

  // Fallback console log summary
  console.log("\n=== [Email Reminder Summary] ===");
  console.log(`To: ${user.email}`);
  console.log(`Subject: HabitSphere Daily Digest - ${pendingToday.length} Pending Tasks!`);
  console.log(`Pending: ${pendingToday.map(h => h.name).join(', ')}`);
  console.log(`Missed Yesterday: ${missedYesterday.map(h => h.name).join(', ')}`);
  console.log("=================================\n");

  try {
    // Create Ethereal test SMTP account
    let testAccount = await nodemailer.createTestAccount();
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 4000 // 4s timeout
    });

    let info = await transporter.sendMail({
      from: '"HabitSphere Reminders" <reminders@habitsphere.com>',
      to: user.email,
      subject: `HabitSphere Daily Digest - ${pendingToday.length} Pending Tasks!`,
      html: htmlBody,
    });

    console.log(`[Email Reminder] Sent successfully to ${user.email}`);
    console.log(`[Email Reminder] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return nodemailer.getTestMessageUrl(info);
  } catch (err) {
    console.warn(`[Email Reminder] SMTP connection failed (timeout on port 587). Handled gracefully with fallback console logging.`);
  }
}

// Helper to calculate streaks
function calculateStreaks(completedDates) {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }
  
  // Remove duplicates and sort in ascending order
  const uniqueDates = [...new Set(completedDates)].sort();
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  const parseDate = (dStr) => {
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const todayStr = getLocalDateStr(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  const hasToday = uniqueDates.includes(todayStr);
  const hasYesterday = uniqueDates.includes(yesterdayStr);

  // Calculate best streak
  let prevDate = null;
  for (let i = 0; i < uniqueDates.length; i++) {
    const currDate = parseDate(uniqueDates[i]);
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    prevDate = currDate;
  }
  if (tempStreak > bestStreak) {
    bestStreak = tempStreak;
  }

  // Calculate current streak
  if (hasToday || hasYesterday) {
    let checkDate = hasToday ? new Date() : yesterday;
    let checkStr = getLocalDateStr(checkDate);
    while (uniqueDates.includes(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = getLocalDateStr(checkDate);
    }
  }

  return { currentStreak, bestStreak };
}

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
    res.status(400).json({ error: "Signup Unsuccessful", details: err.message });
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
        res.status(200).json({ 
          message: "Login Successful", 
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email
          }
        });
      } else {
        res.status(401).send("Login Unsuccessful");
      }
    } else {
      res.status(401).send("User not found, please signup!");
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Error during login", details: err.message });
  }
});

// Add Habit
app.post("/addhabit", async (req, res) => {
  const { userId, habitName, description, color } = req.body;
  try {
    const newHabit = new Habit({
      userId,
      name: habitName,
      description: description || "",
      color: color || "#6366f1",
      completedDates: [],
    });
    await newHabit.save();
    res.status(201).json({ message: "Habit added successfully", habit: newHabit });
  } catch (err) {
    console.error("Add Habit Error:", err);
    res.status(500).json({ error: "Error adding habit", details: err.message });
  }
});

// Get all habits for a user
app.get("/habits/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const habits = await Habit.find({ userId });
    const enrichedHabits = habits.map(habit => {
      const { currentStreak, bestStreak } = calculateStreaks(habit.completedDates);
      return {
        ...habit.toObject(),
        currentStreak,
        bestStreak
      };
    });
    
    // Check if we should trigger a daily email digest
    const todayStr = getLocalDateStr(new Date());
    const user = await Signup.findById(userId);
    if (user && user.lastEmailSentDate !== todayStr && enrichedHabits.length > 0) {
      // Trigger email sending asynchronously
      sendEmailReminder(user, enrichedHabits).then(async (previewUrl) => {
        // Save date to throttle emails to once per day
        user.lastEmailSentDate = todayStr;
        await user.save();
      }).catch(err => console.error("Email service error:", err));
    }
    
    res.status(200).json(enrichedHabits);
  } catch (err) {
    console.error("Get Habits Error:", err);
    res.status(500).json({ error: "Error fetching habits", details: err.message });
  }
});

// Toggle habit completion
app.post("/toggleCompletion", async (req, res) => {
  const { userId, habitId, date } = req.body; 
  try {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    const dateIndex = habit.completedDates.indexOf(date);
    if (dateIndex > -1) {
      habit.completedDates.splice(dateIndex, 1);
    } else {
      habit.completedDates.push(date);
    }
    
    await habit.save();
    const { currentStreak, bestStreak } = calculateStreaks(habit.completedDates);
    res.status(200).json({ 
      message: "Habit progress updated successfully",
      completedDates: habit.completedDates,
      currentStreak,
      bestStreak
    });
  } catch (err) {
    console.error("Toggle Completion Error:", err);
    res.status(500).json({ error: "Error updating habit progress", details: err.message });
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

// Edit Habit
app.put("/edithabit/:habitId", async (req, res) => {
  const { habitId } = req.params;
  const { name, description, color, userId } = req.body;
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, userId },
      { name, description, color },
      { new: true }
    );
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    res.status(200).json({ message: "Habit updated successfully", habit });
  } catch (err) {
    console.error("Edit Habit Error:", err);
    res.status(500).json({ error: "Error updating habit", details: err.message });
  }
});

// Delete Habit
app.delete("/deletehabit/:habitId", async (req, res) => {
  const { habitId } = req.params;
  const { userId } = req.query;
  try {
    const result = await Habit.findOneAndDelete({ _id: habitId, userId });
    if (!result) {
      return res.status(404).json({ error: "Habit not found" });
    }
    res.status(200).json({ message: "Habit deleted successfully" });
  } catch (err) {
    console.error("Delete Habit Error:", err);
    res.status(500).json({ error: "Error deleting habit", details: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server Started");
});
