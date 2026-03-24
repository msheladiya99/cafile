import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../services/api';
import { Helmet } from 'react-helmet-async';

/* ── Icons ── */

const FingerprintIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
    <path d="M5 19.5C5.5 18 6 15 6 12c0-3.3 2.7-6 6-6 1.8 0 3.4.8 4.5 2"/>
    <path d="M8 21c.5-2.5 1-4.5 1-7 0-1.7 1.3-3 3-3s3 1.3 3 3c0 2.5.5 4.5 1 7"/>
    <path d="M2 17c2-.5 4-1 6.5-1 2 0 3.5.5 5.5 1s3.5.5 5.5 0"/>
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const SuperAdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/super-admin/login`, { email, password });
      await new Promise(r => setTimeout(r, 500));
      setAuth(res.data.token, res.data.user);
      navigate('/super-admin/dashboard');
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    height: 50,
    paddingLeft: 40,
    paddingRight: 40,
    border: `1.5px solid ${focused ? '#7c3aed' : '#e5e5e5'}`,
    borderRadius: 10,
    fontSize: 14,
    color: '#111',
    background: focused ? '#faf7ff' : '#fff',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s, background 0.15s',
    boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.10)' : 'none',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'Inter, -apple-system, sans-serif',
      background: '#f5f3ff',
    }}>
      <Helmet>
        <title>Super Admin Login | MyCAFile</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* ── LEFT PANEL ── */}
      <div style={{
        display: 'none',
        width: '55%',
        background: 'linear-gradient(145deg, #5b21b6 0%, #7c3aed 55%, #9333ea 100%)',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '60px 64px',
      }} className="sa-left">

        {/* Background decorative circles */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>

          {/* Logo box */}
          <div style={{
            width: 88, height: 88, borderRadius: 24,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 32,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -1, lineHeight: 1.1 }}>
            MyCaFile
          </h1>

          {/* Divider + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ height: 2, width: 44, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.7)' }}>
              Super Admin
            </span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.65)', marginBottom: 44 }}>
            Enterprise-grade control panel with advanced security protocols and comprehensive administrative tools.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
            {['256-bit Encryption', '2FA Enabled', 'Audit Logs', 'Role-Based Access'].map(f => (
              <div key={f} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.10)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Domain badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 52 }}>
            <FingerprintIcon />
            <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>mycafile.in</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: '44px 40px 36px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        }}>
          {/* Header */}
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Sign in</h2>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>
            Super Admin · MyCAFile
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              color: '#dc2626', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                <MailIcon />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusEmail(true)}
                onBlur={() => setFocusEmail(false)}
                disabled={isLoading}
                required
                style={inputStyle(focusEmail)}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                <LockIcon />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusPassword(true)}
                onBlur={() => setFocusPassword(false)}
                disabled={isLoading}
                required
                style={inputStyle(focusPassword)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Forgot */}
            <div style={{ marginBottom: 24 }}>
              <button type="button" style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              style={{
                width: '100%', height: 52, borderRadius: 50, border: 'none',
                background: isLoading ? '#c4b5fd' : hovering
                  ? 'linear-gradient(135deg, #6d28d9, #7c3aed)'
                  : 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s', fontFamily: 'Inter, sans-serif', letterSpacing: 0.3,
                boxShadow: isLoading ? 'none' : '0 6px 20px rgba(124,58,237,0.35)',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 0' }}>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
            <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>Authorized personnel only</span>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 20, lineHeight: 1.6 }}>
            By signing in, you agree to our{' '}
            <span style={{ color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #bbb; }
        @media (min-width: 1024px) {
          .sa-left { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminLogin;
