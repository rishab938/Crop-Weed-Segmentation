import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban, ArrowLeft, Calendar, MapPin, Layers,
  ExternalLink, Play, RotateCcw, Download, Plus, CheckCircle2,
  Clock, AlertTriangle, FileText
} from 'lucide-react';
import { mockProjects, mockAnalysis, mockReports } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { Badge, StatCard } from '../components/ui/Components';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const project = mockProjects.find(p => p.id === id) || mockProjects[0];
  const analysis = project.analysisId ? mockAnalysis[project.analysisId] : null;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            <Link to="/projects" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Projects
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--lime)' }}>{project.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              {project.name}
            </h1>
            <Badge
              variant={
                project.status === 'completed' ? 'success' :
                project.status === 'processing' ? 'lime' :
                project.status === 'failed' ? 'error' : 'muted'
              }
              dot
            >
              {project.status.toUpperCase()}
            </Badge>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {project.fieldName} · Created {project.date} · {project.images} Drone Images
          </p>
        </div>

        {/* Action Buttons based on status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {project.status === 'completed' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/reports/rep_01')}
              >
                <FileText size={16} /> Report
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/analysis/${project.analysisId || 'ana_01'}`)}
              >
                Open Analysis <ExternalLink size={16} />
              </button>
            </>
          )}

          {project.status === 'processing' && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/analysis/${project.analysisId || 'ana_01'}/processing`)}
            >
              View Processing Pipeline <Play size={16} />
            </button>
          )}

          {project.status === 'failed' && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analysis/ana_01/processing')}
            >
              <RotateCcw size={16} /> Inspect & Retry Pipeline
            </button>
          )}

          {project.status === 'draft' && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analysis/new')}
            >
              <Plus size={16} /> Upload Imagery
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <StatCard
          label="Field Area"
          value={`${project.fieldSize} ha`}
          changeLabel="Total boundary"
        />
        <StatCard
          label="Weed Coverage"
          value={project.weedCoverage ? `${project.weedCoverage}%` : 'N/A'}
          accent={project.weedCoverage ? (project.weedCoverage > 15 ? '#f97316' : 'var(--lime)') : undefined}
          changeLabel={project.weedCoverage ? 'Automated segmentation' : 'Pending analysis'}
        />
        <StatCard
          label="Drone Frames"
          value={project.images}
          changeLabel="GeoTIFF + Metadata"
        />
        <StatCard
          label="Pipeline Status"
          value={project.status === 'completed' ? 'Analyzed' : project.status === 'processing' ? 'In Queue' : project.status === 'failed' ? 'Failed' : 'Draft'}
          accent={project.status === 'completed' ? 'var(--lime)' : project.status === 'failed' ? 'var(--error)' : undefined}
        />
      </div>

      {/* Main Content Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left: Survey Imagery & Orthomosaic Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Drone Orthomosaic & Survey Frames</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{project.images} frames captured</span>
          </div>

          <div style={{ position: 'relative', height: 280, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
              alt="Field Orthomosaic"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(11,18,9,0.85)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', color: 'white' }}>
              Orthomosaic composite · 1.8 cm / px GSD
            </div>
          </div>

          {/* Sample Thumbnails */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ borderRadius: 6, overflow: 'hidden', height: 60, border: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
                <img
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=200&q=60"
                  alt={`Frame ${i}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Metadata & Agronomic Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Technical Specifications</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sensor Model</span>
                <span style={{ fontWeight: 600 }}>DJI Multispectral 4-Band</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flight Altitude</span>
                <span style={{ fontWeight: 600 }}>45m AGL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Overlap Ratio</span>
                <span style={{ fontWeight: 600 }}>75% Forward / 65% Side</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coordinate System</span>
                <span style={{ fontWeight: 600 }}>WGS 84 / UTM zone 16N</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Survey Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Clock size={16} color="var(--lime)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Survey Flight Uploaded</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{project.date} at 14:28 UTC</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <CheckCircle2 size={16} color={project.status === 'completed' ? 'var(--lime)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Pipeline Execution</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {project.status === 'completed' ? 'Completed in 3m 42s' : 'Incomplete or in queue'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
