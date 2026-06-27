import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useSSE(onNotification, onUnreadCount) {
  const token = useAuthStore(s => s.token);
  useEffect(() => {
    if (!token) return;
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/stream?token=${token}`;
    const es = new EventSource(url);
    es.addEventListener('notification', e => onNotification?.(JSON.parse(e.data)));
    es.addEventListener('unread_count', e => {
      try {
        const parsed = JSON.parse(e.data);
        // Backend may send plain number or {count: N}
        onUnreadCount?.(typeof parsed === 'number' ? parsed : (parsed.count ?? parsed));
      } catch {
        onUnreadCount?.(Number(e.data) || 0);
      }
    });
    es.onerror = () => {
      // silently reconnect — EventSource does this automatically
    };
    return () => es.close();
  }, [token]);
}
