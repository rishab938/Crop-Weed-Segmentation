import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layers, Download, ArrowRight, ArrowLeft, ZoomIn, ZoomOut,
  Maximize2, RotateCcw, AlertTriangle, CheckCircle, Info,
  Sliders, Shield, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { mockAnalysis } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { StatCard, ProgressBar, Badge } from '../components/ui/Components';

const TABS = [
  { id: 'original', label: 'Original' },
  { id: 'segmentation', label: 'Segmentation' },
  { id: 'weedmap', label: 'Weed Map' },
  { id: 'density', label: 'Density Heatmap' },
  { id: 'hotspots', label: 'Hotspots' },
];

export function FieldAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [activeTab, setActiveTab] = useState('weedmap');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const analysis = mockAnalysis[id] || mockAnalysis['ana_01'];

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // 12 Hotspot sample coordinates (relative percentages inside field viewer)
  const hotspotsData = [
    { id: 1, x: 28, y: 35, size: '0.34 ha', severity: 'High', type: 'Palmer Amaranth' },
    { id: 2, x: 34, y: 40, size: '0.22 ha', severity: 'High', type: 'Palmer Amaranth' },
    { id: 3, x: 45, y: 25, size: '0.18 ha', severity: 'Medium', type: 'Waterhemp' },
    { id: 4, x: 62, y: 30, size: '0.28 ha', severity: 'High', type: 'Giant Ragweed' },
    { id: 5, x: 70, y: 45, size: '0.15 ha', severity: 'Medium', type: 'Kochia' },
    { id: 6, x: 55, y: 65, size: '0.31 ha', severity: 'High', type: 'Palmer Amaranth' },
    { id: 7, x: 40, y: 70, size: '0.12 ha', severity: 'Low', type: 'Lambsquarters' },
    { id: 8, x: 22, y: 60, size: '0.19 ha', severity: 'Medium', type: 'Foxtail' },
    { id: 9, x: 80, y: 38, size: '0.14 ha', severity: 'Low', type: 'Velvetleaf' },
    { id: 10, x: 74, y: 75, size: '0.26 ha', severity: 'High', type: 'Palmer Amaranth' },
    { id: 11, x: 30, y: 82, size: '0.11 ha', severity: 'Low', type: 'Morningglory' },
    { id: 12, x: 50, y: 85, size: '0.16 ha', severity: 'Medium', type: 'Waterhemp' },
  ];

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
            <span>{analysis.projectName}</span>
            <span>/</span>
            <span style={{ color: 'var(--lime)' }}>Field Analysis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              {analysis.projectName}
            </h1>
            <span className="badge badge-success">Completed</span>
            <span className="badge badge-muted">{analysis.imagesStitched} Images Stitched</span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Survey Date: {analysis.date} · Field: {analysis.fieldName} (12.4 ha) · Multi-spectral ortho-mosaic
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              addToast('Generating summary PDF report...', 'info');
              setTimeout(() => {
                navigate('/reports/rep_01');
              }, 600);
            }}
          >
            <Download size={16} /> Download Report
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/analysis/${analysis.id}/treatment`)}
          >
            Treatment & Route <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Viewer (Left 60-65%) and Analytics (Right 35-40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.35fr) minmax(340px, 1fr)', gap: 24 }}>
        {/* LEFT: Viewer Card */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tab selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div className="tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          {/* Interactive Field Viewport */}
          <div
            className="field-viewer"
            style={{
              height: 480,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'crosshair',
              background: '#070f06',
            }}
          >
            {/* Aerial Field Image Container with Zoom */}
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                position: 'relative',
              }}
            >
              {/* High-res Aerial Crop Image */}
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80"
                alt="Aerial Drone Field Orthomosaic"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: activeTab === 'density' ? 'brightness(0.7) contrast(1.1)' : 'brightness(0.9)',
                }}
              />

              {/* OVERLAYS BASED ON TAB */}

              {/* 1. Segmentation Overlay */}
              {activeTab === 'segmentation' && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Crop green boundary tints */}
                  <div style={{
                    position: 'absolute',
                    top: '15%', left: '10%', width: '80%', height: '70%',
                    border: '2px solid rgba(132,204,22,0.8)',
                    background: 'rgba(132,204,22,0.12)',
                    borderRadius: 16,
                  }} />
                  {/* Weed segments */}
                  <div style={{
                    position: 'absolute',
                    top: '25%', left: '25%', width: '120px', height: '80px',
                    borderRadius: '45% 55% 60% 40% / 50% 45% 55% 50%',
                    background: 'rgba(239,68,68,0.4)',
                    border: '1.5px solid #ef4444',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '55%', left: '45%', width: '160px', height: '100px',
                    borderRadius: '55% 45% 40% 60% / 40% 60% 50% 50%',
                    background: 'rgba(249,115,22,0.45)',
                    border: '1.5px solid #f97316',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '30%', left: '60%', width: '140px', height: '90px',
                    borderRadius: '50% 50% 60% 40% / 60% 40% 50% 50%',
                    background: 'rgba(239,68,68,0.4)',
                    border: '1.5px solid #ef4444',
                  }} />
                </div>
              )}

              {/* 2. Weed Map Overlay */}
              {(activeTab === 'weedmap' || activeTab === 'segmentation') && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Organic Weed Blobs */}
                  <div style={{
                    position: 'absolute', top: '22%', left: '24%', width: 140, height: 95,
                    borderRadius: '60% 40% 70% 30% / 40% 60% 40% 60%',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.65) 0%, rgba(249,115,22,0.3) 70%, transparent 100%)',
                    filter: 'blur(2px)',
                  }} />
                  <div style={{
                    position: 'absolute', top: '48%', left: '42%', width: 180, height: 120,
                    borderRadius: '40% 60% 50% 50% / 60% 30% 70% 40%',
                    background: 'radial-gradient(circle, rgba(249,115,22,0.7) 0%, rgba(234,179,8,0.3) 75%, transparent 100%)',
                    filter: 'blur(2px)',
                  }} />
                  <div style={{
                    position: 'absolute', top: '35%', left: '65%', width: 110, height: 80,
                    borderRadius: '50% 50% 40% 60% / 50% 60% 40% 50%',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(249,115,22,0.3) 70%, transparent 100%)',
                    filter: 'blur(2px)',
                  }} />
                  <div style={{
                    position: 'absolute', top: '68%', left: '60%', width: 150, height: 90,
                    borderRadius: '65% 35% 55% 45% / 45% 55% 45% 55%',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.65) 0%, rgba(249,115,22,0.3) 70%, transparent 100%)',
                    filter: 'blur(2px)',
                  }} />
                </div>
              )}

              {/* 3. Density Heatmap Overlay */}
              {activeTab === 'density' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse 60% 40% at 35% 35%, rgba(239,68,68,0.55) 0%, rgba(245,158,11,0.4) 40%, rgba(132,204,22,0.2) 75%, transparent 100%), radial-gradient(ellipse 50% 45% at 65% 65%, rgba(239,68,68,0.5) 0%, rgba(245,158,11,0.35) 45%, rgba(132,204,22,0.2) 80%, transparent 100%)',
                  mixBlendMode: 'screen',
                  pointerEvents: 'none',
                }} />
              )}

              {/* 4. Hotspots Pins (Visible on Weed Map, Hotspots, and Density tabs) */}
              {(activeTab === 'hotspots' || activeTab === 'weedmap') && (
                hotspotsData.map(h => {
                  const isSelected = selectedHotspot?.id === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHotspot(h)}
                      style={{
                        position: 'absolute',
                        left: `${h.x}%`,
                        top: `${h.y}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'pointer',
                        zIndex: 10,
                      }}
                      title={`Hotspot #${h.id}: ${h.type} (${h.size})`}
                    >
                      {/* Pulsing ring */}
                      <div style={{
                        position: 'absolute',
                        inset: -6,
                        borderRadius: '50%',
                        border: '2px solid #ef4444',
                        animation: 'pulse 1.8s infinite',
                        opacity: 0.8,
                      }} />
                      {/* Center pin */}
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: h.severity === 'High' ? '#ef4444' : '#f97316',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 10px rgba(239,68,68,0.8)',
                      }} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Field Info Badge */}
            <div className="field-badge">
              <span className="status-dot success" />
              <span>North Field · 41.8781° N, 87.6298° W</span>
            </div>

            {/* Bottom-left Legend */}
            <div className="field-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--lime)' }} />
                <span>Crop (81.6%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f97316' }} />
                <span>Weed (18.4%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }} />
                <span>Hotspot (12)</span>
              </div>
            </div>

            {/* Bottom-right Zoom Controls */}
            <div className="field-controls">
              <button
                className="btn btn-secondary btn-icon"
                style={{ background: 'rgba(11,18,9,0.85)', backdropFilter: 'blur(8px)' }}
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="btn btn-secondary btn-icon"
                style={{ background: 'rgba(11,18,9,0.85)', backdropFilter: 'blur(8px)' }}
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                className="btn btn-secondary btn-icon"
                style={{ background: 'rgba(11,18,9,0.85)', backdropFilter: 'blur(8px)' }}
                onClick={handleResetZoom}
                title="Reset Zoom"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Hotspot details banner if clicked */}
          {selectedHotspot && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.8125rem',
            }}>
              <div>
                <strong>Hotspot #{selectedHotspot.id}:</strong> {selectedHotspot.type} · Severity: <span style={{ color: 'var(--error)' }}>{selectedHotspot.severity}</span> · Area: {selectedHotspot.size}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedHotspot(null)}
                style={{ padding: '2px 8px' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Analytical Insights Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 4 Stat Cards in 2x2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatCard
              label="Weed Coverage"
              value={`${analysis.weedCoverage}%`}
              change={-3.2}
              changeLabel="vs last month"
              accent="#f97316"
            />
            <StatCard
              label="Crop Coverage"
              value={`${analysis.cropCoverage}%`}
              change={2.1}
              changeLabel="healthy stand"
              accent="var(--lime)"
            />
            <StatCard
              label="Weed Density"
              value={analysis.weedDensity}
              changeLabel="7.1 weeds / m²"
            />
            <StatCard
              label="Hotspots Found"
              value={analysis.hotspots}
              changeLabel={`Max: ${analysis.largestHotspot} ha`}
              accent="#ef4444"
            />
          </div>

          {/* Weed Coverage by Zone (Bar Chart) */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Weed Coverage by Zone</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zone 3 exhibits critical infestation (27.4%)</span>
              </div>
              <span className="badge badge-warning">Action Required</span>
            </div>

            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.zones} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="id" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `${v}%`} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-primary)'
                    }}
                    formatter={(val) => [`${val}%`, 'Weed Coverage']}
                  />
                  <Bar dataKey="coverage" radius={[4, 4, 0, 0]}>
                    {analysis.zones.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.coverage > 20 ? '#ef4444' : entry.coverage > 15 ? '#f97316' : 'var(--lime)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Density Distribution Progress Bars */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600 }}>
              Infestation Severity Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysis.densityDistribution.map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label} Density</span>
                    <span style={{ fontWeight: 600, color: item.color }}>{item.value}%</span>
                  </div>
                  <ProgressBar
                    value={item.value}
                    height={6}
                    variant={item.label === 'High' ? 'error' : item.label === 'Medium' ? 'warning' : 'default'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Agronomic Recommendations */}
          <div className="info-card" style={{ display: 'flex', gap: 12 }}>
            <Sparkles size={20} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Targeted Variable-Rate Prescription
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Selective spot-spraying in Zones 3, 5, and 6 will treat 92% of all weeds while reducing chemical volume by <strong>68%</strong> compared to broadcast application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
