import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Header } from './AppLayout';
import { ToastContainer } from '../ui/Toast';
import { useApp } from '../../context/AppContext';

export function ProtectedLayout() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        mobile
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
