export function SkeletonCard() {
  return (
    <div className="card" style={{ borderRadius: '12px' }}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
          <div className="flex-grow-1">
            <div className="skeleton mb-2" style={{ width: '75%', height: '16px' }} />
            <div className="skeleton" style={{ width: '50%', height: '12px' }} />
          </div>
        </div>
        <div className="skeleton mb-3" style={{ width: '100%', height: '32px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '60%', height: '12px' }} />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="card" style={{ borderRadius: '12px' }}>
      <div className="card-body p-0">
        <div className="p-4 border-bottom">
          <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 border-bottom d-flex gap-4">
            <div className="skeleton" style={{ width: '25%', height: '16px' }} />
            <div className="skeleton" style={{ width: '33%', height: '16px' }} />
            <div className="skeleton" style={{ width: '50%', height: '16px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card" style={{ borderRadius: '16px' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between mb-4">
          <div className="skeleton" style={{ width: '60px', height: '16px' }} />
          <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        </div>
        <div className="skeleton mb-2" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ width: '50px', height: '12px' }} />
      </div>
    </div>
  );
}