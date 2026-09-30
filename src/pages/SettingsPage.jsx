import React, { useState } from 'react';
import {
  User, Palette, Bell, Key, Shield, Sun, Moon,
  Save, Check, Copy, ExternalLink, Laptop
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function SettingsPage() {
  const { user, theme, toggleTheme, addToast } = useApp();

  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Rishab Verma',
    email: user?.email || 'rishab@cropweedai.com',
    role: user?.role || 'Senior Agronomist',
    organization: 'Verma AgTech & Field Solutions',
  });

  const [notifications, setNotifications] = useState({
    pipelineSuccess: true,
    pipelineFailure: true,
    weeklyDigest: false,
    treatmentAlerts: true,
  });

  const [apiKey] = useState('cw_live_89f0293da82bc190349aef902');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    addToast('Profile changes saved successfully!', 'success');
  };

  const handleCopyApiKey = () => {
    navigator.clipboard?.writeText(apiKey);
    addToast('API key copied to clipboard', 'info');
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Account & Workspace Settings
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Manage your agronomist profile, interface theme preferences, notifications, and drone API keys
        </p>
      </div>

      {/* Main Grid: Left Nav, Right Tab Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Left Nav Tabs */}
        <div className="card settings-nav" style={{ padding: 12, height: 'fit-content' }}>
          <button
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={18} /> Appearance
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Key size={18} /> Drone API & Webhooks
          </button>
        </div>

        {/* Right Tab Content Card */}
        <div className="card" style={{ padding: 28 }}>
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 600 }}>Agronomist Profile</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Your personal details appear on signed field analysis reports and shared PDF exports.
              </p>

              {/* Avatar section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-dim)' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--lime)',
                  color: '#0b1209',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}>
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => addToast('Avatar upload simulated', 'info')}>
                    Change Photo
                  </button>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    JPG, PNG or GIF. Max size 2MB.
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Professional Role</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.role}
                    onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Organization / Farm Entity</label>
                  <input
                    type="text"
                    className="input"
                    value={profileData.organization}
                    onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* 2. Appearance Tab */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 600 }}>Theme & Appearance</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Choose your preferred visual presentation. Changes apply instantly across the whole application.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Dark Theme Option */}
                <div
                  onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--r-lg)',
                    border: theme === 'dark' ? '2px solid var(--lime)' : '1px solid var(--border-dim)',
                    background: '#0b1209',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: theme === 'dark' ? '0 0 16px rgba(132,204,22,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f0f7e8', fontWeight: 600 }}>
                      <Moon size={18} color="var(--lime)" /> Dark Forest (Default)
                    </div>
                    {theme === 'dark' && <span className="badge badge-lime">Active</span>}
                  </div>
                  <div style={{ height: 60, borderRadius: 6, background: '#111a0f', border: '1px solid rgba(132,204,22,0.15)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--lime)' }} />
                    <div style={{ height: 8, width: 80, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }} />
                  </div>
                </div>

                {/* Light Theme Option */}
                <div
                  onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--r-lg)',
                    border: theme === 'light' ? '2px solid var(--lime)' : '1px solid var(--border-dim)',
                    background: '#f5f7f2',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: theme === 'light' ? '0 0 16px rgba(132,204,22,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a2e0f', fontWeight: 600 }}>
                      <Sun size={18} color="var(--lime)" /> Clean Daylight
                    </div>
                    {theme === 'light' && <span className="badge badge-lime">Active</span>}
                  </div>
                  <div style={{ height: 60, borderRadius: 6, background: '#ffffff', border: '1px solid rgba(100,150,60,0.2)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--lime)' }} />
                    <div style={{ height: 8, width: 80, borderRadius: 4, background: 'rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 600 }}>Notification Preferences</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Control when and how you receive alerts regarding processing status and analysis deliverables.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Pipeline Completion Alert</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Notify me as soon as orthomosaic stitching and weed analysis finish</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pipelineSuccess}
                    onChange={(e) => setNotifications({ ...notifications, pipelineSuccess: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--lime)' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Pipeline Errors & Overlap Warnings</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Alert when drone frames fail validation or keypoint matching thresholds</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pipelineFailure}
                    onChange={(e) => setNotifications({ ...notifications, pipelineFailure: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--lime)' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Weekly Farm Agronomy Digest</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Summary of weed trends, chemical savings, and acreage covered</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyDigest}
                    onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--lime)' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => addToast('Notification preferences updated!', 'success')}
                >
                  <Save size={16} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* 4. API & Integrations Tab */}
          {activeTab === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 600 }}>Drone API & Autonomous Controller Webhooks</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Authenticate programmatic survey uploads and export spray prescriptions to ground stations.
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Live REST API Token</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    readOnly
                    value={apiKey}
                    className="input"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <button className="btn btn-secondary" onClick={handleCopyApiKey}>
                    <Copy size={16} /> Copy
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Never share your production API key in public client-side repositories.
                </span>
              </div>

              <div className="input-group" style={{ marginTop: 8 }}>
                <label className="input-label">QGroundControl / Mission Planner Webhook URL</label>
                <input
                  type="text"
                  readOnly
                  value="https://api.cropweedai.com/v1/missions/wp_export?token=cw_live_89f02"
                  className="input"
                  style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                />
              </div>

              <div className="info-card" style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                  SDK Documentation Available
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Python and Node.js SDKs support automated geotagged image ingestion directly from cloud storage buckets (AWS S3, Google Cloud Storage).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
