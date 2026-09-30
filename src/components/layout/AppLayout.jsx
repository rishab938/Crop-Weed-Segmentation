import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, PlusCircle, FileText,
  Settings, LogOut, Leaf, Bell, Search, Sun, Moon,
  Menu, X, ChevronRight, User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/projects',  label: 'Projects',     icon: FolderKanban, badge: '6' },
  { to: '/analysis/new', label: 'New Analysis', icon: PlusCircle },
  { to: '/reports',   label: 'Reports',      icon: FileText },
  { to: '/settings',  label: 'Settings',     icon: Settings },
];

function Logo({ collapsed }) {
  return (
    <Link to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>
      <div className="sidebar-logo-icon">
        <Leaf size={18} color="#0b1209" strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <div className="sidebar-logo-text">
          Crop & <span>Weed AI</span>
        </div>
      )}
    </Link>
  );
}

export function Sidebar({ mobile = false, onClose }) {
  const location = useLocation();
  const { user, logout, sidebarOpen } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`sidebar ${mobile && sidebarOpen ? 'open' : ''}`}>
      <Logo />

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main</span>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="sidebar-item-badge">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.initials || 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role || 'Member'}</div>
          </div>
        </div>
        <button
          className="sidebar-item"
          onClick={handleLogout}
          style={{ width: '100%', textAlign: 'left' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function Header({ onMenuClick }) {
  const { theme, toggleTheme, unreadCount, notifications, markNotificationsRead, user } = useApp();
  const [searchVal, setSearchVal] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const handleNotifClick = () => {
    setShowNotifs(prev => !prev);
    if (!showNotifs) markNotificationsRead();
  };

  return (
    <header className="app-header">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={onMenuClick} style={{ display: 'flex' }}>
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="header-search">
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search projects, fields or reports…"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Theme toggle */}
        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="header-icon-btn" onClick={handleNotifClick} title="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute',
              top: '44px',
              right: 0,
              width: 320,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 300,
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All read</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-dim)',
                  background: !n.read ? 'var(--lime-dim)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>{n.text}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          className="header-avatar"
          onClick={() => navigate('/settings')}
          title="Profile settings"
        >
          {user?.initials || 'U'}
        </div>
      </div>
    </header>
  );
}
