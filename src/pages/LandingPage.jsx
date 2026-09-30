import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf, ArrowRight, Scan, Map, GitBranch, BarChart3,
  Download, CheckCircle, ChevronRight, Star, Zap, Shield,
  Layers, Eye, FlaskConical
} from 'lucide-react';

const features = [
  {
    icon: Scan,
    title: 'Deep Segmentation',
    desc: 'U-Net architecture trained on 50,000+ annotated field images to classify every pixel as crop, weed, or background.',
  },
  {
    icon: Map,
    title: 'Field Stitching',
    desc: 'Photogrammetry-grade stitching turns overlapping drone frames into a georeferenced field map in minutes.',
  },
  {
    icon: GitBranch,
    title: 'Zone Mapping',
    desc: 'Automatically divides your field into treatment zones based on weed density clusters and hotspot analysis.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    desc: 'Weed coverage %, density maps, hotspot flagging and trend tracking across multiple surveys.',
  },
  {
    icon: FlaskConical,
    title: 'Treatment Routes',
    desc: 'Generate optimised serpentine spray routes with configurable thresholds and coverage targets.',
  },
  {
    icon: Download,
    title: 'Exportable Reports',
    desc: 'Download full analysis reports with zone breakdowns, charts, and treatment summaries in PDF format.',
  },
];

const steps = [
  { num: '01', title: 'Upload', desc: 'Drop your drone images — JPG, PNG, or RAW — from any standard drone platform.' },
  { num: '02', title: 'Segment', desc: 'Our computer vision model classifies every pixel in your field imagery.' },
  { num: '03', title: 'Map', desc: 'Image frames are stitched into a single georeferenced field map.' },
  { num: '04', title: 'Analyse', desc: 'Weed coverage, density zones and hotspots are calculated automatically.' },
  { num: '05', title: 'Act', desc: 'Download your treatment map and route plan — ready for your next field operation.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">
          <div className="nav-logo-badge">
            <Leaf size={16} color="#0b1209" strokeWidth={2.5} />
          </div>
          Crop & Weed AI
        </div>

        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        {/* Background field image overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.12,
          filter: 'saturate(0.4)',
        }} />

        <div className="hero-content fade-up">
          <div className="hero-eyebrow">
            <Zap size={13} />
            Research Prototype · Computer Vision Agriculture
          </div>

          <h1 className="hero-title">
            See Your Field.<br />
            <span className="accent">Find Every Weed.</span>
          </h1>

          <p className="hero-subtitle">
            High-resolution drone imagery meets deep learning. Identify weed regions,
            map field density, and generate precision treatment routes — automatically.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start for Free <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              Explore Demo
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            {['No credit card', 'Free analysis', 'Research grade AI'].map(txt => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} style={{ color: 'var(--lime)' }} />
                {txt}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Bridging */}
      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 80, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--lime)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 16 }}>
              <Star size={13} fill="currentColor" /> PRECISION AG · TO SCALE
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>
              Bridging High-Resolution Computer Vision and On-Field Agro-Ecology.
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9375rem', maxWidth: 480 }}>
              Current tools treat fields uniformly. Crop & Weed AI identifies where
              weeds are thriving, at resolution good enough for targeted intervention.
              Field teams act on evidence, not estimates.
            </p>
          </div>

          <div className="feature-grid" style={{ flex: '1 1 500px' }}>
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon">
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION: How it works */}
      <section id="how-it-works" style={{ padding: '80px 48px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dim)', borderBottom: '1px solid var(--border-dim)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--lime)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 16 }}>
              <Layers size={13} /> FROM FIELD TO ACTION
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: 12 }}>
              How Crop & Weed AI Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: 500, margin: '0 auto' }}>
              Five steps from raw drone footage to actionable field intelligence.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ flex: '1 1 180px', position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 20, right: -8, zIndex: 1 }}>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    background: 'var(--lime-dim)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-full)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: 'var(--lime)',
                    fontSize: '0.875rem',
                    marginBottom: 14,
                  }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Demo UI card */}
          <div style={{ marginTop: 48, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#ef4444','#f59e0b','#84cc16'].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>segment · v0.9</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {['Crop', 'Weed', 'Background', 'Action Ready'].map((l, i) => (
                    <span key={l} className={`badge badge-${i === 0 ? 'success' : i === 1 ? 'warning' : i === 2 ? 'muted' : 'lime'}`}
                      style={{ fontSize: '0.6875rem' }}>
                      {l}
                    </span>
                  ))}
                </div>
                <div style={{
                  height: 180,
                  borderRadius: 'var(--r-md)',
                  background: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a2d 40%, #1a4a20 70%, #0f2a10 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=60)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.5,
                  }} />
                  {/* Fake weed overlay blobs */}
                  {[
                    { x: 25, y: 30, w: 80, h: 60 },
                    { x: 55, y: 55, w: 60, h: 50 },
                    { x: 70, y: 20, w: 50, h: 40 },
                  ].map((b, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      width: b.w,
                      height: b.h,
                      background: 'rgba(245,158,11,0.5)',
                      borderRadius: '50%',
                      filter: 'blur(8px)',
                    }} />
                  ))}
                  <span style={{ position: 'relative', zIndex: 1, color: 'white', fontWeight: 600, fontSize: '0.875rem', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 'var(--r-full)' }}>
                    02 Segment
                  </span>
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
                Turn Field Images Into<br />
                <span style={{ color: 'var(--lime)' }}>Actionable Field Intelligence.</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9375rem', marginBottom: 24 }}>
                Every drone flight generates data. Crop & Weed AI transforms that raw imagery
                into zone-level treatment intelligence your agronomist can act on the same day.
              </p>
              <Link to="/signup" className="btn btn-primary">
                Start Analysing <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Contact / CTA */}
      <section id="contact" style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 64, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 380px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--lime)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 16 }}>
              <Shield size={13} /> GET IN TOUCH
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 12 }}>
              Let's Build Smarter Farming Together
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9375rem', marginBottom: 28 }}>
              Turn your drone footage into actionable field intelligence. We work with
              agronomists, researchers, and farm managers to deliver precision outcomes.
            </p>
            <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <input className="input" placeholder="First name" />
                <input className="input" placeholder="Last name" />
              </div>
              <input className="input" type="email" placeholder="Email address" />
              <textarea className="input" rows={4} placeholder="Tell us about your field…" style={{ resize: 'vertical' }} />
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Send Message <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div style={{ flex: '1 1 320px' }}>
            <div className="card" style={{ background: 'var(--bg-card-2)', padding: 28 }}>
              <div className="feature-icon" style={{ marginBottom: 16 }}>
                <Eye size={20} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Turn Field Images Into Actionable Field Intelligence.</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
                Join researchers and agronomists using Crop & Weed AI to make precision decisions. No guesswork, no manual counting.
              </p>
              {['GPS-aligned segmentation', 'Multi-frame stitching', 'Zone-level density maps', 'Automated treatment routes'].map(txt => (
                <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CheckCircle size={15} style={{ color: 'var(--lime)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{txt}</span>
                </div>
              ))}
              <Link to="/signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
                Start Free Analysis <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border-dim)',
        padding: '32px 48px',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="nav-logo">
            <div className="nav-logo-badge">
              <Leaf size={14} color="#0b1209" strokeWidth={2.5} />
            </div>
            Crop & Weed AI
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {['About', 'How it Works', 'Research', 'Contact'].map(l => (
              <a key={l} href="#" className="nav-link" style={{ fontSize: '0.8125rem' }}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © 2025 Crop & Weed AI · Research Prototype
          </div>
        </div>
      </footer>
    </div>
  );
}
