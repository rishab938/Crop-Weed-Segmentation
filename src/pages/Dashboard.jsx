import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Image, Layers, TrendingDown, Plus,
  ArrowRight, CheckCircle, AlertCircle, Info, Clock,
  ExternalLink, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { StatCard, Badge } from '../components/ui/Components';
import {
  mockDashboardStats, mockProjects, mockWeedTrend, mockActivity
} from '../data/mockData';
import { useApp } from '../context/AppContext';

const statusConfig = {
  completed: { label: 'Completed', variant: 'success' },
  processing: { label: 'Processing', variant: 'info' },
  draft:      { label: 'Draft',     variant: 'muted' },
  failed:     { label: 'Failed',    variant: 'error' },
};

const activityIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const activityColors = {
  success: 'var(--lime)',
  error:   'var(--error)',
  info:    'var(--info)',
};

export default function Dashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const recentProjects = mockProjects.slice(0, 4);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="fade-up">
      {/* Greeting Row */}
      <div className="dashboard-greeting">
        <div>
          <h1>{greeting()}, <span>{user?.name?.split(' ')[0] || 'Farmer'}</span> 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: 4 }}>
            Here's what's happening across your fields today.
          </p>
        </div>
        <Link to="/analysis/new" className="btn btn-primary">
          <Plus size={18} /> New Analysis
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard
          label="Total Projects"
          value={mockDashboardStats.totalProjects}
          change={12}
          changeLabel=" vs last month"
          icon={FolderKanban}
        />
        <StatCard
          label="Images Analyzed"
          value={mockDashboardStats.imagesAnalyzed}
          change={8}
          changeLabel=" this week"
          icon={Image}
        />
        <StatCard
          label="Fields Processed"
          value={mockDashboardStats.fieldsProcessed}
          change={25}
          changeLabel=" this month"
          icon={Layers}
        />
        <StatCard
          label="Avg Weed Coverage"
          value={`${mockDashboardStats.avgWeedCoverage}%`}
          change={-3.2}
          changeLabel=" improvement"
          icon={TrendingDown}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* Left: recent projects + chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Recent Projects */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Recent Projects</h2>
              <Link to="/projects" style={{ fontSize: '0.8125rem', color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Images</th>
                    <th>Weed %</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map(p => {
                    const sc = statusConfig[p.status];
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.fieldName}</div>
                        </td>
                        <td><Badge variant={sc.variant} dot>{sc.label}</Badge></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.images || '—'}</td>
                        <td>
                          {p.weedCoverage != null ? (
                            <span style={{
                              color: p.weedCoverage > 20 ? 'var(--error)' : p.weedCoverage > 12 ? 'var(--warning)' : 'var(--lime)',
                              fontWeight: 600
                            }}>
                              {p.weedCoverage}%
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {p.analysisId ? (
                            <Link
                              to={`/analysis/${p.analysisId}`}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--lime)' }}
                            >
                              <ExternalLink size={13} />
                            </Link>
                          ) : (
                            <Link to={`/projects/${p.id}`} className="btn btn-ghost btn-sm">
                              <ExternalLink size={13} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weed Coverage Trend */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Weed Coverage Trend</h2>
              <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>↓ 3.2% improvement</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockWeedTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="weedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#84cc16" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#84cc16" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                    }}
                    formatter={(v) => [`${v}%`, 'Weed Coverage']}
                  />
                  <Area
                    type="monotone"
                    dataKey="coverage"
                    stroke="#84cc16"
                    strokeWidth={2.5}
                    fill="url(#weedGrad)"
                    dot={{ fill: '#84cc16', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#84cc16' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Actions */}
          <div className="card">
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/analysis/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                <Plus size={16} /> New Field Analysis
              </Link>
              <Link to="/projects" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <FolderKanban size={16} /> Browse Projects
              </Link>
              <Link to="/reports" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <BarChart2 size={16} /> View Reports
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 20 }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mockActivity.map(act => {
                const Icon = activityIcons[act.type] || Info;
                return (
                  <div key={act.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--lime-dim)',
                      border: '1px solid var(--border-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: activityColors[act.type] }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 2 }}>{act.action}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 2 }}>{act.project}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {act.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
