export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
      }}>
        {Icon && <Icon size={28} color="var(--text-4)" />}
      </div>
      <p className="h3" style={{ marginBottom: 8, color: 'var(--text-3)' }}>{title}</p>
      <p style={{ fontSize: 14, color: 'var(--text-4)', marginBottom: 24 }}>{description}</p>
      {action && (
        <button className="btn-primary" onClick={action.onClick}>{action.label}</button>
      )}
    </div>
  );
}
