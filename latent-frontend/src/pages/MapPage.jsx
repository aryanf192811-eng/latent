import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, Navigation, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { createCampusIcon } from '../components/map/campusIcons';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>';
const CENTER = [22.2907, 73.3648];
const ZOOM = 16;
const MAX_BOUNDS = [[22.280, 73.356], [22.300, 73.378]];

const MAIN_CAMPUS_POLYGON = [
  [22.280, 73.360], [22.280, 73.373], [22.290, 73.373],
  [22.290, 73.360], [22.280, 73.360],
];
const EAST_CAMPUS_POLYGON = [
  [22.285, 73.367], [22.285, 73.375], [22.291, 73.375],
  [22.291, 73.367], [22.285, 73.367],
];

const CATEGORIES = ['all', 'academic', 'food', 'sports', 'hostel', 'service', 'medical'];

function CustomZoomControl() {
  const map = useMap();
  return (
    <div style={{ position: 'absolute', bottom: 80, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[
        { label: '+', action: () => map.zoomIn() },
        { label: '−', action: () => map.zoomOut() },
      ].map(({ label, action }) => (
        <button key={label} onClick={action} style={{
          width: 36, height: 36, borderRadius: 8, background: 'white',
          border: '1px solid var(--border)', boxShadow: 'var(--s1)',
          cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{label}</button>
      ))}
    </div>
  );
}

function LocationPanel({ location, isCheckedIn, onCheckIn, onClose }) {
  const crowdColors = { low: 'var(--green)', medium: 'var(--amber)', high: 'var(--red)' };
  const crowdLabels = { low: 'Low crowd', medium: 'Medium crowd', high: 'High crowd' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ImageWithFallback
        src={location.image_url}
        alt={location.name}
        category={location.category}
        style={{ width: '100%', height: 180, flexShrink: 0 }}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
          <X size={16} />
        </button>

        <span className="eyebrow" style={{ textTransform: 'capitalize' }}>{location.category}</span>
        <h3 className="h2" style={{ marginTop: 4, marginBottom: 8 }}>{location.name}</h3>

        {location.code && <span className="badge badge-blue" style={{ marginBottom: 12 }}>{location.code}</span>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--r2)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: crowdColors[location.crowd_level] || 'var(--text-4)', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{crowdLabels[location.crowd_level] || 'Unknown'}</span>
        </div>

        {location.description && (
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{location.description}</p>
        )}

        {location.floor_info && (
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>📍 {location.floor_info}</p>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <MapPin size={14} color="var(--text-4)" />
          <span className="mono-sm">{Number(location.lat)?.toFixed(5)}, {Number(location.lng)?.toFixed(5)}</span>
        </div>

        <button
          onClick={() => onCheckIn(location.id)}
          disabled={isCheckedIn}
          className={isCheckedIn ? 'btn-secondary' : 'btn-primary'}
          style={{ width: '100%', justifyContent: 'center', gap: 8 }}
        >
          {isCheckedIn ? <><CheckCircle size={16} /> Checked in</> : <><Navigation size={16} /> Check in here</>}
        </button>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [checkedIn, setCheckedIn] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: locationsData } = useQuery({
    queryKey: qk.mapLocs(),
    queryFn: () => api.get('/api/map/locations').then(r => r.data.items || r.data),
    refetchInterval: 60_000,
  });

  const locations = locationsData || [];
  const filtered = filter === 'all' ? locations : locations.filter(l => l.category === filter);

  const handleCheckIn = async (locationId) => {
    try {
      const res = await api.post('/api/map/checkin', { location_id: locationId });
      if (!res.data?.already_checked_in) {
        setCheckedIn(prev => new Set([...prev, locationId]));
        toast.success(`Checked in at ${selected.name}!`);
        queryClient.invalidateQueries({ queryKey: qk.mapLocs() });
      } else {
        toast.info('Already checked in here today');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', marginLeft: -1 }}>
      {/* Filter bar */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <div className="pill-tabs">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`pill-tab ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        maxBounds={MAX_BOUNDS}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

        {/* Campus boundary polygons removed */}

        <CustomZoomControl />

        {/* Markers — custom circular DivIcon, NOT teardrop */}
        {filtered.map(loc => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createCampusIcon(loc, selected?.id === loc.id)}
            eventHandlers={{ click: () => setSelected(loc) }}
          />
        ))}
      </MapContainer>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 340,
              background: 'white', borderLeft: '1px solid var(--border)',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.08)', overflowY: 'auto', zIndex: 900,
            }}
          >
            <LocationPanel
              location={selected}
              isCheckedIn={checkedIn.has(selected.id)}
              onCheckIn={handleCheckIn}
              onClose={() => setSelected(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 24, left: 16, zIndex: 1000,
        background: 'white', border: '1px solid var(--border)', borderRadius: 10,
        padding: '10px 14px', boxShadow: 'var(--s1)',
      }}>
        <p className="label" style={{ marginBottom: 6 }}>Crowd Level</p>
        {[['low', '#10B981', 'Low crowd'], ['medium', '#F59E0B', 'Medium crowd'], ['high', '#EF4444', 'High crowd']].map(([level, color, label]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 12 }}>{label}</span>
          </div>
        ))}

      </div>
    </div>
  );
}
