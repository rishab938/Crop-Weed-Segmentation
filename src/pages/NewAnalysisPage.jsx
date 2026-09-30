import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FolderOpen, X, CheckCircle, AlertCircle,
  Plus, Info, ChevronRight, Trash2, MapPin, FileImage
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const MOCK_UPLOADED = [
  { id: 1, name: 'maize_block_a_001.jpg', type: 'JPG', size: '4.2 MB', res: '4000 × 3000', gps: true },
  { id: 2, name: 'maize_block_a_002.jpg', type: 'JPG', size: '4.4 MB', res: '4000 × 3000', gps: true },
  { id: 3, name: 'maize_block_a_003.png', type: 'PNG', size: '3.9 MB', res: '4000 × 3000', gps: false },
];

export default function NewAnalysisPage() {
  const [projectName, setProjectName] = useState('Maize Block A · 2025 season');
  const [fieldName, setFieldName] = useState('North Field · 12.4 ha');
  const [files, setFiles] = useState(MOCK_UPLOADED);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useApp();
  const fileInputRef = useRef();

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const newFiles = Array.from(e.dataTransfer.files).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: f.name.split('.').pop().toUpperCase(),
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      res: '4000 × 3000',
      gps: Math.random() > 0.3,
    }));
    setFiles(p => [...p, ...newFiles]);
  };

  const handleFileInput = (e) => {
    const newFiles = Array.from(e.target.files).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: f.name.split('.').pop().toUpperCase(),
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      res: '4000 × 3000',
      gps: Math.random() > 0.3,
    }));
    setFiles(p => [...p, ...newFiles]);
  };

  const removeFile = (id) => setFiles(p => p.filter(f => f.id !== id));
  const totalSize = files.reduce((acc, f) => acc + parseFloat(f.size), 0).toFixed(1);
  const gpsCount = files.filter(f => f.gps).length;

  const handleSaveDraft = () => {
    addToast('Draft saved successfully', 'success');
  };

  const handleStartAnalysis = () => {
    if (files.length === 0) {
      addToast('Please upload at least one image', 'error');
      return;
    }
    if (!projectName.trim()) {
      addToast('Please enter a project name', 'error');
      return;
    }
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
                      <FileImage size={18} style={{ color: 'var(--lime)', opacity: 0.7 }} />
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
