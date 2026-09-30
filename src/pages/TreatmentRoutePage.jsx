import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass, Navigation, Play, RotateCcw, ArrowRight, ArrowLeft,
  AlertTriangle, CheckCircle, ShieldAlert, Sliders, Download,
  Layers, MapPin, Zap
} from 'lucide-react';
import { mockTreatment, mockAnalysis } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { StatCard, Badge, ProgressBar } from '../components/ui/Components';

export function TreatmentRoutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [threshold, setThreshold] = useState(15);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeWaypoint, setActiveWaypoint] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const treatment = mockTreatment;

  // 6 Waypoints for Serpentine Path (percentages in viewport)
  const waypoints = [
    { id: 1, x: 20, y: 30, alt: '25m', speed: '8 km/h', action: 'Spray On' },
    { id: 2, x: 80, y: 30, alt: '25m', speed: '8 km/h', action: 'Turn' },
    { id: 3, x: 80, y: 55, alt: '25m', speed: '8 km/h', action: 'Spray On' },
    { id: 4, x: 20, y: 55, alt: '25m', speed: '8 km/h', action: 'Turn' },
    { id: 5, x: 20, y: 78, alt: '25m', speed: '8 km/h', action: 'Spray On' },
    { id: 6, x: 80, y: 78, alt: '25m', speed: '8 km/h', action: 'RTH' },
  ];

  // Simulation timer
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
            <span>Maize Block A</span>
            <span>/</span>
            <span style={{ color: 'var(--lime)' }}>Treatment & Route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Treatment Zones & Autonomous Route
            </h1>
            <span className="badge badge-lime">Prescription Active</span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Target: 3 treatment zones · 3.8 ha target area out of 12.4 ha · Serpentine flight pattern
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={handleExportPlan}
          >
            <Download size={16} /> Export Waypoints
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/reports/rep_01')}
          >
            Continue to Report <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Map viewer on Left, Controls & Metrics on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.35fr) minmax(340px, 1fr)', gap: 24 }}>
        {/* LEFT: Digital Treatment Map with Flight Path */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={18} color="var(--lime)" />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Digital Treatment Map & Flight Path</span>
            </div>
            <span className="badge badge-muted">Waypoint {activeWaypoint} of 6</span>
          </div>

          {/* Interactive Map Viewport */}
          <div
            className="treatment-map"
            style={{
              height: 480,
              position: 'relative',
              overflow: 'hidden',
              background: '#070f06',
            }}
          >
            {/* Background aerial image */}
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80"
              alt="Aerial Drone Field"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.65) contrast(1.15)',
              }}
            />

            {/* Treatment Zones Overlay */}
            {/* Zone 1: Low Weed (Green tint) */}
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              width: '25%',
              height: '35%',
              background: 'rgba(132,204,22,0.22)',
              border: '1.5px solid rgba(132,204,22,0.6)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              padding: 8,
              color: 'var(--lime)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              Z1 · Low (8%)
            </div>

            {/* Zone 3: High Weed Target Zone (Red/Orange tint) */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '38%',
              width: '32%',
              height: '42%',
              background: 'rgba(239,68,68,0.3)',
              border: '2px solid #ef4444',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              padding: 8,
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              Z3 · High (27.4%) [TARGET]
            </div>

            {/* Zone 6: High Weed Target Zone */}
            <div style={{
              position: 'absolute',
              top: '60%',
              left: '30%',
              width: '45%',
              height: '28%',
              background: 'rgba(249,115,22,0.3)',
              border: '2px solid #f97316',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              padding: 8,
              color: '#f97316',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              Z6 · High (22%) [TARGET]
            </div>

            {/* Dashed White Treatment Bounding Box */}
            <div style={{
              position: 'absolute',
              top: '18%',
              left: '15%',
              width: '70%',
              height: '66%',
              border: '2px dashed rgba(255,255,255,0.7)',
              borderRadius: 6,
              pointerEvents: 'none',
            }}>
              {/* Corner Green Anchor dots */}
              <div style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, background: 'var(--lime)', borderRadius: '50%', boxShadow: '0 0 8px var(--lime)' }} />
              <div style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, background: 'var(--lime)', borderRadius: '50%', boxShadow: '0 0 8px var(--lime)' }} />
              <div style={{ position: 'absolute', bottom: -5, left: -5, width: 10, height: 10, background: 'var(--lime)', borderRadius: '50%', boxShadow: '0 0 8px var(--lime)' }} />
              <div style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, background: 'var(--lime)', borderRadius: '50%', boxShadow: '0 0 8px var(--lime)' }} />
            </div>

            {/* SVG Flight Path (Serpentine Path) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#a3e635" />
                </linearGradient>
              </defs>

              {/* Waypoint connection lines */}
              <polyline
                points="20% 30%, 80% 30%, 80% 55%, 20% 55%, 20% 78%, 80% 78%"
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Numbered Waypoints */}
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
                    background: 'rgba(0,0,0,0.7)',
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

            {/* Top-left Altitude & Mode Badge */}
            <div className="field-badge">
              <span className="status-dot success" />
              <span>Digital Treatment Map · Alt: 25m AGL · 8 km/h</span>
            </div>

            {/* Bottom-left Legend */}
            <div className="field-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--lime)' }} />
                <span>Low / Skip</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f97316' }} />
                <span>Medium (Spot)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }} />
                <span>High (Full Rate)</span>
              </div>
              <div className="legend-item">
                <span style={{ width: 14, height: 2, borderBottom: '2px dashed white' }} />
                <span>Planned Flight</span>
              </div>
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

        {/* RIGHT: Treatment Plan & Mission Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Treatment Summary Card */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Treatment Summary</h3>
              <span className="badge badge-success">Target Area: 3.8 ha</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)' }}>
                <span className="stat-label">Treated Area</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                  {treatment.targetArea} ha
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  of {treatment.totalArea} ha total field
                </span>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)' }}>
                <span className="stat-label">Chemical Savings</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                  ~68%
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  vs uniform spray
                </span>
              </div>
            </div>

            {/* Threshold Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Weed Threshold Cutoff:</span>
                <span style={{ fontWeight: 600, color: 'var(--lime)' }}>{threshold}% infestation</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--lime)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Aggressive (5%)</span>
                <span>Balanced (15%)</span>
                <span>Conservative (35%)</span>
              </div>
            </div>
          </div>

          {/* Simulated Route Card */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Autonomous Route Preview</h4>
              <span className="badge badge-lime">Preview Mode</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Waypoints:</span>
                <span style={{ fontWeight: 600 }}>{treatment.waypoints} GPS points</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flight Distance:</span>
                <span style={{ fontWeight: 600 }}>{treatment.routeDistance} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pattern:</span>
                <span style={{ fontWeight: 600 }}>{treatment.pathPattern}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Duration:</span>
                <span style={{ fontWeight: 600, color: 'var(--lime)' }}>{treatment.estimatedTravel}</span>
              </div>
            </div>
          </div>

          {/* Prototype Boundary Warning Card (Required) */}
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
