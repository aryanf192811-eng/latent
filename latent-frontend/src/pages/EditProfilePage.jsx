import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/common/ImageWithFallback';

const INTERESTS = ['Tech', 'Sports', 'Music', 'Art', 'Gaming', 'Science', 'Photography', 'Writing', 'Dance', 'Fitness', 'Cooking', 'Travel'];

export default function EditProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  });
  const [interests, setInterests] = useState(user?.interests || []);

  const update = useMutation({
    mutationFn: () => api.put('/api/users/me', { ...form, interests }),
    onSuccess: (res) => {
      updateUser(res.data || form);
      toast.success('Profile updated!');
      navigate(`/profile/${user?.id}`);
    },
    onError: err => toast.error(err.message),
  });

  const handleSave = async () => {
    await update.mutateAsync();
  };

  const toggleInterest = (i) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div style={{ padding: '32px', maxWidth: 600, margin: '0 auto' }}>
      <Link to={`/profile/${user?.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <span className="eyebrow">Account · Settings</span>
      <h1 className="h1" style={{ marginBottom: 28 }}>Edit Profile</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar */}
        <div className="card" style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
          <Avatar src={form.avatar_url} name={form.name} size={72} />
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Avatar URL</label>
            <input className="input" placeholder="https://…" value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} />
          </div>
        </div>

        {/* Basic info */}
        <div className="card" style={{ padding: 24 }}>
          <p className="h4" style={{ marginBottom: 16 }}>Basic Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio</label>
              <textarea className="input" rows={3} placeholder="Tell campus about yourself…" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="card" style={{ padding: 24 }}>
          <p className="h4" style={{ marginBottom: 12 }}>Interests</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INTERESTS.map(interest => {
              const active = interests.includes(interest);
              return (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--full)', cursor: 'pointer', transition: 'all 0.15s',
                    border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                    background: active ? 'var(--blue)' : 'white',
                    color: active ? 'white' : 'var(--text-2)',
                    fontWeight: 500, fontSize: 13,
                  }}>{interest}</button>
              );
            })}
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={update.isPending} style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', gap: 6 }}>
          <Save size={16} /> {update.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
