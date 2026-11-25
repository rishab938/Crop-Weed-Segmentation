import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUser } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cw-theme') || 'dark';
  });

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Default to false — users must explicitly log in.
    // Landing page → Login → Dashboard is the correct flow.
    return localStorage.getItem('cw-auth') === 'true';
  });

  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('cw-projects');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addProject = (projectData) => {
    const newProject = {
      id: `proj_${Date.now()}`,
      status: 'processing',
      date: new Date().toISOString().split('T')[0],
      images: 0,
      weedCoverage: null,
      fieldSize: 10.0,
      analysisId: 'ana_01',
      ...projectData,
    };
    setProjects(prev => {
      const updated = [newProject, ...prev];
      try {
        localStorage.setItem('cw-projects', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to store project', e);
      }
      return updated;
    });
    return newProject;
  };

  const removeProject = (id) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('cw-projects', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove project', e);
      }
      return updated;
    });
  };

  const updateProject = (id, updates) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === id || p.analysisId === id || (!id && prev.indexOf(p) === 0)) {
          return { ...p, ...updates };
        }
        return p;
      });
      try {
        localStorage.setItem('cw-projects', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update project', e);
      }
      return updated;
    });
  };

  const [activeImage, setActiveImage] = useState(() => {
    return sessionStorage.getItem('cw-active-image') || null;
  });
  const [activeProjectName, setActiveProjectName] = useState(() => {
    return sessionStorage.getItem('cw-active-project-name') || '';
  });
  const [activeFieldName, setActiveFieldName] = useState(() => {
    return sessionStorage.getItem('cw-active-field-name') || '';
  });

  // Real model analysis results — populated when the backend runs inference
  const [analysisResult, setAnalysisResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem('cw-analysis-result');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const storeAnalysisResult = (result) => {
    setAnalysisResult(result);
    try {
      if (result) sessionStorage.setItem('cw-analysis-result', JSON.stringify(result));
      else sessionStorage.removeItem('cw-analysis-result');
    } catch (e) { console.warn('Could not persist analysis result', e); }
  };

  const setAnalysisContext = ({ image, projectName, fieldName }) => {
    if (image !== undefined) {
      setActiveImage(image);
      try {
        if (image) sessionStorage.setItem('cw-active-image', image);
        else sessionStorage.removeItem('cw-active-image');
      } catch (e) {
        console.warn('Storage quota warning', e);
      }
    }
    if (projectName !== undefined) {
      setActiveProjectName(projectName);
      try { sessionStorage.setItem('cw-active-project-name', projectName); } catch (e) {}
    }
    if (fieldName !== undefined) {
      setActiveFieldName(fieldName);
      try { sessionStorage.setItem('cw-active-field-name', fieldName); } catch (e) {}
    }
  };

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
      projects,
      setProjects,
      addProject,
      removeProject,
      updateProject,
      activeImage,
      setActiveImage,
      activeProjectName,
      setActiveProjectName,
      activeFieldName,
      setActiveFieldName,
      setAnalysisContext,
      analysisResult,
      storeAnalysisResult,
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
