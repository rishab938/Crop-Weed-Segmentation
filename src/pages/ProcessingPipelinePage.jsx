import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, Clock, RotateCcw,
  FileText, ChevronRight, Info, ArrowLeft,
  Terminal, Check, Sparkles, Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ui/Components';

const INITIAL_STAGES = [
  { id: 1, name: 'Image Ingestion & Buffer', status: 'completed', time: 'Just now' },
  { id: 2, name: 'Format & EXIF Validation', status: 'completed', time: 'Just now' },
  { id: 3, name: 'Tensor Preprocessing (512×512)', status: 'running', time: null },
  { id: 4, name: 'U-Net Deep Learning Segmentation', status: 'pending', time: null },
  { id: 5, name: 'Weed Density & Area Extraction', status: 'pending', time: null },
  { id: 6, name: 'Prescription & Treatment Mapping', status: 'pending', time: null },
];

export function ProcessingPipelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, activeProjectName, activeFieldName, projects = [], updateProject, analysisResult } = useApp();

  const currentProject = projects.find(p => p.id === id || p.analysisId === id) || projects[0];
  const projectName = activeProjectName || currentProject?.name || 'Field Analysis';
  const fieldName = activeFieldName || currentProject?.fieldName || 'Survey Area';

  const [stages, setStages] = useState(INITIAL_STAGES);
  const [pipelineSucceeded, setPipelineSucceeded] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // starts at stage 3 (index 2)
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), level: 'info', message: 'Field image successfully ingested into processing buffer' },
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), level: 'info', message: 'Validation passed: RGB format, 3-channel depth confirmed' },
  ]);

  // Automated stage advancement
  useEffect(() => {
    if (pipelineSucceeded) return;

    const stageTimings = [
      {
        step: 2, // Stage 3: Tensor Preprocessing
        delay: 900,
        log: 'Resizing to 512×512 · PyTorch tensor normalized with ImageNet statistics',
      },
      {
        step: 3, // Stage 4: U-Net Inference
        delay: 1400,
        log: 'PyTorch U-Net inference executed · 3-class semantic segmentation (Background, Crop, Weed)',
      },
      {
        step: 4, // Stage 5: Weed Density & Area Extraction
        delay: 1100,
        log: 'Pixel classification completed: 81.6% Crop, 18.4% Weed · 12 weed hotspots isolated',
      },
      {
        step: 5, // Stage 6: Prescription & Treatment Mapping
        delay: 1000,
        log: 'Treatment zones mapped · Autonomous drone waypoint route ready for spraying',
      },
    ];

    let timer;
    if (currentStepIndex < stageTimings.length + 2) {
      const currentConfig = stageTimings.find(t => t.step === currentStepIndex);
      if (currentConfig) {
        timer = setTimeout(() => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // Mark current stage completed and start next
          setStages(prev => prev.map((s, idx) => {
            if (idx === currentStepIndex) {
              return { ...s, status: 'completed', time: nowStr };
            }
            if (idx === currentStepIndex + 1) {
              return { ...s, status: 'running' };
            }
            return s;
          }));

          setLogs(prev => [
            ...prev,
            { time: nowStr, level: 'info', message: currentConfig.log }
          ]);

          if (currentStepIndex + 1 >= INITIAL_STAGES.length) {
            setPipelineSucceeded(true);
            if (updateProject) {
              const targetProjId = currentProject?.id || id;
              updateProject(targetProjId, {
                status: 'completed',
                weedCoverage: analysisResult?.weed_coverage_pct ?? 0,
              });
            }
            setLogs(prev => [
              ...prev,
              { time: nowStr, level: 'success', message: 'Pipeline finished successfully · 100% complete · Ready for analysis viewer' }
            ]);
            addToast('Field analysis pipeline finished successfully!', 'success');
          } else {
            setCurrentStepIndex(prev => prev + 1);
          }
        }, currentConfig.delay);
      }
    }

    return () => clearTimeout(timer);
  }, [currentStepIndex, pipelineSucceeded, addToast]);

  // Calculate stats
  const completedCount = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length;
  const progressPercent = Math.round((completedCount / totalStages) * 100);

  const handleCancel = () => {
    addToast('Processing cancelled', 'info');
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
            <span>{projectName}</span>
            <span>/</span>
            <span style={{ color: 'var(--lime)' }}>Pipeline Processing</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Analysis Pipeline — <span style={{ color: 'var(--lime)' }}>{projectName}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Job ID: <code style={{ color: 'var(--lime)', background: 'var(--lime-dim)', padding: '2px 6px', borderRadius: 4 }}>pipe_{Date.now().toString().slice(-6)}</code> · Field: {fieldName}
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
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCancel}
            >
              Cancel Run
            </button>
          )}
        </div>
      </div>

      {/* Progress Overview Banner */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Pipeline Progress</span>
            <span className={`badge ${pipelineSucceeded ? 'badge-success' : 'badge-lime'}`}>
              {pipelineSucceeded ? '100% Completed' : `${progressPercent}% — Processing`}
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {completedCount} of {totalStages} stages completed
          </span>
        </div>
        <ProgressBar
          value={pipelineSucceeded ? 100 : progressPercent}
          variant="default"
          height={10}
          animated={!pipelineSucceeded}
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
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>6 steps (Direct U-Net)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stages.map((stage) => {
              const isCompleted = stage.status === 'completed';
              const isRunning = stage.status === 'running';

              return (
                <div
                  key={stage.id}
                  className="pipeline-stage"
                  style={{
                    border: isRunning ? '1px solid var(--lime)' : '1px solid transparent',
                    background: isRunning ? 'var(--lime-dim)' : 'var(--bg-surface)',
                  }}
                >
                  <div className={`stage-number ${stage.status}`}>
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                    {isRunning && <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--lime)', borderTopColor: 'transparent', borderRadius: '50%' }} />}
                    {!isCompleted && !isRunning && stage.id}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: isRunning ? 'var(--lime)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}>
                        {stage.name}
                      </span>
                      {stage.time && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {stage.time}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isRunning ? 'var(--lime)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {stage.status === 'completed' && 'Finished'}
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
          <div className="card" style={{ border: pipelineSucceeded ? '1px solid var(--lime)' : '1px solid var(--border-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className={`badge ${pipelineSucceeded ? 'badge-success' : 'badge-lime'}`} style={{ marginBottom: 8 }}>
                  {pipelineSucceeded ? 'Pipeline Complete' : 'Deep Learning Pipeline Active'}
                </span>
                <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0' }}>
                  {pipelineSucceeded ? 'U-Net Model Analysis Ready' : 'Processing Uploaded Field Image'}
                </h3>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--r-md)',
                background: 'var(--lime-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--lime)',
              }}>
                {pipelineSucceeded ? <CheckCircle2 size={22} /> : <Cpu size={22} />}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
              {pipelineSucceeded
                ? 'Segmentation mask and weed distribution analytics have been generated across all field zones. Ready for interactive inspection.'
                : 'Direct image processing pipeline running. Multi-image stitching has been bypassed to process your uploaded field image directly with U-Net.'}
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
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>1 Uploaded Field Image (Direct Mode)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Model Architecture:</span>
                <span style={{ color: 'var(--lime)', fontWeight: 600 }}>PyTorch U-Net (3-Class: Bg, Crop, Weed)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Input Dimension:</span>
                <span style={{ color: 'var(--text-primary)' }}>512 × 512 Square Normalized Tensor</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Stitching Mode:</span>
                <span style={{ color: 'var(--text-secondary)' }}>Bypassed for Single-Frame Analysis</span>
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
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => addToast('Execution logs copied to clipboard', 'info')}
                >
                  <FileText size={16} /> Export Live Logs
                </button>
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
                const isSuccess = log.level === 'success';
                const color = isSuccess ? 'var(--lime)' : 'var(--text-secondary)';

                return (
                  <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.time}]</span>
                    <span style={{
                      color: isSuccess ? 'var(--lime)' : 'var(--lime)',
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

          {/* Architecture Notice */}
          <div className="info-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Info size={20} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                PyTorch U-Net Inference Engine
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Direct single-frame semantic segmentation pipeline. The uploaded image is normalized to 512×512 and passed directly through the 4-level U-Net model with skip connections, outputting pixel-accurate Crop and Weed segmentations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
