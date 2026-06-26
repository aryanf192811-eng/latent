import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { CardSkeleton, PostSkeleton } from '../components/common/Skeletons';
import { PostCard } from '../components/common/PostCard';
import { ImageWithFallback, Avatar } from '../components/common/ImageWithFallback';

export default function ClubDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('about');
  const queryClient = useQueryClient();

  const { data: club, isLoading } = useQuery({
    queryKey: qk.club(id),
    queryFn: () => api.get(`/api/clubs/${id}`).then(r => r.data.club || r.data),
  });

  const { data: members } = useQuery({
    queryKey: ['club-members', id],
    queryFn: () => api.get(`/api/clubs/${id}`).then(r => r.data),
    enabled: activeTab === 'members',
  });

  const join = useMutation({
    mutationFn: () => api.post(`/api/clubs/${id}/join`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.club(id) }); toast.success('Joined!'); },
    onError: err => toast.error(err.message),
  });

  const leave = useMutation({
    mutationFn: () => api.delete(`/api/clubs/${id}/leave`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.club(id) }); toast.success('Left club'); },
  });

  if (isLoading) return <div style={{ padding: 32 }}><CardSkeleton height={280} /></div>;
  if (!club) return <div style={{ padding: 32 }}>Club not found</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}>
      {/* Banner */}
      <div style={{ position: 'relative' }}>
        <ImageWithFallback src={club.banner_url} alt={club.name} category="clubs" style={{ width: '100%', height: 220 }} />
        <Link to="/clubs" style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', borderRadius: 'var(--full)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }}>
          <ArrowLeft size={14} /> All Clubs
        </Link>
      </div>

      <div style={{ padding: '0 32px 24px' }}>
        {/* Club logo + header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20, marginTop: -20 }}>
          <ImageWithFallback src={club.logo_url} alt={club.name} category="clubs" style={{ width: 72, height: 72, borderRadius: 'var(--r3)', border: '3px solid white', flexShrink: 0, boxShadow: 'var(--s2)' }} />
          <div style={{ flex: 1 }}>
            <span className="eyebrow">{club.category}</span>
            <h1 className="h2" style={{ marginTop: 4 }}>{club.name}</h1>
          </div>
          <button
            onClick={() => club.is_member ? leave.mutate() : join.mutate()}
            className={club.is_member ? 'btn-secondary' : 'btn-primary'}
          >
            {club.is_member ? <><Check size={14} /> Member</> : 'Join Club'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)' }}>
            <Users size={14} /> {club.members_count || 0} members
          </div>
        </div>

        {/* Tabs */}
        <div className="pill-tabs" style={{ marginBottom: 24 }}>
          {['about', 'members'].map(tab => (
            <button key={tab} className={`pill-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'about' && (
          <div>
            {club.description && <p className="body-comfortable" style={{ marginBottom: 20 }}>{club.description}</p>}
          </div>
        )}

        {activeTab === 'members' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {(members?.members || []).map(m => (
              <div key={m.id} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Avatar src={m.avatar_url} name={m.name} size={36} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{m.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
