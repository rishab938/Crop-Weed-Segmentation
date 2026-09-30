import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUser } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cw-theme') || 'dark';
  });

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('cw-auth');
    return auth === null ? true : auth === 'true';
  });

  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Soybean Patch B analysis is 67% complete', time: '10 min ago', read: false },
    { id: 2, text: 'Maize Block A report is ready for download', time: '2 hrs ago', read: false },
    { id: 3, text: 'Barley Survey pipeline failed at Field Map stage', time: 'Yesterday', read: true },
  ]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme to root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('cw-theme', theme);
  }, [theme]);

  // Restore session
  useEffect(() => {
    if (isAuthenticated) {
      setUser(mockUser);
    }
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const login = (email, password) => {
    // Mock authentication
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('cw-auth', 'true');
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('cw-auth');
  };

  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      user,
      isAuthenticated,
      login,
      logout,
      toasts,
      addToast,
      removeToast,
      notifications,
      markNotificationsRead,
      unreadCount,
      sidebarOpen,
      setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
