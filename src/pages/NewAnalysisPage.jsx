import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FolderOpen, X, CheckCircle, AlertCircle,
  Plus, Info, ChevronRight, Trash2, MapPin, FileImage
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function NewAnalysisPage() {
  const [projectName, setProjectName] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [files, setFiles] = useState([]);
  const [stitchEnabled, setStitchEnabled] = useState(false);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();
  const { addToast, addProject, updateProject, setAnalysisContext, storeAnalysisResult } = useApp();
  const fileInputRef = useRef();

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!e.dataTransfer?.files) return;
    const newFiles = Array.from(e.dataTransfer.files).map((f, i) => ({
      id: Date.now() + i,
      file: f,
      name: f.name,
      type: f.name.split('.').pop().toUpperCase(),
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      preview: f.type?.startsWith('image/') ? URL.createObjectURL(f) : null,
      res: 'Original',
      gps: false,
    }));
    setFiles(p => [...p, ...newFiles]);
  };

  const handleFileInput = (e) => {
    if (!e.target?.files) return;
    const newFiles = Array.from(e.target.files).map((f, i) => ({
      id: Date.now() + i,
      file: f,
      name: f.name,
      type: f.name.split('.').pop().toUpperCase(),
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      preview: f.type?.startsWith('image/') ? URL.createObjectURL(f) : null,
      res: 'Original',
      gps: false,
    }));
    setFiles(p => [...p, ...newFiles]);
  };

  const removeFile = (id) => setFiles(p => p.filter(f => f.id !== id));
  const totalSize = files.reduce((acc, f) => acc + parseFloat(f.size || 0), 0).toFixed(1);
  const gpsCount = files.filter(f => f.gps).length;

  const handleSaveDraft = () => {
    if (!projectName.trim()) {
      addToast('Please enter a project name to save draft', 'error');
      return;
    }
    const firstPreview = files[0]?.preview;
    if (addProject) {
      addProject({
        name: projectName.trim(),
        fieldName: fieldName.trim() || 'Draft Field',
        images: files.length,
        image: firstPreview,
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        weedCoverage: null,
        fieldSize: 0,
        analysisId: null,
      });
    }
    addToast('Draft saved successfully', 'success');
    navigate('/projects');
  };

  const handleStartAnalysis = async () => {
    const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    if (!projectName.trim()) {
      addToast('Please enter a project name', 'error');
      return;
    }
    if (files.length === 0) {
      addToast('Please upload at least one image', 'error');
      return;
    }

    const firstImagePreview = files[0]?.preview;
    const firstFile = files[0]?.file;

    // Set synchronous preview immediately so navigating doesn't wait
    if (setAnalysisContext) {
      setAnalysisContext({
        image: firstImagePreview,
        projectName: projectName.trim(),
        fieldName: fieldName.trim() || 'Custom Field',
      });
    }

    // Also convert file to dataUrl for sessionStorage persistence
    if (firstFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        if (setAnalysisContext) {
          setAnalysisContext({
            image: dataUrl,
            projectName: projectName.trim(),
            fieldName: fieldName.trim() || 'Custom Field',
          });
        }
      };
      reader.readAsDataURL(firstFile);
    }

    let createdProject = null;
    if (addProject) {
      createdProject = addProject({
        name: projectName.trim(),
        fieldName: fieldName.trim() || 'Custom Field',
        images: files.length,
        image: firstImagePreview,
        status: 'processing',
        date: new Date().toISOString().split('T')[0],
        weedCoverage: null,
        fieldSize: 10.0,
        analysisId: 'ana_01',
      });
    }

    // Clear any previous analysis result so FieldAnalysisPage shows fresh data
    if (storeAnalysisResult) storeAnalysisResult(null);

    // Helper to convert base64 PNG to Blob/File
    const base64ToBlob = (b64, mime) => {
      const binary = atob(b64);
      const array = [];
      for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
      return new Blob([new Uint8Array(array)], { type: mime });
    };

    // Build FormData for inference (may be stitched or original)
    let formData = new FormData();
    if (stitchEnabled && files.length > 1) {
      // Call stitching endpoint first
      const stitchForm = new FormData();
      files.forEach(f => stitchForm.append('files', f.file, f.name));
      try {
        const stitchResp = await fetch(`${BACKEND}/api/v1/stitch`, {
          method: 'POST',
          body: stitchForm,
        });
        if (stitchResp.ok) {
          const stitchJson = await stitchResp.json();
          const b64 = stitchJson.stitched_image_base64;
          const blob = base64ToBlob(b64, 'image/png');
          const stitchedFile = new File([blob], 'stitched.png', { type: 'image/png' });
          formData.append('images', stitchedFile);
        } else {
          // Stitch failed – fall back to original per‑image inference
          addToast('Could not stitch — running analysis on images separately', 'warning');
          files.forEach(f => formData.append('images', f.file, f.name));
        }
      } catch (e) {
        addToast('Stitch request failed — analyzing individually', 'warning');
        files.forEach(f => formData.append('images', f.file, f.name));
      }
    } else {
      // No stitching – send all original files
      files.forEach(f => formData.append('images', f.file, f.name));
    }

    // Try to call the real backend inference API
    try {
      const resp = await fetch(`${BACKEND}/api/v1/infer`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (storeAnalysisResult) storeAnalysisResult(data);
        if (setAnalysisContext && data.overlay_data_uri) {
          setAnalysisContext({ image: data.overlay_data_uri });
        }
        if (updateProject && createdProject) {
          updateProject(createdProject.id, {
            status: 'completed',
            weedCoverage: data.weed_coverage_pct,
          });
        }
        addToast('Model inference complete — real results loaded', 'success');
      } else {
        console.warn('Backend inference returned non-OK status, using mock data');
      }
    } catch (err) {
      console.warn('Backend inference unavailable, falling back to demo data:', err);
    }

    addToast('Field analysis pipeline started', 'success');
    navigate('/analysis/ana_01/processing');
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Create New Field Analysis</h1>
          <p className="page-subtitle">
            Name the project, then upload the field images you want processed. GPS metadata is optional.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleSaveDraft}>Save as Draft</button>
          <button className="btn btn-primary" onClick={handleStartAnalysis}>
            Start Analysis <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Project details */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Project details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="proj-name">Project Name</label>
                <input
                  id="proj-name"
                  className="input"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Maize Block A · 2025 season"
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="field-name">Field Name</label>
                <input
                  id="field-name"
                  className="input"
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  placeholder="e.g. North Field · 12.4 ha"
                />
              </div>
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.tiff,.raw"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <div className="upload-icon">
              <Upload size={22} />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 8 }}>
              Drop your field images here
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              or browse your files · JPG, JPEG, PNG · multiple images supported
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}
            >
              <FolderOpen size={15} /> Browse files
            </button>
          </div>

          {/* Uploaded files */}
          {files.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  Uploaded images
                  <span style={{ marginLeft: 10, background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '1px 10px', fontSize: '0.75rem' }}>{files.length}</span>
                </h2>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--error)', gap: 4 }}
                  onClick={() => setFiles([])}
                >
                  <Trash2 size={13} /> Remove all
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {files.map(f => (
                  <div key={f.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 'var(--r-md)',
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--r-sm)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #1a3a1a, #2d5a2d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {f.preview ? (
                        <img src={f.preview} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FileImage size={18} style={{ color: 'var(--lime)', opacity: 0.7 }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {f.type} · {f.size}
                      </div>
                    </div>

                    {/* GPS badge */}
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '2px 9px',
                      borderRadius: 'var(--r-full)',
                      background: f.gps ? 'rgba(132,204,22,0.15)' : 'rgba(245,158,11,0.12)',
                      color: f.gps ? 'var(--lime)' : 'var(--warning)',
                      border: `1px solid ${f.gps ? 'rgba(132,204,22,0.25)' : 'rgba(245,158,11,0.25)'}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {f.gps ? '● GPS available' : '● No GPS data'}
                    </span>

                    {/* Resolution */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{f.res}</span>

                    {/* Remove */}
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => removeFile(f.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-dim)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Showing {files.length} of {files.length} images · {totalSize} MB total
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--lime)', gap: 5 }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <Plus size={14} /> Add more images
                </button>
              </div>

              {/* Stitch Images toggle — only when 2+ images */}
              {files.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-dim)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: stitchEnabled ? 'var(--lime)' : 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={stitchEnabled}
                      onChange={e => setStitchEnabled(e.target.checked)}
                      style={{ accentColor: 'var(--lime)', width: 16, height: 16 }}
                    />
                    Stitch Images Before Analysis
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Combines overlapping images into one panorama
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Before you upload */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 14 }}>Before you upload</h3>
            {[
              'Use 60–80% overlap between frames so stitching can align them.',
              'Keep individual images under 12 MB for faster uploads.',
              'GPS metadata is optional and used for boundary alignment when present.',
              'Remove blurred or duplicated frames before starting analysis.',
            ].map(tip => (
              <div key={tip} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <CheckCircle size={14} style={{ color: 'var(--lime)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* GPS Metadata */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>GPS Metadata</h3>
              <span className="badge badge-muted" style={{ fontSize: '0.6875rem' }}>Optional</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Available in {gpsCount} of {files.length} images
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Not available in {files.length - gpsCount} image{files.length - gpsCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={13} style={{ color: 'var(--lime)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Used for field boundary alignment</span>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
              Without GPS the field map is aligned visually instead.
            </p>
          </div>

          {/* Prototype notice */}
          <div className="prototype-banner">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <AlertCircle size={16} style={{ color: 'var(--lime)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--lime)', marginBottom: 4 }}>Research prototype</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Analyses on these screens use realistic mock data. The UI is built to connect
                  later to React → FastAPI → ML processing → storage without redesigning any screen.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/analysis/ana_01/processing')}
              style={{ fontSize: '0.8125rem', color: 'var(--lime)', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5, marginLeft: 26 }}
            >
              See the processing pipeline <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
