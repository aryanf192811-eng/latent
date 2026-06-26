const gradients = {
  academic: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
  food: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)',
  sports: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
  hostel: 'linear-gradient(135deg,#FAF5FF,#EDE9FE)',
  medical: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)',
  events: 'linear-gradient(135deg,#EFF6FF,#BFDBFE)',
  clubs: 'linear-gradient(135deg,#F5F3FF,#DDD6FE)',
  market: 'linear-gradient(135deg,#FFFBEB,#FDE68A)',
  default: 'linear-gradient(135deg,#F8FAFC,#F1F5F9)',
};
const catEmoji = {
  academic: '📚', food: '🍽️', sports: '🏆', hostel: '🏠',
  medical: '➕', events: '📅', clubs: '🏛️', market: '🛍️', default: '📸',
};

export function ImageWithFallback({ src, alt, category, style, className }) {
  if (!src) {
    return (
      <div style={{
        ...style,
        background: gradients[category] || gradients.default,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} className={className}>
        <span style={{ fontSize: 32 }}>{catEmoji[category] || catEmoji.default}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ ...style, objectFit: 'cover' }}
      className={className}
      loading="lazy"
      onError={e => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        if (e.target.parentNode) {
          const fb = document.createElement('div');
          fb.style.cssText = `${Object.entries(style || {}).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`).join(';')};background:${gradients[category] || gradients.default};display:flex;align-items:center;justify-content:center`;
          fb.innerHTML = `<span style="font-size:32px">${catEmoji[category] || catEmoji.default}</span>`;
          e.target.parentNode.insertBefore(fb, e.target);
        }
      }}
    />
  );
}

export function Avatar({ src, name, size = 40, style }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];

  if (!src) {
    return (
      <div className="avatar" style={{ width: size, height: size, background: color, color: 'white', fontSize: size * 0.35, ...style }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="avatar"
      style={{ width: size, height: size, ...style }}
      loading="lazy"
      onError={e => {
        e.target.onerror = null;
        e.target.style.display = 'none';
      }}
    />
  );
}
