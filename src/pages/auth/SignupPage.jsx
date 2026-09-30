import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, addToast } = useApp();
  const navigate = useNavigate();

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    login(form.email, form.password);
    setLoading(false);
    addToast('Account created! Welcome to Crop & Weed AI', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card" style={{ maxWidth: 480 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div className="auth-logo-icon">
            <Leaf size={18} color="#0b1209" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Crop & Weed AI
          </span>
        </Link>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Free access · No credit card required</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="name"
                className="input"
                style={{ paddingLeft: 38 }}
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Jane Agronomist"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="signup-email">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="signup-email"
                type="email"
                className="input"
                style={{ paddingLeft: 38 }}
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@farm.com"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="signup-pass">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="signup-pass"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Min 8 chars"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirm-pass">Confirm</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="confirm-pass"
                  type="password"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  value={form.confirm}
                  onChange={e => update('confirm', e.target.value)}
                  placeholder="Repeat"
                  required
                />
              </div>
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
                Creating account…
              </>
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
          By signing up you agree to the Terms of Service and Privacy Policy.
        </p>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
