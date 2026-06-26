import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Check, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { CardSkeleton } from '../components/common/Skeletons';
import { ImageWithFallback, Avatar } from '../components/common/ImageWithFallback';

export default function EventDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: qk.event(id),
    queryFn: () => api.get(`/api/events/${id}`).then(r => r.data.event || r.data),
  });

  const { data: memories } = useQuery({
    queryKey: ['memories', id],
    queryFn: () => api.get(`/api/events/${id}/memories`).then(r => r.data.items || r.data),
    enabled: activeTab === 'memories',
  });

  const rsvp = useMutation({
    mutationFn: (status) => api.post(`/api/events/${id}/rsvp`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.event(id) });
      toast.success('RSVP updated!');
    },
    onError: err => toast.error(err.message),
  });

  const uploadMemory = useMutation({
    mutationFn: (formData) => api.post(`/api/events/${id}/memories`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['memories', id]);
      toast.success('Memory uploaded!');
    },
    onError: err => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
        <CardSkeleton height={300} />
      </div>
    );
  }

  if (!event) return <div style={{ padding: 32 }}>Event not found</div>;

  const date = event.starts_at ? new Date(event.starts_at) : null;
  const isGoing = event.user_rsvp === 'going';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 80 }}>
      {/* Banner */}
      <div style={{ position: 'relative' }}>
        <ImageWithFallback
          src={event.banner_url}
          alt={event.title}
          category="events"
          style={{ width: '100%', height: 280 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
        <Link to="/events" style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', borderRadius: 'var(--full)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        {event.club && <span className="eyebrow">{event.club.name}</span>}
        <h1 className="h1" style={{ marginTop: 4, marginBottom: 16 }}>{event.title}</h1>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          {date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 14 }}>
              <Calendar size={16} color="var(--blue)" />
              <span>{format(date, 'EEEE, d MMMM yyyy')}</span>
            </div>
          )}
          {date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 14 }}>
              <Clock size={16} color="var(--blue)" />
              <span>{format(date, 'h:mm a')}</span>
            </div>
          )}
          {event.location_text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 14 }}>
              <MapPin size={16} color="var(--blue)" />
              <span>{event.location_text}</span>
            </div>
          )}
          {event.attendees_count != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 14 }}>
              <Users size={16} color="var(--blue)" />
              <span>{event.attendees_count} going</span>
            </div>
          )}
        </div>

        {/* RSVP */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => rsvp.mutate(isGoing ? 'not_going' : 'going')}
            className={isGoing ? 'btn-secondary' : 'btn-primary'}
            disabled={rsvp.isPending}
            style={{ gap: 8 }}
          >
            {isGoing ? <><Check size={16} /> You're going</> : 'RSVP — I\'m Going'}
          </button>
        </div>

        {/* Tabs */}
        <div className="pill-tabs" style={{ marginBottom: 24 }}>
          {['details', 'memories'].map(tab => (
            <button key={tab} className={`pill-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <div>
            {event.description && (
              <p className="body-comfortable" style={{ marginBottom: 24 }}>{event.description}</p>
            )}
          </div>
        )}

        {activeTab === 'memories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <p className="h3">Event Memories</p>
              <label className="btn-secondary" style={{ cursor: 'pointer', gap: 6 }}>
                <Upload size={14} /> Upload
                <input type="file" accept="image/*" hidden onChange={e => {
                  if (e.target.files[0]) {
                    const fd = new FormData();
                    fd.append('image', e.target.files[0]);
                    uploadMemory.mutate(fd);
                  }
                }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {memories?.map(mem => (
                <img key={mem.id} src={mem.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--r2)' }} loading="lazy" />
              ))}
            </div>
            {(!memories || memories.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-4)' }}>
                <Image size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p>No memories yet. Be the first to upload!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
