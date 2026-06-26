export function PostSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="skel" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skel" style={{ height: 16, width: '40%', marginBottom: 8 }} />
          <div className="skel" style={{ height: 12, width: '25%' }} />
        </div>
      </div>
      <div className="skel" style={{ height: 14, width: '90%', marginBottom: 8 }} />
      <div className="skel" style={{ height: 14, width: '75%', marginBottom: 8 }} />
      <div className="skel" style={{ height: 14, width: '55%', marginBottom: 16 }} />
      <div className="skel" style={{ height: 200, width: '100%' }} />
    </div>
  );
}

export function CardSkeleton({ height = 200 }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skel" style={{ height: height }} />
      <div style={{ padding: 16 }}>
        <div className="skel" style={{ height: 16, width: '60%', marginBottom: 8 }} />
        <div className="skel" style={{ height: 13, width: '40%', marginBottom: 8 }} />
        <div className="skel" style={{ height: 13, width: '80%' }} />
      </div>
    </div>
  );
}

export function EventSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skel" style={{ height: 160 }} />
      <div style={{ padding: 16 }}>
        <div className="skel" style={{ height: 18, width: '70%', marginBottom: 10 }} />
        <div className="skel" style={{ height: 13, width: '50%', marginBottom: 6 }} />
        <div className="skel" style={{ height: 13, width: '35%', marginBottom: 16 }} />
        <div className="skel" style={{ height: 36, width: 100, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export function PeopleSkeleton() {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
      <div className="skel" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skel" style={{ height: 16, width: '45%', marginBottom: 8 }} />
        <div className="skel" style={{ height: 13, width: '60%', marginBottom: 6 }} />
        <div className="skel" style={{ height: 13, width: '30%' }} />
      </div>
      <div className="skel" style={{ width: 80, height: 34, borderRadius: 999 }} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skel" style={{ height: 120, borderRadius: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skel" style={{ height: 160, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
