import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, SlidersHorizontal, Heart, UploadCloud, ShoppingBag, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { CardSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/ImageWithFallback';
import { useAuthStore } from '../stores/authStore';

const CATEGORIES = ['all', 'books', 'electronics', 'clothing', 'furniture', 'stationery', 'sports', 'other'];

// Context-specific product placeholder images per category (from Stitch design)
const CATEGORY_IMAGES = {
  books:       'https://lh3.googleusercontent.com/aida-public/AB6AXuBJgn8xyeHjTdqOfz9I0ecod1x3Svcmb1bWOtBIaQsQSUwrhUPsx3eA8clVANSZGb8-aWsjigO7U_QZHKqctvjiM3rQi3kCAF59cBq9xu6bA6Yzjd6GM-l4UTSCym8MWUVCGeZL_2Qegchmr8AegdOAjZjYcdif0cT6fktGBqt5YoCzW9Mt4ELZN07tCTUohr9B-k1m8pmbpwpVfk1zVzlb93FGEUIm68Gaf4p53Aw2h4iBg4e4LqFwjq0B6qu7dg_pm9pnIfz6n3I',
  electronics: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpPEZnueA78nTNBI2AUUx2OYIfmoR__X0MFxVpStLG4up6reDil7p_QwTrmGBdQNgWx37abbbEDzFxL5KDD3C5uE2HTXwx4NOAkNjz5aO4Tdj0Z0zx0G3D37EvbA3FpcpzNlBFBaZeOOq0X82NPm7A_hVda6l6YCyPtuRWKV7_cOYaD4Dl3kvEYWTEZw7E3boF2spo62VsfxKbCmekRBY3LZ2eV0pUpX5WRVTpvwXsYAaySduU1c1iBgLXNKPK9r9T-6DXmeK_Fmc',
  clothing:    'https://lh3.googleusercontent.com/aida-public/AB6AXuAjXq2C0oaf8B68zjdB5iwrC5lvZKMdldndccT2d8hZP6iPu3GYpAD8XgF3JB-oqi_KRXg4MXE6SsknTgoSLdTnajVMN1tG5AfBMwVfGr5pb9V32sPXmrXOHYKn5jQ8XAx4EAn0z7_JotEXNj8CRj6QQ4kK0fMlljki61rdq6-AI9pJTBCAE6mBb-euhHp_cTNEDtkQVmv7HYt7kgk__Ik6l3F7lOCu606uRs7O37omowXfpsDmMXtmREmYl0sWj4oFo7WC1k3zhxI',
  furniture:   'https://lh3.googleusercontent.com/aida-public/AB6AXuDFBJI5zCXBsiGGF1Ea6XRqyMrLkdrERR4j7eAIBCxlBG8_FAQBk7HqJQxrq4TCSdv5LDdUBh9988Jftqz6C64DkV1LdwtAO37Csx1j70T6lUcg6I4nPZw4CGIcATT8nkiTr8z21En9F5c9VC3Y-SZ3-Gp5D09ueIpP9PbU0D6gg-LNq1gdIwWpVJ-mMWLe72tpHNt_BkB97I_Wr0cF5mP10gub3fk9z_57968ZXwPnh1iBU_TD10zZzqJUbbafB93NtaU7TE8kEYw',
  stationery:  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80',
  sports:      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80',
  other:       'https://images.unsplash.com/photo-1586880244386-8b3e34c8382c?w=600&q=80',
  default:     'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
};

function getCategoryImage(category) {
  return CATEGORY_IMAGES[category?.toLowerCase()] || CATEGORY_IMAGES.default;
}

// Injected CSS for the Lumina Marketplace Design System
const LuminaStyles = () => (
  <style>{`
    .lumina-market {
      --primary: #630ed4;
      --primary-rgb: 99, 14, 212;
      --secondary: #fd761a;
      --surface: #f8f9ff;
      --on-surface: #0b1c30;
      --on-surface-variant: #4a4455;
      font-family: 'Outfit', sans-serif;
      background-color: var(--surface);
      color: var(--on-surface);
      min-height: 100vh;
      padding-bottom: 100px;
    }
    .lumina-market .glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    .lumina-market .glass-dark {
      background: rgba(11, 28, 48, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .lumina-market .custom-shadow {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 8px rgba(99, 14, 212, 0.02);
    }
    .lumina-market .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .lumina-market .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .lumina-market .gradient-text {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .lumina-market input:focus, .lumina-market select:focus, .lumina-market textarea:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.5);
    }
    .lumina-card {
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
    }
    .lumina-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.08), 0 2px 12px rgba(99, 14, 212, 0.05);
    }
    .lumina-card-img {
      transition: transform 0.5s ease-out;
    }
    .lumina-card:hover .lumina-card-img {
      transform: scale(1.05);
    }
    .lumina-btn {
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .lumina-btn:active {
      transform: scale(0.95);
    }
    .lumina-btn-primary {
      background: var(--primary);
      color: white;
    }
    .lumina-btn-primary:hover {
      box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3);
    }
  `}</style>
);

function ListingCard({ item, onMarkSold }) {
  const { user } = useAuthStore();
  const isOwner = user?.id?.toString() === item.seller?.id?.toString();

  return (
    <div className="glass lumina-card" style={{ borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
        <img
          src={item.images?.[0] || getCategoryImage(item.category)}
          alt={item.title}
          className="lumina-card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          onError={e => { e.target.src = getCategoryImage(item.category); }}
        />
        <span className="glass" style={{ position: 'absolute', top: 16, left: 16, padding: '4px 12px', borderRadius: '9999px', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
          {item.condition ? item.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Used'}
        </span>
        
        {isOwner && item.status !== 'sold' ? (
          <button 
            onClick={() => onMarkSold(item.id)}
            className="glass lumina-btn" 
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.9)' }}
            title="Mark as Sold"
          >
            <CheckCircle size={20} />
          </button>
        ) : (
          <button className="glass lumina-btn" style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>
            <Heart size={20} />
          </button>
        )}
      </div>
      
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(74, 68, 85, 0.7)', fontWeight: 700 }}>
             {item.category}
           </span>
           {item.status === 'sold' && <span style={{ fontSize: 11, background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>SOLD</span>}
        </div>
        
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--on-surface)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </h3>
        
        <p style={{ fontSize: 15, color: 'var(--on-surface-variant)', marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
          {item.description}
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
            ₹{item.price}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={item.seller?.avatar_url} name={item.seller?.name} size={28} style={{ border: '2px solid rgba(0,0,0,0.05)' }} />
            <span style={{ fontSize: 13, color: 'var(--on-surface)', fontWeight: 500 }}>
              {item.seller?.name?.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'books', condition: 'good' });
  const [images, setImages] = useState([]);

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      return api.post('/api/market', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.market('all') });
      toast.success('Listing created!');
      onClose();
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11, 28, 48, 0.4)', backdropFilter: 'blur(8px)', padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div 
        className="glass custom-shadow"
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99, 14, 212, 0.05)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Create New Listing</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 8, display: 'flex' }} className="lumina-btn">
            <X size={24} />
          </button>
        </div>
        
        <div className="no-scrollbar" style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          
          <div style={{ border: '2px dashed rgba(99, 14, 212, 0.3)', borderRadius: '16px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(99, 14, 212, 0.02)', cursor: 'pointer', position: 'relative' }} className="lumina-btn">
            <input type="file" accept="image/*" multiple onChange={e => setImages([...e.target.files])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            <UploadCloud size={40} color="var(--primary)" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', margin: 0 }}>
                {images.length > 0 ? `${images.length} photos selected` : 'Click or drag to upload photos'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>Supports JPG, PNG up to 10MB</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', marginLeft: 4 }}>Title</label>
              <input 
                className="glass" 
                placeholder="What are you selling?" 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ padding: '12px 24px', borderRadius: '9999px', border: 'none', fontSize: 16 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', marginLeft: 4 }}>Category</label>
              <select 
                className="glass" 
                value={form.category} 
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ padding: '12px 24px', borderRadius: '9999px', border: 'none', fontSize: 16, appearance: 'none' }}
              >
                {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', marginLeft: 4 }}>Description</label>
            <textarea 
              className="glass" 
              placeholder="Tell us about the item's condition, features..." 
              rows={3} 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ padding: '16px 24px', borderRadius: '24px', border: 'none', fontSize: 16, resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', marginLeft: 4 }}>Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="glass" 
                  type="number"
                  placeholder="0.00" 
                  value={form.price} 
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={{ width: '100%', padding: '12px 24px 12px 40px', borderRadius: '9999px', border: 'none', fontSize: 16, boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--primary)' }}>₹</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', marginLeft: 4 }}>Condition</label>
              <div className="glass" style={{ display: 'flex', padding: 4, borderRadius: '9999px' }}>
                {['new', 'like_new', 'good'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => setForm(f => ({ ...f, condition: c }))} 
                    style={{ 
                      flex: 1, padding: '8px 0', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.2s',
                      background: form.condition === c ? 'var(--primary)' : 'transparent',
                      color: form.condition === c ? 'white' : 'var(--on-surface-variant)'
                    }}
                  >
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 16, flexShrink: 0 }}>
            <button 
              className="lumina-btn lumina-btn-primary" 
              onClick={() => create.mutate()} 
              disabled={!form.title || !form.price || create.isPending} 
              style={{ width: '100%', padding: '16px', borderRadius: '9999px', border: 'none', fontSize: 18, fontWeight: 600, cursor: (!form.title || !form.price || create.isPending) ? 'not-allowed' : 'pointer', opacity: (!form.title || !form.price || create.isPending) ? 0.7 : 1 }}
            >
              {create.isPending ? 'Posting...' : 'Post Listing'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MarketPage() {
  const [category, setCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Scroll to top on mount to ensure clean view
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: [...qk.market(category), searchQuery],
    queryFn: () => api.get(`/api/market?category=${category === 'all' ? '' : category}&q=${searchQuery}&page=1&limit=20`).then(r => r.data),
  });

  const markSold = useMutation({
    mutationFn: (id) => api.patch(`/api/market/${id}/mark-sold`),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: qk.market(category) }); 
      toast.success('Marked as sold!'); 
    },
    onError: err => toast.error(err.message),
  });

  // Handle both API response formats just in case
  const items = data?.items ?? data?.data?.items ?? [];

  return (
    <div className="lumina-market">
      <LuminaStyles />
      
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', paddingTop: '40px' }}>
        
        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '48px 0', marginBottom: '24px' }}>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 700, margin: '0 0 16px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Campus Marketplace
          </h1>
          <p style={{ fontSize: 18, color: 'var(--on-surface-variant)', maxWidth: 600, margin: '0 auto 40px auto', lineHeight: 1.6 }}>
            The exclusive hub for Lumina students to buy, sell, and trade essentials with the local campus community.
          </p>
          
          {/* Search Bar */}
          <div className="glass custom-shadow" style={{ maxWidth: 600, margin: '0 auto', borderRadius: '9999px', padding: '8px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.5)' }}>
            <Search color="var(--on-surface-variant)" size={24} style={{ marginLeft: 16 }} />
            <input 
              type="text"
              placeholder="Search for textbooks, tech, furniture..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '0 16px', fontSize: 16, color: 'var(--on-surface)', outline: 'none' }}
            />
            <button className="lumina-btn lumina-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '9999px', border: 'none', cursor: 'pointer' }}>
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </section>

        {/* Category Filter Bar */}
        <section style={{ marginBottom: '48px' }}>
          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
            {CATEGORIES.map(c => (
              <button 
                key={c} 
                onClick={() => setCategory(c)}
                className={`lumina-btn ${category === c ? 'lumina-btn-primary custom-shadow' : 'glass'}`}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '9999px', 
                  border: 'none', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  whiteSpace: 'nowrap', 
                  cursor: 'pointer',
                  color: category === c ? 'white' : 'var(--on-surface-variant)',
                  transition: 'all 0.2s'
                }}
              >
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Product Bento Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} style={{ borderRadius: '24px', overflow: 'hidden' }}>
                <CardSkeleton height={400} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px 0' }}>
             <EmptyState 
               icon={ShoppingBag} 
               title="Nothing for sale here" 
               description={searchQuery ? "Try a different search term" : "Be the first to list an item in this category"} 
               action={{ label: 'Sell something', onClick: () => setShowModal(true) }} 
             />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {items.map(item => (
              <ListingCard key={item.id} item={item} onMarkSold={id => markSold.mutate(id)} />
            ))}
          </div>
        )}

      </main>

      {/* Floating Action Button */}
      <button 
        className="lumina-btn lumina-btn-primary custom-shadow" 
        onClick={() => setShowModal(true)}
        style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 40, padding: '16px 24px', borderRadius: '9999px', border: 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <Plus size={24} color="white" />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Create Listing</span>
      </button>

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showModal && <CreateModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
