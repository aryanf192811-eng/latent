import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/ImageWithFallback';

const NOTIF_TYPE_COLORS = {
  like: 'var(--amber)', comment: 'var(--blue)', follow: 'var(--green)',
  mention: 'var(--blue)', announcement: 'var(--red)', event: 'var(--blue)', mess: 'var(--amber)',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.notifs(),
    queryFn: () => api.get('/api/notifications?page=1&limit=30').then(r => r.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.notifs() }); toast.success('All marked as read'); },
    onError: err => toast.error(err.message),
  });

  const markOne = useMutation({
    mutationFn: (id) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.notifs() }),
  });

  // Backend returns { notifications: [], announcements: [], unread_count }
  let notifications = data?.notifications || data?.items || [];
  if (!Array.isArray(notifications)) notifications = [];
  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <span className="eyebrow">Activity · Updates</span>
          <h1 className="h1">Notifications {unread > 0 && <span className="badge badge-blue" style={{ fontSize: 14, marginLeft: 10 }}>{unread} new</span>}</h1>
        </div>
        {unread > 0 && (
          <button className="btn-secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending} style={{ gap: 6 }}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="skel" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skel" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skel" style={{ height: 11, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up!" description="No new notifications right now." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => !notif.is_read && markOne.mutate(notif.id)}
              className="card"
              style={{
                padding: '14px 18px',
                display: 'flex', gap: 14, alignItems: 'center',
                cursor: notif.is_read ? 'default' : 'pointer',
                background: notif.is_read ? 'white' : 'var(--blue-light)',
                borderLeft: notif.is_read ? '1px solid var(--border)' : `3px solid ${NOTIF_TYPE_COLORS[notif.type] || 'var(--blue)'}`,
                transition: 'all 0.15s',
              }}
            >
              <Avatar src={notif.actor?.avatar_url} name={notif.actor?.name} size={40} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: notif.is_read ? 400 : 600, color: 'var(--text-1)', lineHeight: 1.4, marginBottom: 3 }}>
                  {notif.title || notif.message || notif.content}
                </p>
                {(notif.body || notif.description) && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 3 }}>{notif.body || notif.description}</p>}
                <p className="mono-sm">
                  {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : ''}
                </p>
              </div>
              {!notif.is_read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
