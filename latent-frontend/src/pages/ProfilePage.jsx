import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Check, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { PostCard } from '../components/common/PostCard';
import { PostSkeleton } from '../components/common/Skeletons';
import { Avatar } from '../components/common/ImageWithFallback';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuthStore();
  const [activeTab, setActiveTab] = useState('posts');
  const queryClient = useQueryClient();
  const isOwn = me?.id?.toString() === id?.toString();

  // CORRECT endpoint per RULES.md: /api/users/:id/profile
  const { data: profile, isLoading } = useQuery({
    queryKey: qk.profile(id),
    queryFn: () => api.get(`/api/users/${id}/profile`).then(r => r.data.user || r.data),
  });

  const { data: postsData } = useQuery({
    queryKey: ['profile-posts', id],
    queryFn: () => api.get(`/api/posts?user_id=${id}&page=1&limit=20`).then(r => r.data),
    enabled: activeTab === 'posts',
  });

  const follow = useMutation({
    mutationFn: () => api.post(`/api/users/${id}/follow`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.profile(id) }); toast.success('Following!'); },
    onError: err => toast.error(err.message),
  });

  const unfollow = useMutation({
    mutationFn: () => api.delete(`/api/users/${id}/follow`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.profile(id) }); },
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'center' }}>
          <div className="skel" style={{ width: 80, height: 80, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ height: 24, width: '40%', marginBottom: 10 }} />
            <div className="skel" style={{ height: 16, width: '60%' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 60 }} />)}
        </div>
      </div>
    );
  }

  if (!profile) return <div style={{ padding: 32 }}>Profile not found</div>;

  const posts = postsData?.items || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 32px 80px' }}>
      {/* Profile header */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28 }}>
        <Avatar src={profile.avatar_url} name={profile.name} size={80} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <h1 className="h2">{profile.name}</h1>
              <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 3 }}>
                {profile.department} {profile.year ? `· Year ${profile.year}` : ''}
              </p>
            </div>
            {isOwn ? (
              <Link to="/profile/edit" className="btn-secondary" style={{ textDecoration: 'none', gap: 6 }}>
                <Edit size={14} /> Edit Profile
              </Link>
            ) : (
              <button
                onClick={() => profile.is_following ? unfollow.mutate() : follow.mutate()}
                className={profile.is_following ? 'btn-secondary' : 'btn-primary'}
                style={{ gap: 6 }}
              >
                {profile.is_following ? <><Check size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
              </button>
            )}
          </div>
          {profile.bio && <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14, maxWidth: 500 }}>{profile.bio}</p>}
          {profile.interests?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.interests.map(i => (
                <span key={i} className="badge badge-blue">{i}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row (SoundRich style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Followers', value: profile.followers_count ?? 0 },
          { label: 'Following', value: profile.following_count ?? 0 },
          { label: 'Posts', value: profile.posts_count ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: 32 }}>{value}</div>
            <div className="stat-label" style={{ marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="pill-tabs" style={{ marginBottom: 24 }}>
        {['posts'].map(tab => (
          <button key={tab} className={`pill-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.length === 0 && !postsData
          ? [1, 2].map(i => <PostSkeleton key={i} />)
          : posts.map(post => <PostCard key={post.id} post={post} />)
        }
        {postsData && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-4)' }}>No posts yet</div>
        )}
      </div>
    </div>
  );
}
