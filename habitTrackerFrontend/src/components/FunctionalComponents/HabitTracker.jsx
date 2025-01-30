import React, { useState } from 'react';

const HabitTracker = ({ habits, toggleCompletion }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <h2>Track Your Habits</h2>
      <table>
        <thead>
          <tr>
            <th>Habit</th>
            {daysOfWeek.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit, habitIndex) => (
            <tr key={habitIndex}>
              <td>{habit.name}</td>
              {habit.progress.map((completed, dayIndex) => (
                <td key={dayIndex}>
                  <button onClick={() => toggleCompletion(habitIndex, dayIndex)}>
                    {completed ? '✅' : '❌'}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HabitTracker;
