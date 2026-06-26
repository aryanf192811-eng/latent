import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import '../../styles/auth.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', enrollment_no: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        enrollment_no: form.enrollment_no || undefined,
        password: form.password,
      });
      login(res.data.user, res.data.token);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
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
          <span className="material-symbols-outlined">person_add</span>
        </div>
        <div className="auth-float-icon icon-bottom-right">
          <span className="material-symbols-outlined">school</span>
        </div>

        {/* Central Card */}
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-brand">Latent</h1>
            <p className="auth-subtitle">Join the campus community!</p>
          </div>

          {/* Toggle */}
          <div className="auth-toggle">
            <div className="toggle-highlight highlight-right"></div>
            <Link to="/login" className="toggle-btn inactive">Login</Link>
            <span className="toggle-btn active">Sign Up</span>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  id="name"
                  className="auth-input"
                  type="text"
                  placeholder="e.g. Aryan Shah"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">University Email</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  placeholder="you@paruluniversity.ac.in"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="enrollment_no">Enrollment Number <span style={{fontWeight: 'normal', color: '#7b7486'}}>(Optional)</span></label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">badge</span>
                <input
                  id="enrollment_no"
                  className="auth-input"
                  type="text"
                  placeholder="220000000001"
                  value={form.enrollment_no}
                  onChange={e => setForm(f => ({ ...f, enrollment_no: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  className="auth-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
