import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const HabitTracker = ({ user, habits, fetchHabits, addToast }) => {
  const navigate = useNavigate();

  const [editingHabit, setEditingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditDescription(habit.description || '');
    setEditColor(habit.color || '#6366f1');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      addToast("Habit name is required", "warning");
      return;
    }
    try {
      await api.put(`/edithabit/${editingHabit._id}`, {
        userId: user.id,
        name: editName.trim(),
        description: editDescription.trim(),
        color: editColor
      });
      addToast(`Habit "${editName}" updated successfully!`, "success");
      setEditingHabit(null);
      await fetchHabits();
    } catch (err) {
      console.error(err);
      addToast("Failed to update habit", "danger");
    }
  };

  const handleDelete = async (habitId) => {
    const habitName = habits.find(h => h._id === habitId)?.name || 'this habit';
    if (window.confirm(`Are you sure you want to delete "${habitName}"? This will delete all completion history.`)) {
      try {
        await api.delete(`/deletehabit/${habitId}?userId=${user.id}`);
        addToast(`Habit "${habitName}" deleted successfully.`, "success");
        await fetchHabits();
      } catch (err) {
        console.error(err);
        addToast("Failed to delete habit", "danger");
      }
    }
  };

  // Format date in YYYY-MM-DD
  const getLocalDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());

  // Generate week dates (Sunday to Saturday of the current week)
  const getWeekDays = () => {
    const current = new Date();
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - current.getDay()); // Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Generate last 30 days for history heatmap
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      days.push(day);
    }
    return days;
  };

  const last30Days = getLast30Days();

  // Toggle habit completion on a specific date
  const handleToggle = async (habitId, dateStr) => {
    try {
      const response = await api.post('/toggleCompletion', {
        userId: user.id,
        habitId,
        date: dateStr
      });
      
      const { completedDates, currentStreak } = response.data;
      const habitName = habits.find(h => h._id === habitId)?.name || 'Habit';
      
      const isNowCompleted = completedDates.includes(dateStr);
      if (isNowCompleted) {
        addToast(`Completed "${habitName}" for ${dateStr}!`, "success");
      } else {
        addToast(`Unchecked "${habitName}" for ${dateStr}.`, "info");
      }
      
      await fetchHabits(); // reload habits to update streaks & stats
    } catch (err) {
      console.error("Toggle Error:", err);
      addToast("Failed to update progress.", "danger");
    }
  };

  // Run desktop push notifications once per dashboard session
  useEffect(() => {
    if (habits && habits.length > 0 && 'Notification' in window) {
      if (Notification.permission === 'granted' && !window.notificationSentThisSession) {
        window.notificationSentThisSession = true;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);
        
        let missedList = [];
        let pendingCount = 0;
        
        habits.forEach(habit => {
          const completedDates = habit.completedDates || [];
          if (!completedDates.includes(todayStr)) {
            pendingCount++;
          }
          
          const createdDateStr = habit.createdAt ? getLocalDateStr(new Date(habit.createdAt)) : '';
          if (!completedDates.includes(yesterdayStr) && createdDateStr && createdDateStr <= yesterdayStr) {
            missedList.push(habit.name);
          }
        });
        
        if (missedList.length > 0) {
          new Notification("HabitSphere Warning", {
            body: `You missed checking off "${missedList.slice(0, 2).join(', ')}${missedList.length > 2 ? '...' : ''}" yesterday! Get back on track today.`,
            icon: '/favicon.ico'
          });
        } else if (pendingCount > 0) {
          new Notification("HabitSphere Reminder", {
            body: `You have ${pendingCount} habit${pendingCount > 1 ? 's' : ''} remaining to complete today. Don't break your streak!`,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [habits]);

  // Statistics calculations
  const totalHabits = habits.length;
  
  const completedToday = habits.filter(h => 
    (h.completedDates || []).includes(todayStr)
  ).length;

  const longestStreak = habits.reduce((max, h) => 
    h.bestStreak > max ? h.bestStreak : max
  , 0);

  // Compute overall weekly completion rate
  const getWeeklyCompletionRate = () => {
    if (totalHabits === 0) return 0;
    
    let totalChecksPossible = totalHabits * 7;
    let actualChecks = 0;
    
    const weekDateStrings = weekDays.map(d => getLocalDateStr(d));
    
    habits.forEach(habit => {
      const completedDates = habit.completedDates || [];
      completedDates.forEach(date => {
        if (weekDateStrings.includes(date)) {
          actualChecks++;
        }
      });
    });
    
    return Math.round((actualChecks / totalChecksPossible) * 100);
  };

  const weeklyCompletionRate = getWeeklyCompletionRate();

  return (
    <div className="app-container">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2.5rem', animation: 'fadeIn 0.5s ease-out' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
          Hello, {user.firstName || 'User'}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {totalHabits === 0 
            ? "Welcome to HabitSphere! Let's add your first habit to begin your journey." 
            : completedToday === totalHabits 
              ? "Incredible work! You've completed all of your habits for today! 🎉" 
              : `You have completed ${completedToday} of ${totalHabits} habits today. Keep pushing! 🔥`}
        </p>
      </div>

      {/* Quick Statistics Row */}
      <div className="stats-row">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            📋
          </div>
          <div className="stat-info">
            <p>Active Habits</p>
            <h3>{totalHabits}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--success)' }}>
            ✅
          </div>
          <div className="stat-info">
            <p>Done Today</p>
            <h3>{completedToday} / {totalHabits}</h3>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--warning)' }}>
            ⚡
          </div>
          <div className="stat-info">
            <p>Week Progress</p>
            <h3>{weeklyCompletionRate}%</h3>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            🔥
          </div>
          <div className="stat-info">
            <p>Best Streak</p>
            <h3>{longestStreak} days</h3>
          </div>
        </div>
      </div>

      {/* Habits Section */}
      <div className="habits-header">
        <h2>Your Routines</h2>
      </div>

      {totalHabits === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No habits registered yet.</p>
          <button className="btn" onClick={() => navigate('/AddHabit')}>Create My First Habit</button>
        </div>
      ) : (
        <div className="habits-container">
          {habits.map((habit, idx) => {
            const completedDates = habit.completedDates || [];
            
            // Calculate habit's compliance rate for this week
            const weekChecks = weekDays.filter(d => 
              completedDates.includes(getLocalDateStr(d))
            ).length;
            const habitWeekPct = Math.round((weekChecks / 7) * 100);

            return (
              <div key={habit._id} className="habit-card glass-panel" style={{ animationDelay: `${idx * 0.1}s` }}>
                
                {/* 1. Habit Meta Info */}
                <div className="habit-info-section">
                  <div className="habit-name-tag">
                    <span className="color-dot" style={{ color: habit.color, backgroundColor: habit.color }} />
                    <h3 style={{ fontSize: '1.25rem' }}>{habit.name}</h3>
                  </div>
                  {habit.description && (
                    <p className="habit-desc">{habit.description}</p>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <span className="habit-streak-badge">
                      🔥 {habit.currentStreak || 0}d streak
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Best: {habit.bestStreak || 0}d
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                      <button
                        onClick={() => openEditModal(habit)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'var(--text-muted)' }}
                        title="Edit Habit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(habit._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: 'rgba(244, 63, 94, 0.7)' }}
                        title="Delete Habit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Weekly Tracker Row */}
                <div className="week-grid">
                  {weekDays.map(day => {
                    const dateStr = getLocalDateStr(day);
                    const isCompleted = completedDates.includes(dateStr);
                    const isToday = dateStr === todayStr;
                    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    
                    return (
                      <div key={dateStr} className="day-column">
                        <span className="day-label" style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isToday ? '700' : '500' }}>
                          {dayLabels[day.getDay()]}
                        </span>
                        <button
                          className={`day-check-btn ${isCompleted ? 'completed' : ''}`}
                          style={{
                            '--btn-glow': isCompleted ? `${habit.color}50` : 'transparent',
                            backgroundColor: isCompleted ? habit.color : 'rgba(255, 255, 255, 0.03)'
                          }}
                          onClick={() => handleToggle(habit._id, dateStr)}
                          title={`${isCompleted ? 'Completed' : 'Pending'} on ${dateStr}`}
                        >
                          {isCompleted ? '✓' : '·'}
                        </button>
                        <span style={{ fontSize: '0.65rem', color: isToday ? '#fff' : 'var(--text-muted)' }}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Progress Ring/Percent */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: habit.color }}>
                    {habitWeekPct}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    This Week
                  </div>
                </div>

                {/* 4. Interactive 30-Day Contribution Heatmap */}
                <div className="heatmap-container" style={{ gridColumn: '1 / -1' }}>
                  <div className="heatmap-title">Completions History (Last 30 Days)</div>
                  <div className="heatmap-grid">
                    {last30Days.map(day => {
                      const dateStr = getLocalDateStr(day);
                      const isCompleted = completedDates.includes(dateStr);
                      const isToday = dateStr === todayStr;
                      
                      return (
                        <div
                          key={dateStr}
                          className={`heatmap-cell ${isCompleted ? 'completed' : ''}`}
                          style={{
                            backgroundColor: isCompleted ? habit.color : 'rgba(255,255,255,0.05)',
                            border: isToday ? '1px solid #fff' : 'none'
                          }}
                          data-date={`${dateStr}${isCompleted ? ' (Completed)' : ' (Unchecked)'}`}
                          onClick={() => handleToggle(habit._id, dateStr)}
                        />
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <h2 className="auth-title" style={{ marginBottom: '1.5rem' }}>Edit Habit</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Habit Name</label>
                <input
                  className="form-control"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  maxLength={40}
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  className="form-control"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Theme Accent Color</label>
                <div className="color-selector">
                  {[
                    '#6366f1', // Indigo
                    '#2dd4bf', // Teal
                    '#34d399', // Emerald
                    '#fb923c', // Orange
                    '#f43f5e', // Rose
                    '#a855f7'  // Purple
                  ].map((c) => (
                    <div
                      key={c}
                      className={`color-option ${editColor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c, color: c }}
                      onClick={() => setEditColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingHabit(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  style={{ flex: 2 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
