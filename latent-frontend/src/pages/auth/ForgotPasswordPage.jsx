import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Mail, Lock } from 'lucide-react';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp });
      setResetToken(res.data.reset_token);
      setStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { reset_token: resetToken, new_password: newPassword });
      navigate('/login');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'OTP' },
    { num: 3, label: 'Reset' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="eyebrow">Password Recovery</span>
          <h2 className="h1" style={{ marginTop: 4 }}>Reset your password</h2>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {steps.map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s.num ? 'var(--blue)' : 'var(--bg-surface)',
                color: step >= s.num ? 'white' : 'var(--text-4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                transition: 'all 0.3s',
              }}>{s.num}</div>
              <span style={{ fontSize: 12, color: step >= s.num ? 'var(--text-2)' : 'var(--text-4)', fontWeight: 500 }}>{s.label}</span>
              {s.num < 3 && <div style={{ width: 24, height: 1, background: step > s.num ? 'var(--blue)' : 'var(--border)', transition: 'all 0.3s' }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--blue-light)', borderRadius: 'var(--r2)' }}>
                  <Mail size={18} color="var(--blue)" />
                  <p style={{ fontSize: 14, color: 'var(--blue-text)' }}>Enter your university email and we'll send an OTP.</p>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email address</label>
                  <input className="input" type="email" placeholder="you@paruluniversity.ac.in" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </motion.form>
            )}
            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Enter the 6-digit OTP sent to <strong>{email}</strong></p>
                <input className="input" type="text" placeholder="123456" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required style={{ letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 24 }} />
                {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                  <ArrowLeft size={14} /> Back
                </button>
              </motion.form>
            )}
            {step === 3 && (
              <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleStep3} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--green-bg)', borderRadius: 'var(--r2)' }}>
                  <Lock size={18} color="var(--green)" />
                  <p style={{ fontSize: 14, color: '#065F46' }}>OTP verified! Set your new password.</p>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>New password</label>
                  <input className="input" type="password" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
                <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-3)' }}>
          Remember it?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
