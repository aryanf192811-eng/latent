import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { CardSkeleton } from '../components/common/Skeletons';

export default function MessTicketsPage() {
  const location = useLocation();
  const isNew = new URLSearchParams(location.search).get('new') === 'true';

  useEffect(() => {
    if (isNew) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  }, [isNew]);

  const { data, isLoading } = useQuery({
    queryKey: qk.tickets('active'),
    queryFn: () => api.get('/api/mess/history').then(r => r.data),
  });

  const tickets = data?.items || data || [];

  return (
    <div style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
      <Link to="/mess" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Mess
      </Link>

      {isNew && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 'var(--r3)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <CheckCircle size={20} color="var(--green)" />
          <div>
            <p style={{ fontWeight: 700, color: '#065F46' }}>Booking confirmed!</p>
            <p style={{ fontSize: 13, color: '#047857' }}>Your meal ticket has been generated.</p>
          </div>
        </div>
      )}

      <span className="eyebrow">Mess · Tickets</span>
      <h1 className="h1" style={{ marginBottom: 28 }}>My Meal Tickets</h1>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map(i => <CardSkeleton key={i} height={200} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'var(--text-4)', marginBottom: 16 }}>No tickets yet</p>
          <Link to="/mess/book" className="btn-primary" style={{ textDecoration: 'none' }}>Book a meal</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className="card" style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ flexShrink: 0 }}>
                <QRCodeSVG value={`LATENT-TICKET-${ticket.id}`} size={100} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, textTransform: 'capitalize' }}>{ticket.meal_type}</p>
                  <span className={`badge ${ticket.status === 'verified' ? 'badge-green' : 'badge-amber'}`}>{ticket.status}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="mono-sm">Ticket #{ticket.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
