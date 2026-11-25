import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";

const TABS = [
  { id: "segmentation", label: "AI Segmentation" },
  { id: "original",     label: "Original Image" },
];

export function FieldAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, activeImage, activeProjectName, activeFieldName, projects = [], analysisResult } = useApp();

  const [activeTab, setActiveTab] = useState("segmentation");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Find the project that matches this analysis ID
  const currentProject = projects.find(p => p.id === id || p.analysisId === id) || projects[0];
  const projectName = activeProjectName || currentProject?.name || "Field Analysis";
  const fieldName   = activeFieldName   || currentProject?.fieldName || "Survey Area";

  const usingRealModel = !!(analysisResult && analysisResult.model_used);

  // Per-image data from backend (array of overlays)
  const imagesList = (usingRealModel && analysisResult.images) ? analysisResult.images : [];
  const totalImages = imagesList.length || 1;
  const safeIdx = Math.min(currentImageIdx, totalImages - 1);

  // Current image overlay (from per-image array or fallback to single overlay)
  const currentOverlay = imagesList.length > 0
    ? imagesList[safeIdx]?.overlay_data_uri
    : (analysisResult?.overlay_data_uri || null);

  // Raw uploaded image (from context)
  const rawImage = activeImage || currentProject?.image || null;
  const displayImage = activeTab === "original" ? rawImage : (currentOverlay || rawImage);

  // Per-image stats for the currently selected image
  const perImageStats = imagesList.length > 0 ? imagesList[safeIdx] : null;

  // Aggregated stats (always from the top-level analysisResult)
  const aggWeed = analysisResult?.weed_coverage_pct ?? 0;
  const aggCrop = analysisResult?.crop_coverage_pct ?? 0;
  const aggHotspots = analysisResult?.hotspot_count ?? 0;
  const aggDensity = analysisResult?.weed_density ?? "Negligible";

  const handleZoomIn    = () => setZoomLevel(p => Math.min(p + 0.25, 2.5));
  const handleZoomOut   = () => setZoomLevel(p => Math.max(p - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handlePrev = () => setCurrentImageIdx(i => (i - 1 + totalImages) % totalImages);
  const handleNext = () => setCurrentImageIdx(i => (i + 1) % totalImages);

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 6 }}>
            <Link to="/projects" style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={14} /> Projects
            </Link>
            <span>/</span><span>{projectName}</span><span>/</span>
            <span style={{ color: "var(--lime)" }}>Field Analysis</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{projectName}</h1>
            <span className="badge badge-success">Completed</span>
            {usingRealModel && <span className="badge badge-lime">U-Net Model Active</span>}
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Survey Date: {new Date().toISOString().split("T")[0]} · Field: {fieldName} · Precision AI Scan
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => { addToast("Generating report...", "info"); setTimeout(() => navigate("/reports/rep_01"), 600); }}>
            <Download size={16} /> Download Report
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/analysis/${id || "ana_01"}/treatment`)}>
            Treatment & Route <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: usingRealModel ? "minmax(420px, 1.35fr) minmax(340px, 1fr)" : "1fr", gap: 24 }}>

        <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div className="tabs">
              {TABS.map(tab => (
                <button key={tab.id} className={`tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {totalImages > 1 && (
                <span style={{ fontSize: "0.75rem", color: "var(--lime)", fontWeight: 600 }}>
                  Image {safeIdx + 1} of {totalImages}
                </span>
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Zoom: {Math.round(zoomLevel * 100)}%</span>
            </div>
          </div>

          <div className="field-viewer" style={{ height: 480, position: "relative", overflow: "hidden", cursor: "crosshair", background: "#070f06" }}>
            <div style={{ width: "100%", height: "100%", transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.2s ease-out", position: "relative" }}>
              {displayImage ? (
                <img src={displayImage} alt={projectName || "Field Image"} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0.95)" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 12, textAlign: "center", padding: 24 }}>
                  <span style={{ fontSize: "2.5rem" }}>🌾</span>
                  <span style={{ fontSize: "0.9rem", maxWidth: 320 }}>No image available — upload a field image via New Analysis to begin</span>
                </div>
              )}
              {activeTab === "segmentation" && usingRealModel && (
                <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(11,18,9,0.82)", backdropFilter: "blur(6px)", border: "1px solid rgba(132,204,22,0.35)", borderRadius: 8, padding: "5px 10px", fontSize: "0.7rem", color: "var(--lime)", pointerEvents: "none", display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> Weed &nbsp;·&nbsp;
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#84cc16", display: "inline-block" }} /> Crop &nbsp;·&nbsp;
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#555", display: "inline-block" }} /> Background
                </div>
              )}
            </div>

            {/* Prev / Next arrows for multi-image */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(11,18,9,0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--border-dim)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--lime)", zIndex: 10 }}
                  title="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(11,18,9,0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--border-dim)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--lime)", zIndex: 10 }}
                  title="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="field-badge">
              <span className="status-dot success" />
              {usingRealModel
                ? <span>Model Output · Weed: {perImageStats ? perImageStats.weed_coverage_pct : aggWeed}% · Crop: {perImageStats ? perImageStats.crop_coverage_pct : aggCrop}%</span>
                : <span>{fieldName} · Precision AI Scan</span>}
            </div>

            <div className="field-controls">
              <button className="btn btn-secondary btn-icon" style={{ background: "rgba(11,18,9,0.85)", backdropFilter: "blur(8px)" }} onClick={handleZoomIn}    title="Zoom In">    <ZoomIn    size={16} /></button>
              <button className="btn btn-secondary btn-icon" style={{ background: "rgba(11,18,9,0.85)", backdropFilter: "blur(8px)" }} onClick={handleZoomOut}   title="Zoom Out">   <ZoomOut   size={16} /></button>
              <button className="btn btn-secondary btn-icon" style={{ background: "rgba(11,18,9,0.85)", backdropFilter: "blur(8px)" }} onClick={handleResetZoom} title="Reset Zoom"> <RotateCcw size={16} /></button>
            </div>
          </div>
        </div>

        {usingRealModel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Per-image stats when viewing a specific image */}
            {perImageStats && totalImages > 1 && (
              <div className="card" style={{ padding: "14px 18px", borderLeft: "3px solid var(--lime)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Image {safeIdx + 1} Stats
                </div>
                <div style={{ display: "flex", gap: 20, fontSize: "0.875rem" }}>
                  <span>Weed: <strong style={{ color: "#f97316" }}>{perImageStats.weed_coverage_pct}%</strong></span>
                  <span>Crop: <strong style={{ color: "var(--lime)" }}>{perImageStats.crop_coverage_pct}%</strong></span>
                  <span>BG: <strong>{perImageStats.background_pct}%</strong></span>
                </div>
              </div>
            )}

            {/* Aggregated stats heading */}
            {totalImages > 1 && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Aggregated Averages Across {totalImages} Images
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Weed Coverage",  value: `${aggWeed}%`, accent: "#f97316" },
                { label: "Crop Coverage",  value: `${aggCrop}%`, accent: "var(--lime)" },
                { label: "Weed Density",   value: aggDensity,            accent: "var(--text-primary)" },
                { label: "Hotspots Found", value: aggHotspots,           accent: "#ef4444" },
              ].map(({ label, value, accent }) => (
                <div key={label} className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>from model output</div>
                </div>
              ))}
            </div>

            {analysisResult.spray_message && (
              <div className="card" style={{ padding: "16px 18px", borderLeft: "4px solid var(--lime)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Agronomic Prescription (Kaggle Rules)
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Spray Level: <span style={{ color: "var(--lime)", textTransform: "uppercase" }}>{analysisResult.spray_level}</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                  {analysisResult.spray_message}
                </p>
              </div>
            )}

            <div className="info-card" style={{ display: "flex", gap: 12 }}>
              <Sparkles size={20} color="var(--lime)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 4 }}>Model-Based Results</div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  All values come directly from the U-Net segmentation on your uploaded image{totalImages > 1 ? "s" : ""}. Proceed to Treatment & Route to generate a UAV spraying plan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
