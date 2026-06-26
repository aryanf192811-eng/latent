import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useSSE(onNotification, onUnreadCount) {
  const token = useAuthStore(s => s.token);
  useEffect(() => {
    if (!token) return;
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/stream?token=${token}`;
    const es = new EventSource(url);
    es.addEventListener('notification', e => onNotification?.(JSON.parse(e.data)));
    es.addEventListener('unread_count', e => onUnreadCount?.(JSON.parse(e.data).count));
    es.onerror = () => {
      // silently reconnect — EventSource does this automatically
    };
    return () => es.close();
  }, [token]);
}
