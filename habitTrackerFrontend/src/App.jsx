import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/FunctionalComponents/Navbar';
import Signup from './components/FunctionalComponents/Signup';
import Login from './components/FunctionalComponents/Login';
import AddHabit from './components/FunctionalComponents/AddHabit';
import HabitTracker from './components/FunctionalComponents/HabitTracker';
import api, { getSessionUser, clearSession } from './utils/api';
import './App.css';

const App = () => {
  const [user, setUser] = useState(getSessionUser());
  const [habits, setHabits] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Sync theme with body class and localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Toast management
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch habits from database
  const fetchHabits = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/habits/${user.id}`);
      setHabits(response.data);
    } catch (err) {
      console.error("Error fetching habits:", err);
      addToast("Failed to fetch habits.", "danger");
    }
  };

  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    addToast(`Welcome back, ${userData.firstName}!`, "success");
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setHabits([]);
    addToast("Logged out successfully.", "info");
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={user} onLogout={handleLogout} habits={habits} theme={theme} toggleTheme={toggleTheme} />
        
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={user ? <Navigate to="/HabitTracker" /> : <Signup addToast={addToast} />} 
            />
            <Route 
              path="/Login" 
              element={user ? <Navigate to="/HabitTracker" /> : <Login onLoginSuccess={handleLoginSuccess} addToast={addToast} />} 
            />

            {/* Private protected routes */}
            <Route 
              path="/HabitTracker" 
              element={user ? (
                <HabitTracker 
                  user={user} 
                  habits={habits} 
                  fetchHabits={fetchHabits} 
                  addToast={addToast} 
                />
              ) : (
                <Navigate to="/Login" />
              )} 
            />
            
            <Route 
              path="/AddHabit" 
              element={user ? (
                <AddHabit 
                  user={user} 
                  fetchHabits={fetchHabits} 
                  addToast={addToast} 
                />
              ) : (
                <Navigate to="/Login" />
              )} 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {/* Custom Toast Container */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <span>{toast.message}</span>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
