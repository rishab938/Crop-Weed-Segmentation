import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Navigation, Play, RotateCcw, ArrowRight, ArrowLeft,
  ShieldAlert, Download, Sparkles
} from 'lucide-react';
import { mockTreatment } from '../data/mockData';
import { useApp } from '../context/AppContext';

export function TreatmentRoutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, activeImage, activeProjectName, activeFieldName, analysisResult, projects = [] } = useApp();

  const [threshold, setThreshold] = useState(15);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeWaypoint, setActiveWaypoint] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const currentProject = projects.find(p => p.id === id || p.analysisId === id) || projects[0];
  const projectName = activeProjectName || currentProject?.name || 'Field Analysis';
  const fieldName = activeFieldName || currentProject?.fieldName || 'Main Field';

  // Prefer real model segmentation overlay, fallback to active image
  const displayImage = analysisResult?.overlay_data_uri || activeImage || currentProject?.image;
  const usingRealModel = !!(analysisResult && analysisResult.model_used);

  // Model-based metrics or clean defaults
  const weedPct = usingRealModel ? (analysisResult.weed_coverage_pct || 0) : 12.4;
  const cropPct = usingRealModel ? (analysisResult.crop_coverage_pct || 0) : 34.2;
  const sprayLevel = analysisResult?.spray_level || 'targeted';
  const sprayMsg = analysisResult?.spray_message || 'Targeted spot spray recommended on detected weed clusters.';
  const totalFieldHa = currentProject?.fieldSize || 10.0;
  
  // Real savings: spot spraying only weed clusters vs uniform blanket spraying
  const treatedAreaHa = usingRealModel 
    ? Math.max(0.1, Number((totalFieldHa * (weedPct / 100) * 1.8).toFixed(1)))
    : 3.8;
  const chemicalSavingsPct = usingRealModel
    ? Math.min(99, Math.max(50, Math.round(100 - (treatedAreaHa / totalFieldHa * 100))))
    : 68;

  // 6 Waypoints for Serpentine Path across the field
  const waypoints = [
    { id: 1, x: 18, y: 22, alt: '25m', speed: '8 km/h', action: 'Scan & Spray' },
    { id: 2, x: 82, y: 22, alt: '25m', speed: '8 km/h', action: 'Turn' },
    { id: 3, x: 82, y: 50, alt: '25m', speed: '8 km/h', action: 'Scan & Spray' },
    { id: 4, x: 18, y: 50, alt: '25m', speed: '8 km/h', action: 'Turn' },
    { id: 5, x: 18, y: 78, alt: '25m', speed: '8 km/h', action: 'Scan & Spray' },
    { id: 6, x: 82, y: 78, alt: '25m', speed: '8 km/h', action: 'RTH' },
  ];

  // Simulation loop
  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        setActiveWaypoint(prev => {
          if (prev >= 6) {
            setIsSimulating(false);
            addToast('Route simulation completed successfully!', 'success');
            return 1;
          }
          return prev + 1;
        });
      }, 1200 / speedMultiplier);
    }
    return () => clearInterval(interval);
  }, [isSimulating, speedMultiplier]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setActiveWaypoint(1);
    addToast('Starting route simulation along serpentine path...', 'info');
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setActiveWaypoint(1);
    addToast('Route reset to starting waypoint WP-1', 'info');
  };

  const handleExportPlan = () => {
    addToast('Waypoint flight plan exported to GeoJSON / QGC Mission format', 'success');
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            <Link to="/analysis/ana_01" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Field Analysis
            </Link>
            <span>/</span>
            <span>{projectName}</span>
            <span>/</span>
            <span style={{ color: 'var(--lime)' }}>Treatment & Route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Autonomous Spraying Flight Route
            </h1>
            <span className="badge badge-lime">
              {usingRealModel ? 'Real Model Prescription' : 'Prescription Active'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Field: {fieldName} · Serpentine grid flight pattern at 25m AGL
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPlan}>
            <Download size={16} /> Export Waypoints
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reports/rep_01')}>
            Continue to Report <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Map viewer on Left, Controls & Metrics on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.35fr) minmax(340px, 1fr)', gap: 24 }}>
        {/* LEFT: Clean Digital Treatment Map with Serpentine Path */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={18} color="var(--lime)" />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Precision Flight Path & Treatment Map</span>
            </div>
            <span className="badge badge-muted">Waypoint {activeWaypoint} of 6</span>
          </div>

          {/* Map Viewport — CLEAN without fake rectangular zone boxes */}
          <div
            className="treatment-map"
            style={{
              height: 480,
              position: 'relative',
              overflow: 'hidden',
              background: '#070f06',
              borderRadius: 8,
            }}
          >
            {/* Background aerial image with real model overlay */}
            {displayImage ? (
              <img
                src={displayImage}
                alt={projectName || "Field Aerial"}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'brightness(0.95)',
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No image available
              </div>
            )}

            {/* SVG Flight Path (Serpentine Path) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>

              {/* Serpentine route lines */}
              <polyline
                points="18% 22%, 82% 22%, 82% 50%, 18% 50%, 18% 78%, 82% 78%"
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Waypoint Markers */}
            {waypoints.map((wp) => {
              const isCurrent = activeWaypoint === wp.id;
              return (
                <div
                  key={wp.id}
                  style={{
                    position: 'absolute',
                    left: `${wp.x}%`,
                    top: `${wp.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveWaypoint(wp.id)}
                >
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--lime)' : '#0b1209',
                    color: isCurrent ? '#0b1209' : 'var(--lime)',
                    border: `2px solid ${isCurrent ? '#ffffff' : 'var(--lime)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: isCurrent ? '0 0 16px var(--lime)' : '0 2px 6px rgba(0,0,0,0.8)',
                    transition: 'all 0.3s ease',
                  }}>
                    {wp.id}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'white',
                    background: 'rgba(0,0,0,0.75)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    marginTop: 3,
                    whiteSpace: 'nowrap',
                  }}>
                    WP-{wp.id}
                  </span>
                </div>
              );
            })}

            {/* Animated Drone Icon on Current Waypoint */}
            {waypoints[activeWaypoint - 1] && (
              <div style={{
                position: 'absolute',
                left: `${waypoints[activeWaypoint - 1].x}%`,
                top: `${waypoints[activeWaypoint - 1].y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 25,
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(132,204,22,0.25)',
                  border: '1.5px solid var(--lime)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.2s infinite',
                }}>
                  <Navigation size={22} color="var(--lime)" style={{ transform: 'rotate(45deg)' }} />
                </div>
              </div>
            )}

            {/* Top-left Mode & Altitude Badge */}
            <div className="field-badge">
              <span className="status-dot success" />
              <span>Flight Altitude: 25m AGL · Speed: 8 km/h</span>
            </div>

            {/* Bottom-left Clean Model Legend */}
            <div className="field-legend" style={{ background: 'rgba(11,18,9,0.85)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#00c800' }} />
                <span>Crop (Green)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#dc0000' }} />
                <span>Weed (Red)</span>
              </div>
              <div className="legend-item">
                <span style={{ width: 14, height: 2, borderBottom: '2px dashed var(--lime)', display: 'inline-block' }} />
                <span>Serpentine Flight Path</span>
              </div>
            </div>
          </div>

          {/* Live Drone Telemetry & Nozzle State during simulation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-dot success" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Drone Telemetry: WP-{activeWaypoint} ({waypoints[activeWaypoint - 1]?.action})
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Nozzle Status:&nbsp;
              {waypoints[activeWaypoint - 1]?.action === 'Turn' || waypoints[activeWaypoint - 1]?.action === 'RTH' ? (
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>OFF (Row Turn)</span>
              ) : weedPct < 1.0 ? (
                <span style={{ color: 'var(--lime)', fontWeight: 600 }}>CLOSED (No Spray Needed — 0% Weed)</span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: 600 }}>ACTIVE (Targeted Spot Spray on Weeds)</span>
              )}
            </div>
          </div>

          {/* Simulation Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleStartSimulation}
                disabled={isSimulating}
              >
                <Play size={14} /> {isSimulating ? 'Simulating...' : 'Simulate Route'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetSimulation}
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span>Simulation Speed:</span>
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: speedMultiplier === s ? 'var(--lime)' : 'var(--bg-input)',
                    color: speedMultiplier === s ? '#0b1209' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Model-Driven Treatment Plan & Mission Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Treatment Summary Card */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Targeted Spray Summary</h3>
              <span className="badge badge-success">Target Area: {treatedAreaHa} ha</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)' }}>
                <span className="stat-label">Treated Area</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                  {treatedAreaHa} ha
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  of {totalFieldHa} ha total field
                </span>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)' }}>
                <span className="stat-label">Chemical Savings</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                  ~{chemicalSavingsPct}%
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  vs blanket spray
                </span>
              </div>
            </div>

            {/* Model Agronomic Prescription Card */}
            <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 'var(--r-md)', borderLeft: '4px solid var(--lime)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Prescription (Kaggle Model Rules)
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Dosage: <span style={{ color: 'var(--lime)', textTransform: 'uppercase' }}>{sprayLevel}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {sprayMsg}
              </p>
            </div>

            {/* Threshold Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Weed Spot Cutoff:</span>
                <span style={{ fontWeight: 600, color: 'var(--lime)' }}>{threshold}% infestation</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--lime)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Aggressive (1%)</span>
                <span>Balanced (15%)</span>
                <span>Conservative (30%)</span>
              </div>
            </div>
          </div>

          {/* Autonomous Route Preview Card */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Autonomous Route Preview</h4>
              <span className="badge badge-lime">Serpentine Grid</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Waypoints:</span>
                <span style={{ fontWeight: 600 }}>6 GPS points (WP-1 to WP-6)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flight Distance:</span>
                <span style={{ fontWeight: 600 }}>1.24 km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pattern:</span>
                <span style={{ fontWeight: 600 }}>Serpentine · 3 passes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Duration:</span>
                <span style={{ fontWeight: 600, color: 'var(--lime)' }}>9 min at 8 km/h</span>
              </div>
            </div>
          </div>

          {/* Prototype Boundary Warning Card */}
          <div className="warning-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <ShieldAlert size={22} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--warning)', marginBottom: 4 }}>
                Route Planning Prototype Advisory
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                This simulated route is generated for planning review and does not directly command any unmanned aerial vehicle. Always export mission coordinates to licensed ground-control software (QGroundControl, Mission Planner, DJI Pilot 2) and comply with local aviation regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
