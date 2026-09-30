import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div className="auth-logo-icon">
            <Leaf size={18} color="#0b1209" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Crop & Weed AI
          </span>
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--lime-dim)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Mail size={24} style={{ color: 'var(--lime)' }} />
            </div>
            <h1 className="auth-title" style={{ marginBottom: 8 }}>Check your email</h1>
            <p className="auth-subtitle">
              We sent a reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '16px 0 24px' }}>
              Didn't get it? Check your spam folder or try again.
            </p>
            <button onClick={() => setSent(false)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Try again
            </button>
            <Link to="/login" className="auth-link" style={{ display: 'block', marginTop: 16, fontSize: '0.875rem' }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">Enter your email and we'll send a reset link.</p>

            <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              <div className="input-group">
                <label className="input-label" htmlFor="fp-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="fp-email"
                    type="email"
                    className="input"
                    style={{ paddingLeft: 38 }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
                disabled={loading}
              >
                {loading ? (
                  <div style={{ width: 16, height: 16, border: '2px solid #0b1209', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
                ) : (
                  <>Send Reset Link <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
