import L from 'leaflet';

const crowdColors = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };
const catIcons = {
  academic: '📚',
  food: '🍽️',
  sports: '🏆',
  hostel: '🏠',
  service: '🏛️',
  medical: '➕',
  library: '📖',
  admin: '🏢',
  bank: '🏦',
  parking: '🅿️',
};

export function createCampusIcon(loc, isSelected) {
  const color = crowdColors[loc.crowd_level] || '#94A3B8';
  const icon = catIcons[loc.category] || '📍';
  const html = `
    <div style="
      width:40px; height:40px; border-radius:50%; cursor:pointer;
      background:${isSelected ? '#2563EB' : 'white'};
      border:2.5px solid ${isSelected ? '#2563EB' : color};
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      position:relative; transition:transform .15s;
      font-size:16px; line-height:1;
    ">
      ${icon}
      ${loc.crowd_level === 'high' ? `
        <div style="
          position:absolute; inset:-6px; border-radius:50%;
          border:2px solid ${color}; opacity:0.6;
          animation:cpulse 2s ease-out infinite;
        "></div>
      ` : ''}
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
}
