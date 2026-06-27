import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

const WeatherIcon = ({ code, size = 24 }) => {
  const isNight = code?.endsWith('n');
  const base = code?.slice(0, 2);
  const amber = '#F59E0B';
  const slate = '#94A3B8';
  const slateLight = '#CBD5E1';
  const slateDark = '#64748B';
  const blue = '#2563EB';

  if (base === '01') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill={isNight ? slate : amber} />
      {!isNight && <>
        <line x1="12" y1="2" x2="12" y2="5" stroke={amber} strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="12" y2="22" stroke={amber} strokeWidth="2" strokeLinecap="round"/>
        <line x1="2" y1="12" x2="5" y2="12" stroke={amber} strokeWidth="2" strokeLinecap="round"/>
        <line x1="19" y1="12" x2="22" y2="12" stroke={amber} strokeWidth="2" strokeLinecap="round"/>
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke={amber} strokeWidth="2" strokeLinecap="round"/>
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke={amber} strokeWidth="2" strokeLinecap="round"/>
      </>}
    </svg>
  );
  if (base === '02') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="13" r="3" fill={slate}/>
      <circle cx="15" cy="13" r="3" fill={slate}/>
      <rect x="6" y="13" width="12" height="4" rx="2" fill={slate}/>
      <circle cx="8" cy="9" r="3" fill={amber} opacity="0.8"/>
    </svg>
  );
  if (base === '03' || base === '04') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="13" r="3.5" fill={base === '04' ? slateDark : slate}/>
      <circle cx="13" cy="11" r="4" fill={slateLight}/>
      <rect x="6" y="13" width="12" height="4" rx="2" fill={slate}/>
    </svg>
  );
  if (base === '09' || base === '10') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.5" fill={slateDark}/>
      <circle cx="14" cy="8" r="4" fill={slate}/>
      <rect x="6" y="9" width="11" height="4" rx="2" fill={slate}/>
      <line x1="9" y1="15" x2="8" y2="19" stroke={blue} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="15" x2="12" y2="19" stroke={blue} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="15" x2="16" y2="19" stroke={blue} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (base === '11') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.5" fill="#475569"/>
      <circle cx="14" cy="8" r="4" fill={slateDark}/>
      <rect x="6" y="9" width="11" height="4" rx="2" fill={slateDark}/>
      <polygon points="13,14 10,19 12,19 9,24 16,17 13,17" fill={amber}/>
    </svg>
  );
  // default: cloudy
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="13" r="3" fill={slate}/>
      <circle cx="15" cy="13" r="3" fill={slate}/>
      <rect x="6" y="13" width="12" height="4" rx="2" fill={slate}/>
    </svg>
  );
};

export function WeatherWidget() {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['weather'],
    queryFn: () => api.get('/api/weather').then(r => r.data),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 25 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <button style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '9999px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
      }}>
        <span style={{ color: 'var(--on-surface-variant)' }}>—°C</span>
      </button>
    );
  }

  if (!data) return null;

  const temp = data.temperature ?? data.temp;
  const feelsLike = data.feels_like;

  return (
    <>
      <button
        id="weather-widget-btn"
        onClick={() => setOpen(prev => !prev)}
        title="Campus weather — click for details"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '9999px',
          background: open ? 'rgba(189,0,255,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(189,0,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
        }}
      >
        <WeatherIcon code={data.icon} size={18} />
        <span style={{
          fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em',
          color: open ? '#bd00ff' : 'var(--on-surface)',
        }}>
          {Math.round(temp)}°C
        </span>
      </button>

      {open && (
        <div
          id="weather-detail-panel"
          style={{
            position: 'fixed', top: '80px', right: '16px', width: '300px',
            background: 'rgba(20,14,36,0.85)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            zIndex: 200, overflow: 'hidden',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(189,0,255,0.7) 0%, rgba(0,224,255,0.25) 100%)',
            padding: '20px 24px 24px', color: '#fff', position: 'relative',
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '8px' }}>
              ☁️ {data.location || 'Waghodia, Gujarat'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <WeatherIcon code={data.icon} size={52} />
              <div>
                <div style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#fff' }}>
                  {Math.round(temp)}°
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize', marginTop: '2px' }}>
                  {data.description}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 24px 20px' }}>
            {[
              { label: 'Feels like', value: feelsLike != null ? `${Math.round(feelsLike)}°C` : '—', icon: '🌡️' },
              { label: 'Humidity',   value: data.humidity != null ? `${data.humidity}%` : '—',          icon: '💧' },
              { label: 'Wind',       value: data.wind_speed != null ? `${Math.round(data.wind_speed)} km/h` : '—', icon: '🌬️' },
              { label: 'Campus',     value: 'Waghodia, Vadodara',                                         icon: '📍' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  <span>{row.icon}</span><span>{row.label}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
              Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
      )}
    </>
  );
}
