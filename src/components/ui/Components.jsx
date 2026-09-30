import React from 'react';

export function ProgressBar({ value, max = 100, variant = 'default', height = 8, animated = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-bar-wrap" style={{ height }}>
      <div
        className={`progress-bar-fill ${variant}`}
        style={{ width: `${pct}%`, transition: animated ? 'width 0.6s ease' : 'none' }}
      />
    </div>
  );
}

export function StatCard({ label, value, change, changeLabel, icon: Icon, accent }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        {Icon && (
          <div style={{
            width: 36,
            height: 36,
            background: 'var(--lime-dim)',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lime)',
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>
        {value}
      </div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          <span>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>
          {changeLabel && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function Badge({ children, variant = 'muted', dot }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className={`status-dot ${variant === 'success' ? 'success' : variant === 'error' ? 'error' : variant === 'warning' ? 'warning' : 'pending'}`} />}
      {children}
    </span>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={`tab ${active === tab.value ? 'active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 16, rounded = false }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: rounded ? '50%' : 'var(--r-sm)',
      }}
    />
  );
}
