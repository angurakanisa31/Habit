import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/FunctionalComponents/Navbar';
import Signup from './components/FunctionalComponents/Signup';
import Login from './components/FunctionalComponents/Login';
import AddHabit from './components/FunctionalComponents/AddHabit';
import HabitTracker from './components/FunctionalComponents/HabitTracker';
import './App.css'
const App = () => {
  const [habits, setHabits] = useState([]);

  const handleSignup = (userData) => {
    console.log("User signed up with data:", userData);
  };

  const handleLogin = (userData) => {
    console.log("User logged in with data:", userData);
  };

  const addHabit = (habitName) => {
    setHabits([...habits, { name: habitName, progress: [false, false, false, false, false, false, false] }]);
  };

  const toggleCompletion = (habitIndex, dayIndex) => {
    const newHabits = [...habits];
    newHabits[habitIndex].progress[dayIndex] = !newHabits[habitIndex].progress[dayIndex];
    setHabits(newHabits);
  };

  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Signup onSignup={handleSignup} />} />
          <Route path='/Login' element={<Login onLogin={handleLogin} />} />
          <Route path='/AddHabit' element={<AddHabit onAddHabit={addHabit} />} />
          <Route path='/HabitTracker' element={<HabitTracker habits={habits} toggleCompletion={toggleCompletion} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
