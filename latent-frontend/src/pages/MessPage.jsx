import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

const MEAL_TIMES = {
  breakfast: '7:30 – 9:30 AM',
  lunch: '12:30 – 2:30 PM',
  dinner: '7:30 – 9:30 PM',
};
const MEAL_PRICES = { breakfast: 30, lunch: 65, dinner: 65 };

const MEAL_IMAGES = {
  breakfast: "https://lh3.googleusercontent.com/aida-public/AB6AXuCax0CVtysxRX6UOO5eqiUfpm8ofBwKBFKcGokrzIWj67zGP3LYNhLOEvC3zk4aG_nfWkCj4Ao-Zh7qFqKdHYumKnk50ovOnBAt7MJrHIsy7QFBDcX5AhHYgIBioX7KROzM9O5ViMtOOFaW4zuMYCEyoysiIEm3w60NWGxbCMccWzN4dD3UITqNcGM7nfLdOKx75rRzmDDlH3oTHllqo3nkpBpqd0_Vyi6K0doDR18-3dp-FNcqQa161JUTRdBdk4jYE662Ak7Ehd4",
  lunch: "https://lh3.googleusercontent.com/aida-public/AB6AXuDndw3Ptd_Y3PnMWiiy3LbTCFZscYVl18OvaaPmMMIOHKB_l8CYTEzXehQUNmFt1WJLXWgJzzH_5Y9T9-QLZsvpr0D5zk5noYUtMspd-_LoSkIp0gEdUc3aJW5ZGys_Nh1vKftC_bg1qPNzwjXmb9OwjPZie2IyzER2JmFuG0zqpGHRjBdSdXq-sGMQjD3ftMWsZIz9dTKnErDMCtfYMuEI-fg1YXsPC9hXK1ljJXdS8MRvaiHQpQt-XIhq9oYLr2N6U6CqRI8FgCo",
  dinner: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXVb1Kky2sKsIyTIuosd5t1WscBj00znPvFda0jiBcYdMlFLskP-BwPMMmVd3LZ6jt08zEi6DayXvbrrTBvvnz5LfoQKSn8ILvnedGTkFQPgZrKGk76SjJaq7IHUsmR345LuR7cC7DcBzKQOicBRwis6r9iau7dPh3N16zJQkh1iJxN3xf5-gERl_qzhg5cAlrDkP09dvoOzs5F7Zj57YdBBWGlpTGplKifrURbw2Q396oL3T_n-6yI5wRVFaGl6iXeLsAk10zt2c"
};

