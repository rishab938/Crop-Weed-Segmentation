import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw,
  FileText, ChevronRight, Info, ExternalLink, ArrowLeft,
  Terminal, Play, Check, ShieldAlert
} from 'lucide-react';
import { mockPipelineStages, mockPipelineLog } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ui/Components';

export function ProcessingPipelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [stages, setStages] = useState(mockPipelineStages);
  const [logs, setLogs] = useState(mockPipelineLog);
  const [isRetrying, setIsRetrying] = useState(false);
  const [pipelineSucceeded, setPipelineSucceeded] = useState(false);

  // Calculate stats
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length;
  const progressPercent = Math.round((completedCount / totalStages) * 100);

  const handleRetry = () => {
    setIsRetrying(true);
    addToast('Retrying Field Map generation with adjusted overlap tolerance...', 'info');

    // Update stage 6 to running
    setStages(prev => prev.map(s => s.id === 6 ? { ...s, status: 'running' } : s));

    const retryLog1 = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: 'info',
      message: 'Re-aligning keypoint descriptors using SIFT with relaxed homography constraints'
    };
    setLogs(prev => [...prev, retryLog1]);

    setTimeout(() => {
      const retryLog2 = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        level: 'info',
        message: 'Field map stitched successfully · 6/6 frames georeferenced'
      };
      setLogs(prev => [...prev, retryLog2]);

      // Complete stage 6, 7, 8, 9
      setStages(prev => prev.map(s => ({
        ...s,
        status: 'completed',
        time: s.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
      setIsRetrying(false);
      setPipelineSucceeded(true);
      addToast('Pipeline completed successfully! Ready for analysis.', 'success');
    }, 2400);
  };

  const handleCancel = () => {
    addToast('Processing pipeline cancelled by user', 'warning');
    navigate('/projects');
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            <Link to="/projects" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Projects
            </Link>
            <span>/</span>
            <span>Maize Block A</span>
            <span>/</span>
            <span style={{ color: 'var(--lime)' }}>Pipeline Processing</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Analysis Pipeline — <span style={{ color: 'var(--lime)' }}>Maize Block A</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Job ID: <code style={{ color: 'var(--lime)', background: 'var(--lime-dim)', padding: '2px 6px', borderRadius: 4 }}>pipe_948271</code> · Started today at 14:28 UTC
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pipelineSucceeded ? (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/analysis/ana_01')}
            >
              View Field Analysis <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCancel}
              >
                Cancel Run
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                <RotateCcw size={15} className={isRetrying ? 'spin' : ''} />
                {isRetrying ? 'Retrying Stage...' : 'Retry Failed Stage'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Overview Banner */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Pipeline Progress</span>
            <span className={`badge ${pipelineSucceeded ? 'badge-success' : 'badge-warning'}`}>
              {pipelineSucceeded ? '100% Completed' : `${progressPercent}% — 1 Stage Needs Attention`}
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {completedCount} of {totalStages} stages completed
          </span>
        </div>
        <ProgressBar
          value={pipelineSucceeded ? 100 : progressPercent}
          variant={pipelineSucceeded ? 'default' : 'warning'}
          height={10}
          animated
        />
      </div>

      {/* Main Grid: Stages on Left, Active Stage & Logs on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(360px, 1.8fr)', gap: 24 }}>
        {/* Left: Stages List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-dim)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Sequential Stages
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>9 steps</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stages.map((stage) => {
              const isFailed = stage.status === 'failed';
              const isCompleted = stage.status === 'completed';
              const isRunning = stage.status === 'running';

              return (
                <div
                  key={stage.id}
                  className="pipeline-stage"
                  style={{
                    border: isFailed
                      ? '1px solid rgba(239,68,68,0.3)'
                      : isRunning
                      ? '1px solid var(--lime)'
                      : '1px solid transparent',
                    background: isFailed
                      ? 'rgba(239,68,68,0.06)'
                      : isRunning
                      ? 'var(--lime-dim)'
                      : 'var(--bg-surface)',
                  }}
                >
                  <div className={`stage-number ${stage.status}`}>
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                    {isFailed && <XCircle size={14} />}
                    {isRunning && <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--lime)', borderTopColor: 'transparent', borderRadius: '50%' }} />}
                    {!isCompleted && !isFailed && !isRunning && stage.id}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: isFailed ? 'var(--error)' : isRunning ? 'var(--lime)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}>
                        {stage.name}
                      </span>
                      {stage.time && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {stage.time}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isFailed ? 'var(--error)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {stage.status === 'completed' && 'Finished'}
                      {stage.status === 'failed' && 'Error at frame stitching'}
                      {stage.status === 'running' && 'Processing now...'}
                      {stage.status === 'pending' && 'Queued'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Stage Focus & Live Execution Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Stage Card */}
          <div className="card" style={{ border: pipelineSucceeded ? '1px solid var(--lime)' : '1px solid rgba(239,68,68,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className={`badge ${pipelineSucceeded ? 'badge-success' : 'badge-error'}`} style={{ marginBottom: 8 }}>
                  {pipelineSucceeded ? 'Stage 6 & 7 Complete' : 'Stage 6 Failed · Field Map Stitching'}
                </span>
                <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0' }}>
                  {pipelineSucceeded ? 'Field Map Generated Successfully' : 'Keypoint Matching Below Overlap Threshold'}
                </h3>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--r-md)',
                background: pipelineSucceeded ? 'var(--lime-dim)' : 'rgba(239,68,68,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: pipelineSucceeded ? 'var(--lime)' : 'var(--error)',
              }}>
                {pipelineSucceeded ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
              {pipelineSucceeded
                ? 'All 6 drone frames have been stitched and geo-referenced. NDVI and weed density matrix have been computed across all 6 zones.'
                : 'Frame #4 overlap with Frame #3 was measured at 32%, which is below the recommended 40% threshold for automated homography computation.'}
            </p>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderRadius: 'var(--r-md)',
              padding: '12px 16px',
              fontSize: '0.8125rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Input Source:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>6 GeoTIFF frames (DJI Mavic 3M)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Spatial Resolution:</span>
                <span style={{ color: 'var(--text-primary)' }}>1.8 cm / pixel GSD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Model Architecture:</span>
                <span style={{ color: 'var(--text-primary)' }}>YOLOv8-Seg + DeepLabV3+ Ensemble</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {pipelineSucceeded ? (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/analysis/ana_01')}
                >
                  Open Field Analysis Dashboard <ChevronRight size={16} />
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleRetry}
                    disabled={isRetrying}
                  >
                    <RotateCcw size={16} className={isRetrying ? 'spin' : ''} />
                    {isRetrying ? 'Processing...' : 'Retry with SIFT Adaptive Match'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => addToast('Full execution logs copied to clipboard', 'info')}
                  >
                    <FileText size={16} /> Export Logs
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Execution Log Terminal */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={16} color="var(--lime)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Pipeline Event Log</span>
              </div>
              <span className="badge badge-muted" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                stdout · live
              </span>
            </div>

            <div style={{
              background: '#070c06',
              border: '1px solid var(--border-dim)',
              borderRadius: 'var(--r-md)',
              padding: '14px 16px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.7,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 220,
              overflowY: 'auto',
            }}>
              {logs.map((log, index) => {
                const color = log.level === 'error'
                  ? 'var(--error)'
                  : log.level === 'warning'
                  ? 'var(--warning)'
                  : 'var(--text-secondary)';

                return (
                  <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.time}]</span>
                    <span style={{
                      color: log.level === 'error' ? 'var(--error)' : log.level === 'warning' ? 'var(--warning)' : 'var(--lime)',
                      fontWeight: 600,
                      flexShrink: 0,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      width: 58,
                    }}>
                      {log.level}
                    </span>
                    <span style={{ color, wordBreak: 'break-word' }}>
                      {log.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Architecture / Celery Worker Notice */}
          <div className="info-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Info size={20} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                Asynchronous Deep Learning Worker System
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                In production, processing tasks are dispatched to Celery workers backed by Redis, executing PyTorch CUDA acceleration for multi-spectral segmentation and ORB/SIFT orthomosaic generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
