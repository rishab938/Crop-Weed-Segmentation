import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@cropweedai.com');
  const [password, setPassword] = useState('demo1234');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, addToast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate network
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      addToast('Welcome back! Redirecting to dashboard…', 'success');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Try demo@cropweedai.com / demo1234');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div className="auth-logo-icon">
            <Leaf size={18} color="#0b1209" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Crop & Weed AI
          </span>
        </Link>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your precision agriculture workspace</p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            fontSize: '0.875rem',
            color: 'var(--error)',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                className="input"
                style={{ paddingLeft: 38 }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="input-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.8125rem' }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid #0b1209', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
                Signing in…
              </>
            ) : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: '24px 0' }}>or</div>

        {/* Demo hint */}
        <div style={{
          background: 'var(--lime-dim)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '12px 14px',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--lime)' }}>Demo credentials:</strong> <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>demo@cropweedai.com</code> / <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>demo1234</code>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginTop: 10, background: 'var(--bg-card)' }}
            onClick={() => {
              login('demo@cropweedai.com', 'demo1234');
              addToast('Signed in as demo agronomist', 'success');
              navigate('/dashboard');
            }}
          >
            ⚡ Quick 1-Click Demo Sign-in
          </button>
        </div>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
