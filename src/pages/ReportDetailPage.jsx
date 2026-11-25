import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, Download, Printer, ArrowLeft, CheckCircle2,
  Calendar, MapPin, Layers, Award, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Components';

export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, activeProjectName, activeFieldName, analysisResult, projects = [] } = useApp();

  const currentProject = projects.find(p => p.id === id || p.analysisId === id) || projects[0];
  const projectName = activeProjectName || currentProject?.name || 'Field Survey Report';
  const fieldName = activeFieldName || currentProject?.fieldName || 'Survey Block';

  const usingRealModel = !!(analysisResult && analysisResult.model_used);

  // Model-driven values
  const weedPct = usingRealModel ? analysisResult.weed_coverage_pct : 0.0;
  const cropPct = usingRealModel ? analysisResult.crop_coverage_pct : 8.7;
  const sprayLevel = analysisResult?.spray_level || 'none';
  const sprayMsg = analysisResult?.spray_message || 'No spray needed — weed density negligible.';
  const hotspots = usingRealModel ? analysisResult.hotspot_count : 0;
  const totalFieldHa = currentProject?.fieldSize || 10.0;
  const treatedAreaHa = usingRealModel
    ? Math.max(0.0, Number((totalFieldHa * (weedPct / 100) * 1.5).toFixed(1)))
    : 0.0;
  const chemicalSavingsPct = weedPct > 0 
    ? Math.min(99, Math.max(50, Math.round(100 - (treatedAreaHa / totalFieldHa * 100))))
    : 100;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('report-content');
    if (!element) {
      addToast('Report content not found', 'error');
      return;
    }
    addToast('Generating PDF report...', 'info');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
    const opt = {
      margin:       0.5,
      filename:     `CropWeedAI_Report_${safeName}_${dateStr}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    window.html2pdf().from(element).set(opt).save().then(() => {
      addToast('PDF downloaded successfully', 'success');
    }).catch(() => {
      addToast('PDF generation failed', 'error');
    });
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Top Navigation & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Link to="/reports" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back to Reports
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/analysis/ana_01" className="btn btn-secondary btn-sm">
            Interactive Viewer
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={15} /> Print
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownload}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div id="report-content" className="card" style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: 24, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: 'var(--lime)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b1209', fontWeight: 800 }}>
                CW
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>
                Crop & Weed AI
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Autonomous Precision Agriculture Survey & Weed Prescription Report
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-lime" style={{ marginBottom: 6 }}>
              {usingRealModel ? 'AI MODEL AUDIT' : 'SURVEY REPORT'}
            </span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              REPORT #{id ? id.toUpperCase() : 'REP_01'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Date: {new Date().toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        {/* Survey Overview Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: 'var(--bg-surface)', padding: 18, borderRadius: 'var(--r-md)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Field</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>{fieldName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Field Area</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>{totalFieldHa} Hectares</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Segmentation Model</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>U-Net PhenoBench (Kaggle)</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Model Status</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2, color: 'var(--lime)' }}>
              {usingRealModel ? 'Live Weights (unet_best.pt)' : 'Pending Analysis'}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 10 }}>Executive Summary</h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Automated image segmentation using the trained U-Net model demonstrates crop establishment across <strong>{cropPct}%</strong> of the surveyed area. Detected weed coverage is measured at <strong>{weedPct}%</strong> across the submitted survey frames. Under the agronomic decision threshold, the prescription dosage is <strong>{sprayLevel.toUpperCase()}</strong>: <em>"{sprayMsg}"</em>. Targeted precision spraying saves an estimated <strong>~{chemicalSavingsPct}% herbicide</strong> compared to uniform broadcast spraying.
          </p>
        </div>

        {/* Core Metrics */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 14 }}>Survey Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Weed Coverage</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f97316', marginTop: 4 }}>
                {weedPct}%
              </div>
            </div>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crop Canopy Coverage</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                {cropPct}%
              </div>
            </div>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weed Hotspots Flagged</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: 4 }}>
                {hotspots}
              </div>
            </div>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Targeted Spray Area</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                {treatedAreaHa} ha
              </div>
            </div>
          </div>
        </div>

        {/* Agronomic Prescription Block */}
        <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 'var(--r-md)', borderLeft: '4px solid var(--lime)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>
            Agronomic Prescription & UAV Action Plan
          </h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prescription Level</span>
              <div style={{ fontWeight: 700, color: 'var(--lime)', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                {sprayLevel}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Herbicide Reduction</span>
              <div style={{ fontWeight: 700, color: 'var(--lime)', fontSize: '1.1rem' }}>
                ~{chemicalSavingsPct}%
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            {sprayMsg}
          </p>
        </div>

        {/* Certification / Sign-off Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-dim)', paddingTop: 24, marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--lime)', fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
              <CheckCircle2 size={16} /> Certified Automated Agronomic Analysis
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Processed by Crop & Weed AI · Model: PyTorch U-Net (PhenoBench weights)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 4, width: 180, textAlign: 'center', fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.125rem' }}>
              Rishab Verma
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Certified Agronomist, Lead Reviewer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
