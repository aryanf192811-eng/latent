import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import '../../styles/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Animated Background Blobs */}
      <div className="auth-bg-shapes">
        <div className="auth-blob blob-1"></div>
        <div className="auth-blob blob-2"></div>
        <div className="auth-blob blob-3"></div>
      </div>

      <main className="auth-container">
        {/* Floating Glass Icons */}
        <div className="auth-float-icon icon-top-left">
          <span className="material-symbols-outlined">lock</span>
        </div>
        <div className="auth-float-icon icon-bottom-right">
          <span className="material-symbols-outlined">school</span>
        </div>

        {/* Central Card */}
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-brand">Latent</h1>
            <p className="auth-subtitle">Welcome back to campus!</p>
          </div>

          {/* Toggle */}
          <div className="auth-toggle">
            <div className="toggle-highlight highlight-left"></div>
            <span className="toggle-btn active">Login</span>
            <Link to="/register" className="toggle-btn inactive">Sign Up</Link>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">University Email</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  placeholder="you@paruluniversity.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  className="auth-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '48px' }}
                />
                <button 
                  type="button" 
                  className="pw-toggle" 
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Having trouble accessing your account? <br/>
          <Link to="#">Contact IT Support</Link>
        </div>
      </main>
    </div>
  );
}
