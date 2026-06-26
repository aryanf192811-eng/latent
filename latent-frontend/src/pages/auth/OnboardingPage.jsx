import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

const INTERESTS = ['Tech', 'Sports', 'Music', 'Art', 'Gaming', 'Science', 'Photography', 'Writing', 'Dance', 'Fitness', 'Cooking', 'Travel'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Pharmacy', 'MBA', 'Law', 'Design', 'Architecture'];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    department: '', year: '', hostel_type: 'hosteler', bio: '',
    interests: [], default_mess_id: null, avatar_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  const { data: messData } = useQuery({
    queryKey: ['onboarding-messes'],
    queryFn: () => api.get('/api/mess/messes').then(r => r.data),
  });

  const toggleInterest = (i) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/onboard', {
        department: form.department,
        year: parseInt(form.year),
        hostel_type: form.hostel_type,
        bio: form.bio,
        interests: form.interests,
        default_mess_id: form.default_mess_id || null,
      });
      updateUser(res.data.user || { onboarding_complete: true, ...form });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 24, margin: '0 auto 16px' }}>L</div>
          <span className="eyebrow">Getting Started</span>
          <h2 className="h1" style={{ marginTop: 4 }}>Set up your profile</h2>
          <p style={{ color: 'var(--text-3)', marginTop: 8 }}>Step {step} of 3</p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', background: 'var(--blue)', borderRadius: 2 }} />
        </div>

        <div className="card" style={{ padding: 32, minHeight: 360 }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <p className="h3" style={{ marginBottom: 4 }}>About you</p>
                  <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Tell us your academic details</p>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Department</label>
                  <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Year</label>
                  <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                    <option value="">Select year</option>
                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Accommodation</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['hosteler', '🏠 Hosteler'], ['day_scholar', '🚌 Day Scholar']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setForm(f => ({ ...f, hostel_type: val }))}
                        style={{
                          flex: 1, padding: '12px', borderRadius: 'var(--r2)', cursor: 'pointer',
                          border: `2px solid ${form.hostel_type === val ? 'var(--blue)' : 'var(--border)'}`,
                          background: form.hostel_type === val ? 'var(--blue-light)' : 'white',
                          fontWeight: 500, fontSize: 14, transition: 'all 0.15s',
                        }}>{label}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <p className="h3" style={{ marginBottom: 4 }}>Your interests</p>
                  <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Pick what you're into (select up to 8)</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(interest => {
                    const active = form.interests.includes(interest);
                    return (
                      <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                        style={{
                          padding: '8px 16px', borderRadius: 'var(--full)', cursor: 'pointer', transition: 'all 0.15s',
                          border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                          background: active ? 'var(--blue)' : 'white',
                          color: active ? 'white' : 'var(--text-2)',
                          fontWeight: 500, fontSize: 14,
                        }}>{interest}</button>
                    );
                  })}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio (optional)</label>
                  <textarea className="input" rows={3} placeholder="Something about you…" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <p className="h3" style={{ marginBottom: 4 }}>Your default mess</p>
                  <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Where do you usually eat?</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {messData?.map(mess => (
                    <button key={mess.id} type="button" onClick={() => setForm(f => ({ ...f, default_mess_id: mess.id }))}
                      style={{
                        padding: '14px 16px', borderRadius: 'var(--r2)', cursor: 'pointer',
                        border: `2px solid ${form.default_mess_id === mess.id ? 'var(--blue)' : 'var(--border)'}`,
                        background: form.default_mess_id === mess.id ? 'var(--blue-light)' : 'white',
                        textAlign: 'left', transition: 'all 0.15s',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{mess.name}</span>
                      {form.default_mess_id === mess.id && <Check size={16} color="var(--blue)" />}
                    </button>
                  ))}
                </div>
                {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : null}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: step > 1 ? 'pointer' : 'default', color: step > 1 ? 'var(--text-2)' : 'transparent', fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < 3 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Finishing…' : 'Complete Setup'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
