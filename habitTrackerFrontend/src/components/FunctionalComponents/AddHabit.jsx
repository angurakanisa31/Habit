import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AddHabit = ({ user, fetchHabits, addToast }) => {
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1'); // default indigo
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const colors = [
    { value: '#6366f1', label: 'Indigo' },
    { value: '#2dd4bf', label: 'Teal' },
    { value: '#34d399', label: 'Emerald' },
    { value: '#fb923c', label: 'Orange' },
    { value: '#f43f5e', label: 'Rose' },
    { value: '#a855f7', label: 'Purple' }
  ];

  const handleAddHabit = async (event) => {
    event.preventDefault();
    if (!habitName.trim()) {
      addToast("Habit name is required", "warning");
      return;
    }

    setLoading(true);
    try {
      await api.post('/addhabit', {
        userId: user.id,
        habitName: habitName.trim(),
        description: description.trim(),
        color: selectedColor
      });
      addToast(`Habit "${habitName}" added successfully!`, "success");
      await fetchHabits(); // refresh parent habit list
      navigate('/HabitTracker');
    } catch (err) {
      console.error("Add Habit Error:", err);
      const errMsg = err.response?.data?.error || "Error adding habit. Please try again.";
      addToast(errMsg, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel" style={{ maxWidth: '500px', padding: '2.5rem' }}>
        <div className="auth-header">
          <h2 className="auth-title">Add New Habit</h2>
          <p className="auth-subtitle">Define a new daily routine to begin tracking</p>
        </div>

        <form onSubmit={handleAddHabit}>
          <div className="form-group">
            <label>Habit Name</label>
            <input 
              className="form-control"
              type="text" 
              value={habitName} 
              onChange={(e) => setHabitName(e.target.value)} 
              placeholder="e.g., Drink 3L Water, Meditate"
              maxLength={40}
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <input 
              className="form-control"
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g., Morning routine after waking up"
              maxLength={100}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Theme Accent Color</label>
            <div className="color-selector">
              {colors.map((c) => (
                <div
                  key={c.value}
                  className={`color-option ${selectedColor === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value, color: c.value }}
                  onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={() => navigate('/HabitTracker')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-accent" 
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHabit;
