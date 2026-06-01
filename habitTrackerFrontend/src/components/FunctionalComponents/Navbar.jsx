import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout, habits, theme, toggleTheme }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format date in YYYY-MM-DD
  const getLocalDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute notifications based on habit completion data
  const getNotifications = () => {
    if (!habits || habits.length === 0) return [];
    
    const notificationsList = [];
    const todayStr = getLocalDateStr(new Date());
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    
    habits.forEach(habit => {
      const completedDates = habit.completedDates || [];
      const hasToday = completedDates.includes(todayStr);
      const hasYesterday = completedDates.includes(yesterdayStr);
      
      // 1. Pending for today
      if (!hasToday) {
        notificationsList.push({
          id: `${habit._id}-today`,
          type: 'info',
          message: `You have not completed "${habit.name}" today yet!`,
          time: 'Today'
        });
      }
      
      // 2. Missed yesterday (only if habit was created before/during yesterday)
      const createdDateStr = habit.createdAt ? getLocalDateStr(new Date(habit.createdAt)) : '';
      if (!hasYesterday && createdDateStr && createdDateStr <= yesterdayStr) {
        notificationsList.push({
          id: `${habit._id}-yesterday`,
          type: 'warning',
          message: `You missed your "${habit.name}" habit yesterday.`,
          time: 'Yesterday'
        });
      }
    });
    
    return notificationsList;
  };

  const notifications = getNotifications();

  return (
    <nav className="glass-nav">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          HabitSphere
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ul className="navbar-links">
            {user ? (
              <>
                <li>
                  <Link 
                    to="/HabitTracker" 
                    className={`navbar-item ${location.pathname === '/HabitTracker' ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/AddHabit" 
                    className={`navbar-item ${location.pathname === '/AddHabit' ? 'active' : ''}`}
                  >
                    + Add Habit
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    to="/" 
                    className={`navbar-item ${location.pathname === '/' ? 'active' : ''}`}
                  >
                    Signup
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/Login" 
                    className={`navbar-item ${location.pathname === '/Login' ? 'active' : ''}`}
                  >
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Theme Toggle Button */}
          <button
            className="bell-btn"
            onClick={toggleTheme}
            style={{ fontSize: '1.1rem' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Notification Bell Dropdown */}
              <div className="notification-bell-container" ref={dropdownRef}>
                <button 
                  className="bell-btn" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="Notifications"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {notifications.length > 0 && (
                    <span className="bell-badge">{notifications.length}</span>
                  )}
                </button>

                {showDropdown && (
                  <div className="notifications-dropdown glass-panel">
                    <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
                      Notifications
                    </h4>
                    {notifications.length === 0 ? (
                      <div className="notifications-empty">
                        All caught up! ✨
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`notification-item ${notif.type}`}>
                          <div className="notification-item-text">{notif.message}</div>
                          <div className="notification-item-time">{notif.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="user-menu">
                <span className="username-display">@{user.username}</span>
                <button 
                  onClick={onLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
