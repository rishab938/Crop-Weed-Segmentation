import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Download, Search, Filter, Eye, CheckCircle2,
  Calendar, Layers, ArrowUpRight
} from 'lucide-react';
import { mockReports } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Components';

export function ReportsPage() {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const filteredReports = mockReports.filter(rep => {
    const matchesSearch = rep.projectName.toLowerCase().includes(search.toLowerCase()) ||
                          rep.fieldName.toLowerCase().includes(search.toLowerCase()) ||
                          rep.id.toLowerCase().includes(search.toLowerCase());
    if (filterTab === 'ready') return matchesSearch && rep.status === 'ready';
    return matchesSearch;
  });

  const handleDownload = (rep) => {
    addToast(`Downloading ${rep.id}_${rep.projectName.replace(/\s+/g, '_')}.pdf...`, 'success');
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Analysis Reports
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Comprehensive agronomic survey summaries, weed distribution, and prescription maps
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => addToast('Batch downloading all completed reports (ZIP)...', 'info')}
        >
          <Download size={16} /> Batch Export All
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div className="tabs">
          <button
            className={`tab ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Reports ({mockReports.length})
          </button>
          <button
            className={`tab ${filterTab === 'ready' ? 'active' : ''}`}
            onClick={() => setFilterTab('ready')}
          >
            Ready for Download ({mockReports.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search report or field..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Project & Field</th>
                <th>Date Generated</th>
                <th>Weed Coverage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="var(--lime)" />
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.id}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {report.projectName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {report.fieldName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      {report.date}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: report.weedCoverage > 15 ? '#f97316' : 'var(--lime)',
                    }}>
                      {report.weedCoverage}%
                    </span>
                  </td>
                  <td>
                    <Badge variant="success" dot>
                      Ready
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <Link
                        to={`/reports/${report.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={14} /> View
                      </Link>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownload(report)}
                        title="Download PDF"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No reports matched your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
