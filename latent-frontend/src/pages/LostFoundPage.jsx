import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// ─── Isolated Query Keys — never conflict with other pages ───────────────────
const LF_KEY = (type, status) => ['lf-page', type, status];

// ─── Constants ───────────────────────────────────────────────────────────────
const TYPES = ['all', 'lost', 'found'];
const STATUSES = ['open', 'resolved'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ''; }
}

// ─── LF Item Card ─────────────────────────────────────────────────────────────
function LFCard({ item, currentUserId, onResolve, onDelete }) {
  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';
  const isOwner = item.user?.id === currentUserId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-lg overflow-hidden group hover:scale-[1.01] transition-transform duration-300 flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.3)',
      }}
    >
      {/* Image / Placeholder */}
      <div className="relative h-64 flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: '#e0e3e5',
            display: item.image_url ? 'none' : 'flex',
          }}
        >
          <span className="material-symbols-outlined text-6xl" style={{ color: '#7b7487' }}>
            {isLost ? 'help_center' : 'check_circle'}
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <span
            className="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md border border-white/20"
            style={isLost
              ? { background: '#ffdad6', color: '#93000a' }
              : { background: '#eaddff', color: '#25005a' }
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {isLost ? 'error' : 'check_circle'}
            </span>
            {isLost ? 'LOST' : 'FOUND'}
          </span>
          {isResolved && (
            <span
              className="px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/20"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              RESOLVED
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow gap-4">
        <div className="flex-grow">
          <h3 className="font-bold text-lg leading-tight" style={{ color: '#191c1e' }}>
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: '#4a4455' }}>
              {item.description}
            </p>
          )}
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(204,195,216,0.3)' }}>
          <div className="flex items-center gap-2" style={{ color: '#630ed4' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>location_on</span>
            <span className="text-sm font-semibold truncate max-w-[130px]" title={item.location_hint || 'Unknown location'}>
              {item.location_hint || 'Unknown location'}
            </span>
          </div>
          <span className="text-xs" style={{ color: '#7b7487' }}>
            {timeAgo(item.created_at)}
          </span>
        </div>

        {/* Reporter info */}
        {item.user && (
          <div className="flex items-center gap-2 pt-1">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#e0e3e5' }}>
              {item.user.avatar_url
                ? <img src={item.user.avatar_url} alt={item.user.name} className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-xs w-full h-full flex items-center justify-center" style={{ color: '#7b7487' }}>person</span>
              }
            </div>
            <span className="text-xs font-medium" style={{ color: '#7b7487' }}>
              Reported by {item.user.name}
            </span>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && !isResolved && (
          <button
            onClick={() => onResolve(item.id)}
            className="w-full py-2.5 rounded-full text-sm font-bold transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.8)',
              color: '#4a4455',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
              Mark as Resolved
            </span>
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => onDelete(item.id)}
            className="w-full py-2 rounded-full text-xs font-medium transition-all active:scale-95"
            style={{ color: '#ba1a1a', background: 'transparent' }}
          >
            Delete listing
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-lg overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.3)', height: 380 }}
    >
      <div style={{ height: 256, background: '#e0e3e5' }} />
      <div className="p-6 space-y-3">
        <div style={{ height: 20, width: '75%', background: '#e0e3e5', borderRadius: 8 }} />
        <div style={{ height: 14, width: '90%', background: '#e0e3e5', borderRadius: 8 }} />
        <div style={{ height: 14, width: '60%', background: '#e0e3e5', borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function ReportModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    category: '',
    description: '',
    location_hint: '',
    image_url: '',
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/lost-found', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lf-page'] });
      toast.success('Report submitted successfully!');
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to submit report'),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error('Please enter an item name'); return; }
    createMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(25,28,30,0.2)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-2xl rounded-lg shadow-2xl overflow-y-auto"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.5)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold" style={{ color: '#191c1e' }}>Report an Item</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all hover:bg-black/5"
              style={{ color: '#4a4455' }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Item Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: '#4a4455' }}>Item Type</label>
              <div className="flex gap-3">
                {['lost', 'found'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="flex-1 py-3 rounded-xl border font-bold capitalize transition-all"
                    style={form.type === t
                      ? { background: '#eaddff', borderColor: '#7c3aed', color: '#25005a' }
                      : { background: '#eceef0', borderColor: '#ccc3d8', color: '#4a4455' }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold" style={{ color: '#4a4455' }}>Item Name *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
                  style={{ background: '#eceef0', border: '2px solid transparent', color: '#191c1e' }}
                  onFocus={e => e.target.style.borderColor = '#630ed4'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                  placeholder="e.g. Blue Backpack"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" style={{ color: '#4a4455' }}>Category (Optional)</label>
                <input
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
                  style={{ background: '#eceef0', border: '2px solid transparent', color: '#191c1e' }}
                  onFocus={e => e.target.style.borderColor = '#630ed4'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                  placeholder="e.g. Electronics, Bag..."
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: '#4a4455' }}>Description</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl outline-none resize-none transition-all text-sm"
                style={{ background: '#eceef0', border: '2px solid transparent', color: '#191c1e' }}
                onFocus={e => e.target.style.borderColor = '#630ed4'}
                onBlur={e => e.target.style.borderColor = 'transparent'}
                rows={3}
                placeholder="Describe specific markings, contents, or color details..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: '#4a4455' }}>Last Seen Location</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#7b7487', fontSize: 20 }}>map</span>
                <input
                  className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all text-sm"
                  style={{ background: '#eceef0', border: '2px solid transparent', color: '#191c1e' }}
                  onFocus={e => e.target.style.borderColor = '#630ed4'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                  placeholder="Building, Room, or Landmark"
                  value={form.location_hint}
                  onChange={e => setForm(f => ({ ...f, location_hint: e.target.value }))}
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: '#4a4455' }}>Item Photo URL (Optional)</label>
              <div
                className="border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer"
                style={{ borderColor: '#ccc3d8', background: 'rgba(236,238,240,0.5)' }}
              >
                <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: '#7b7487' }}>cloud_upload</span>
                <input
                  className="w-full px-3 py-2 rounded-lg outline-none text-sm text-center"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #ccc3d8', color: '#191c1e' }}
                  placeholder="Paste image URL (or leave blank)"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                />
                <p className="mt-2 text-xs" style={{ color: '#7b7487' }}>PNG, JPG accepted</p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createMutation.isPending}
              className="w-full py-4 rounded-full text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #fd761a)' }}
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LostFoundPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Fetch — uses isolated query key, won't conflict with ANY other page
  const { data, isLoading, isError, error } = useQuery({
    queryKey: LF_KEY(typeFilter, statusFilter),
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter, page: '1', limit: '50' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await api.get(`/api/lost-found?${params.toString()}`);
      // api interceptor returns full body: { success, data: { items, ... } }
      return res.data ?? res;
    },
    staleTime: 30_000,
    retry: 2,
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => api.put(`/api/lost-found/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lf-page'] });
      toast.success('Marked as resolved!');
    },
    onError: (err) => toast.error(err.message || 'Failed to resolve'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/lost-found/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lf-page'] });
      toast.success('Listing deleted');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  });

  // Items from response — handle both data shapes safely
  const rawItems = data?.items ?? data?.data?.items ?? [];

  // Client-side search filter
  const items = searchQuery.trim()
    ? rawItems.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_hint?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rawItems;

  return (
    <>
      {/* Page-scoped inline styles — completely self-contained */}
      <style>{`
        .lf-mesh-bg {
          background-color: #f7f9fb;
          background-image:
            radial-gradient(at 0% 0%, rgba(99,14,212,0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(253,118,26,0.09) 0px, transparent 50%);
          min-height: 100vh;
        }
        .lf-glass {
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.3);
        }
        .lf-pill-active-primary {
          background: #7c3aed;
          color: #fff;
          box-shadow: 0 2px 8px rgba(124,58,237,0.25);
        }
        .lf-pill-active-white {
          background: #fff;
          color: #630ed4;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .lf-pill-inactive {
          color: #4a4455;
        }
        .lf-pill-inactive:hover { background: rgba(255,255,255,0.5); }
        .lf-report-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #fd761a 100%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(124,58,237,0.28);
        }
        .lf-report-btn:hover {
          box-shadow: 0 12px 28px rgba(124,58,237,0.38);
          transform: scale(1.02);
        }
        .lf-report-btn:active { transform: scale(0.97); }
        .lf-hide-scroll::-webkit-scrollbar { display: none; }
        .lf-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="lf-mesh-bg">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-24">

          {/* ── Hero ── */}
          <section className="text-center py-12 md:py-16 mb-8">
            <h1 className="text-4xl md:text-[52px] font-bold leading-tight mb-8" style={{ color: '#191c1e', letterSpacing: '-0.02em' }}>
              Lost something?{' '}
              <span style={{ background: 'linear-gradient(135deg, #630ed4, #fd761a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                We'll help you find it.
              </span>
            </h1>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2" style={{ color: '#7b7487' }}>search</span>
              <input
                className="w-full pl-14 pr-6 py-4 rounded-full text-base shadow-lg outline-none transition-all"
                style={{ background: '#fff', border: '2px solid transparent', color: '#191c1e' }}
                onFocus={e => e.target.style.borderColor = '#630ed4'}
                onBlur={e => e.target.style.borderColor = 'transparent'}
                placeholder="Search items (e.g., Blue Wallet, Hydroflask...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </section>

          {/* ── Filters & Actions ── */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-10">
            <div className="flex flex-wrap gap-4">
              {/* Type filter */}
              <div
                className="flex p-1 rounded-full lf-hide-scroll overflow-x-auto"
                style={{ background: '#eceef0', border: '1px solid rgba(255,255,255,0.5)' }}
              >
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all whitespace-nowrap ${typeFilter === t ? 'lf-pill-active-primary' : 'lf-pill-inactive'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {/* Status filter */}
              <div
                className="flex p-1 rounded-full"
                style={{ background: '#eceef0', border: '1px solid rgba(255,255,255,0.5)' }}
              >
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'lf-pill-active-white' : 'lf-pill-inactive'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="lf-report-btn flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
              Report Item
            </button>
          </section>

          {/* ── Results Count ── */}
          {!isLoading && !isError && (
            <p className="text-sm mb-6 font-medium" style={{ color: '#7b7487' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          )}

          {/* ── Grid ── */}
          {isError ? (
            <div className="text-center py-24">
              <span className="material-symbols-outlined text-6xl block mb-4" style={{ color: '#ba1a1a' }}>error</span>
              <p className="text-lg font-bold mb-2" style={{ color: '#191c1e' }}>Failed to load items</p>
              <p className="text-sm mb-6" style={{ color: '#7b7487' }}>{error?.message || 'Unknown error'}</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['lf-page'] })}
                className="px-6 py-3 rounded-full font-bold text-white"
                style={{ background: '#630ed4' }}
              >
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24">
              <span className="material-symbols-outlined text-6xl block mb-4" style={{ color: '#ccc3d8' }}>
                {searchQuery ? 'search_off' : 'inventory_2'}
              </span>
              <p className="text-lg font-bold mb-2" style={{ color: '#191c1e' }}>
                {searchQuery ? 'No items match your search' : 'Nothing reported yet'}
              </p>
              <p className="text-sm mb-6" style={{ color: '#7b7487' }}>
                {searchQuery
                  ? 'Try different keywords or clear the search'
                  : 'Be the first to report a lost or found item'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="lf-report-btn px-8 py-3 rounded-full font-bold text-sm"
                >
                  Report an Item
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 rounded-full font-bold text-sm"
                  style={{ background: '#eceef0', color: '#4a4455' }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              layout
            >
              <AnimatePresence mode="popLayout">
                {items.map(item => (
                  <LFCard
                    key={item.id}
                    item={item}
                    currentUserId={user?.id}
                    onResolve={id => resolveMutation.mutate(id)}
                    onDelete={id => {
                      if (window.confirm('Delete this listing?')) deleteMutation.mutate(id);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && <ReportModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
