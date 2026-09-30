import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, Download, Printer, ArrowLeft, CheckCircle2,
  Calendar, MapPin, Layers, Award, Sparkles
} from 'lucide-react';
import { mockReports, mockAnalysis } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Components';

export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const report = mockReports.find(r => r.id === id) || mockReports[0];
  const analysis = mockAnalysis[report.analysisId] || mockAnalysis['ana_01'];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    addToast(`Generating official PDF for ${report.id}...`, 'success');
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* Top Navigation & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Link to="/reports" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back to Reports
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to={`/analysis/${analysis.id}`} className="btn btn-secondary btn-sm">
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
      <div className="card" style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
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
            <span className="badge badge-lime" style={{ marginBottom: 6 }}>OFFICIAL AUDIT</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              REPORT #{report.id.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Date: {report.date}
            </div>
          </div>
        </div>

        {/* Survey Overview Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: 'var(--bg-surface)', padding: 18, borderRadius: 'var(--r-md)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Field</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>{report.fieldName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Field Area</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>12.4 Hectares</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Crop Type</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>Maize (Zea mays)</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Survey Drone</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: 2 }}>DJI Mavic 3M (Multispectral)</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 10 }}>Executive Summary</h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Aerial multispectral imagery stitched across 6 georeferenced frames demonstrates healthy stand establishment across <strong>81.6%</strong> of the survey area. Moderate to severe broadleaf and grass weed infestation was localized primarily within Zone 3 (27.4% coverage) and Zone 6 (22.0% coverage). Selective spot-treatment application targeting 3.8 ha will eliminate high-density weed patches while achieving a <strong>68% reduction in herbicide consumption</strong> relative to broadcast treatment.
          </p>
        </div>

        {/* Core Metrics */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 14 }}>Survey Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Weed Coverage</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f97316', marginTop: 4 }}>
                {report.weedCoverage}%
              </div>
            </div>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crop Canopy Density</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                {analysis.cropCoverage}%
              </div>
            </div>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hotspots Flagged</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: 4 }}>
                {analysis.hotspots}
              </div>
            </div>
            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Spray Area</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)', marginTop: 4 }}>
                3.8 ha
              </div>
            </div>
          </div>
        </div>

        {/* Zone Breakdown Table */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 12 }}>Zone Breakdown & Treatment Prescription</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zone ID</th>
                  <th>Weed Infestation</th>
                  <th>Primary Species</th>
                  <th>Severity Level</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {analysis.zones.map(z => {
                  const isHigh = z.coverage > 20;
                  const isMed = z.coverage > 12;
                  return (
                    <tr key={z.id}>
                      <td style={{ fontWeight: 700 }}>Zone {z.id}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: isHigh ? 'var(--error)' : isMed ? 'var(--warning)' : 'var(--lime)' }}>
                          {z.coverage}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {isHigh ? 'Palmer Amaranth' : isMed ? 'Waterhemp / Foxtail' : 'Minor annual grasses'}
                      </td>
                      <td>
                        <Badge variant={isHigh ? 'error' : isMed ? 'warning' : 'success'}>
                          {isHigh ? 'Critical' : isMed ? 'Moderate' : 'Low'}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {isHigh ? 'Targeted Spot Spray (100% dose)' : isMed ? 'Low-rate spot spray' : 'Skip / Monitor'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certification / Sign-off Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-dim)', paddingTop: 24, marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--lime)', fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
              <CheckCircle2 size={16} /> Certified Automated Agronomic Analysis
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Processed by Crop & Weed AI Cloud Engine v2.4 · SHA256: <code>d9a8e23f...</code>
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
