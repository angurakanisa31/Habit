import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AddHabit = ({ onAddHabit }) => {
  const [newHabit, setNewHabit] = useState('');

  const handleAddHabit = () => {
    onAddHabit(newHabit);
    setNewHabit('');
  };

  return (
    <div>
      <h2>This Page Belongs To Adding Daily Habits</h2>
      <input 
        type="text" 
        value={newHabit} 
        onChange={(e) => setNewHabit(e.target.value)} 
        placeholder="New Habit" 
      />
      <button onClick={handleAddHabit}>Add Habit</button>
      <ul>
        Move to Tracking: <li><Link to ='/HabitTracker' className="link">HabitTracker</Link></li>
      </ul>
    </div>
  );
};

export default AddHabit;