export default function MessPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('menu');

  const { data: messesData, isLoading: messLoading } = useQuery({
    queryKey: qk.messList(),
    queryFn: () => api.get('/api/mess/messes').then(r => r.data),
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: qk.wallet(),
    queryFn: () => api.get('/api/mess/wallet').then(r => r.data),
  });

  const messes = messesData?.items || messesData || [];
  const defaultMess = messes.find(m => m.id === user?.default_mess_id) || messes[0];

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: qk.messMenu(defaultMess?.id),
    queryFn: () => api.get(`/api/mess/menu/${defaultMess?.id}`).then(r => r.data),
    enabled: !!defaultMess?.id,
  });

  const meals = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="pt-8 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Hero Section & Mess Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
        <div className="lg:col-span-7">
          <p className="text-primary font-label-md mb-2">Welcome back, {user?.name?.split(' ')[0]}</p>
          <h1 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface leading-tight">
            {defaultMess?.name || 'Campus Mess'}
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-lg font-body-md">
            Savor a curated culinary experience designed for your academic excellence and wellness.
          </p>
        </div>
        
        <div className="lg:col-span-5 w-full">
          <div className="relative overflow-hidden p-6 rounded-3xl glass-card border-white/50 shadow-2xl group transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 -z-10 opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br from-primary/20 via-transparent to-secondary/10"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-on-surface-variant font-label-sm uppercase tracking-widest">Mess Wallet</p>
                {walletLoading ? (
                  <div className="animate-pulse bg-surface-variant/50 h-10 w-32 mt-2 rounded-lg" />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-bold text-primary mt-1">₹{walletData?.balance ?? 0}</h2>
                )}
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-label-sm">ID: {String(user?.id || '').padStart(4, '0')}</span>
              <Link to="/mess/book" className="bg-white/60 hover:bg-white/80 text-primary px-5 py-2.5 rounded-full font-label-md font-bold backdrop-blur-md transition-colors shadow-sm">
                Book Meal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
            activeTab === 'menu' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
              : 'glass-card hover:bg-white/50 text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
          Menu
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
            activeTab === 'history' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
              : 'glass-card hover:bg-white/50 text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">history</span>
          History
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
            activeTab === 'coupons' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
              : 'glass-card hover:bg-white/50 text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">local_offer</span>
          Coupons
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {meals.map((meal) => (
              <div key={meal} className="glass-card rounded-3xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 border-white/40">
                <div className="h-48 lg:h-56 relative overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    src={MEAL_IMAGES[meal]} 
                    alt={meal} 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-primary px-4 py-1.5 rounded-full font-bold text-sm shadow-sm capitalize">
                      {meal}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-on-surface-variant flex items-center gap-1.5 text-sm font-medium">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      {MEAL_TIMES[meal]}
                    </span>
                    <span className="text-primary font-bold text-xl">₹{MEAL_PRICES[meal]}</span>
                  </div>
                  
                  {menuLoading ? (
                    <div className="space-y-4 mb-6">
                      {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-surface-variant/50 h-6 w-full rounded" />)}
                    </div>
                  ) : (
                    <div className="space-y-4 mb-8">
                      {(menuData?.[meal]?.items || ['Chef Special Dal', 'Steamed Rice', 'Fresh Roti', 'Mix Veg']).map((item, i) => (
                        <div key={i} className="flex justify-between items-center group/item cursor-pointer">
                          <span className="text-on-surface font-medium text-base">
                            {typeof item === 'string' ? item : item.name}
                          </span>
                          <div className="h-[1px] flex-1 mx-4 bg-outline/10 group-hover/item:bg-primary/30 transition-colors"></div>
                          <span className="material-symbols-outlined text-outline group-hover/item:text-primary transition-colors text-[20px]">
                            add_circle
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Link to="/mess/book" className="mt-auto block w-full py-3.5 rounded-2xl bg-primary/5 hover:bg-primary/10 text-primary font-bold text-center transition-colors">
                    Book {meal}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && <MessHistory />}
        {activeTab === 'coupons' && <MessCoupons />}
      </div>

    </div>
  );
}

function MessHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['mess-history'],
    queryFn: () => api.get('/api/mess/history').then(r => r.data),
  });
  
  const orders = data?.items || data || [];
  
  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse bg-surface-variant/50 rounded-2xl" />)}</div>;
  if (orders.length === 0) return <div className="py-20 text-center text-on-surface-variant">No order history yet.</div>;
  
  return (
    <div className="space-y-4 max-w-3xl">
      {orders.map(order => (
        <div key={order.id} className="glass-card rounded-2xl p-5 flex justify-between items-center hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.status === 'verified' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
              <span className="material-symbols-outlined">
                {order.status === 'verified' ? 'verified' : 'receipt_long'}
              </span>
            </div>
            <div>
              <p className="font-bold text-lg text-on-surface capitalize">{order.meal_type}</p>
              <p className="text-sm text-on-surface-variant">{new Date(order.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'verified' ? 'bg-green-500/20 text-green-700' : 'bg-amber-500/20 text-amber-700'}`}>
            {order.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function MessCoupons() {
  const { data, isLoading } = useQuery({
    queryKey: ['mess-coupons'],
    queryFn: () => api.get('/api/mess/coupons').then(r => r.data),
  });
  
  const coupons = data?.items || data || [];
  
  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-32 animate-pulse bg-surface-variant/50 rounded-3xl" />)}</div>;
  if (coupons.length === 0) return <div className="py-20 text-center text-on-surface-variant">No active coupons available.</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {coupons.map(c => (
        <div key={c.id} className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold text-sm capitalize">
              {c.meal_type}
            </span>
            <span className="material-symbols-outlined text-outline">qr_code_2</span>
          </div>
          <h3 className="font-bold text-2xl text-on-surface mb-1 font-mono tracking-wider">{c.code}</h3>
          <p className="text-sm text-on-surface-variant">Valid until {new Date(c.valid_until).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
