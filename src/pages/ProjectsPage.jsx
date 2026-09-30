import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, FolderKanban, ExternalLink,
  Image, Layers, ArrowRight, SlidersHorizontal
} from 'lucide-react';
import { Badge } from '../components/ui/Components';
import { mockProjects } from '../data/mockData';

const statusConfig = {
  completed: { label: 'Completed', variant: 'success' },
  processing: { label: 'Processing', variant: 'info' },
  draft:      { label: 'Draft',     variant: 'muted' },
  failed:     { label: 'Failed',    variant: 'error' },
};

const ALL_STATUSES = ['All', 'Completed', 'Processing', 'Draft', 'Failed'];

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const navigate = useNavigate();

  const filtered = mockProjects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.fieldName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' ||
                        p.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleOpen = (p) => {
    if (p.analysisId) navigate(`/analysis/${p.analysisId}`);
    else navigate(`/projects/${p.id}`);
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {mockProjects.length} projects · {mockProjects.filter(p => p.status === 'completed').length} completed
          </p>
        </div>
        <Link to="/analysis/new" className="btn btn-primary">
          <Plus size={16} /> New Analysis
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-md)', padding: '8px 14px', flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            className="input"
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.875rem' }}
            placeholder="Search projects or fields…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', borderRadius: 'var(--r-md)', padding: 4, border: '1px solid var(--border-dim)' }}>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`tab ${statusFilter === s ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '0.8125rem' }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '7px 10px' }}
          >
            <SlidersHorizontal size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ padding: '7px 10px' }}
          >
            <Layers size={15} />
          </button>
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <FolderKanban size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>No projects match your search.</p>
          <Link to="/analysis/new" className="btn btn-primary" style={{ marginTop: 20 }}>
            <Plus size={16} /> Create First Project
          </Link>
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map(p => {
            const sc = statusConfig[p.status];
            return (
              <div
                key={p.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpen(p)}
              >
                {/* Card image area */}
                <div style={{
                  height: 140,
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden',
                  marginBottom: 16,
                  position: 'relative',
                  background: 'linear-gradient(135deg, #1a3a1a, #2d5a2d)',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=50)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.45,
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                  }}>
                    <Badge variant={sc.variant} dot>{sc.label}</Badge>
                  </div>
                  {p.weedCoverage != null && (
                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      background: 'rgba(11,18,9,0.85)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--lime)',
                      fontWeight: 700,
                    }}>
                      {p.weedCoverage}% weed
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  {p.fieldName}
                </p>

                <div style={{ display: 'flex', gap: 16, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Image size={13} /> {p.images || 0} images
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Layers size={13} /> {p.fieldSize} ha
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                    {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Field</th>
                  <th>Status</th>
                  <th>Images</th>
                  <th>Field Size</th>
                  <th>Weed %</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sc = statusConfig[p.status];
                  return (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handleOpen(p)}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.fieldName}</td>
                      <td><Badge variant={sc.variant} dot>{sc.label}</Badge></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.images || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.fieldSize} ha</td>
                      <td>
                        {p.weedCoverage != null ? (
                          <span style={{ color: p.weedCoverage > 20 ? 'var(--error)' : p.weedCoverage > 12 ? 'var(--warning)' : 'var(--lime)', fontWeight: 600 }}>
                            {p.weedCoverage}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--lime)' }}>
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
