import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

const MEAL_PRICES = { breakfast: 30, lunch: 65, dinner: 65 };
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

export default function MessBookPage() {
  const [selectedMess, setSelectedMess] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [persons, setPersons] = useState(1);
  const [payMethod, setPayMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: messesData } = useQuery({
    queryKey: qk.messList(),
    queryFn: () => api.get('/api/mess/messes').then(r => r.data),
  });

  const { data: walletData } = useQuery({
    queryKey: qk.wallet(),
    queryFn: () => api.get('/api/mess/wallet').then(r => r.data),
  });

  const messes = messesData?.items || messesData || [];
  const total = selectedMeal ? MEAL_PRICES[selectedMeal] * persons : 0;
  
  const selectedMessName = messes.find(m => m.id === selectedMess)?.name;

  const handleBook = async () => {
    if (!selectedMess || !selectedMeal) return toast.error('Please select mess and meal type');
    setLoading(true);
    try {
      if (payMethod === 'wallet') {
        await api.post('/api/mess/order', {
          mess_id: selectedMess,
          meal_type: selectedMeal,
          meal_date: selectedDate,
          persons,
          payment_method: 'wallet'
        });
        navigate('/mess/tickets?new=true');
        toast.success('Meal booked successfully!');
      } else {
        const orderRes = await api.post('/api/mess/order', { 
          mess_id: selectedMess, 
          meal_type: selectedMeal, 
          meal_date: selectedDate, 
          persons, 
          payment_method: 'razorpay' 
        });
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourKey',
          amount: total * 100,
          currency: 'INR',
          name: 'Latent Mess',
          description: `Booking ${selectedMeal} for ${persons} person(s)`,
          order_id: orderRes.data.razorpay_order.id,
          handler: async function (response) {
            try {
              await api.post(`/api/mess/order/${orderRes.data.order_id}/verify`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              toast.success('Payment successful! Ticket generated.');
              navigate('/mess/tickets?new=true');
            } catch (err) {
              toast.error(err.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email
          },
          theme: { color: '#7c3aed' }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          toast.error('Payment failed. Try again.');
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
      <Link to="/mess" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium">
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Back to Mess
      </Link>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Booking Form Section */}
        <div className="flex-grow space-y-10 w-full">
          <section>
            <h1 className="font-display-lg text-4xl md:text-5xl mb-2 text-on-surface font-bold leading-tight">Book a Meal</h1>
            <p className="text-on-surface-variant font-body-md text-lg mb-8">Reserve your spot at your favorite campus dining hall.</p>
            
            {/* Select Mess */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
                Select Mess
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messes.map((mess) => (
                  <button 
                    key={mess.id}
                    onClick={() => setSelectedMess(mess.id)}
                    className={`glass-card p-6 rounded-3xl text-left transition-all hover:border-primary/50 group ${selectedMess === mess.id ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]' : 'border-white/50 bg-white/40'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-full transition-transform group-hover:scale-110 ${selectedMess === mess.id ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      {selectedMess === mess.id && (
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-on-surface">{mess.name}</h3>
                    <p className="text-on-surface-variant text-sm">{mess.description || 'Gourmet Campus Dining'}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Select Meal */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-3xl">schedule</span>
              Select Meal
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {MEAL_TYPES.map(meal => (
                <button 
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`glass-card flex flex-col items-center justify-center py-8 rounded-3xl transition-all ${selectedMeal === meal ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]' : 'hover:bg-white/60 border-white/50 bg-white/40'}`}
                >
                  <span className={`material-symbols-outlined text-4xl mb-2 ${selectedMeal === meal ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {meal === 'breakfast' ? 'light_mode' : meal === 'lunch' ? 'wb_sunny' : 'bedtime'}
                  </span>
                  <span className="font-bold text-sm md:text-base text-on-surface capitalize">{meal}</span>
                  <span className="text-xs text-primary font-bold mt-1">₹{MEAL_PRICES[meal]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Date & Guests */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-lg font-bold block text-on-surface">Date</label>
              <div className="relative group">
                <input 
                  type="date" 
                  min={new Date().toISOString().slice(0, 10)}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-surface-variant/30 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary font-body-md outline-none transition-all text-on-surface" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-lg font-bold block text-on-surface">Guests</label>
              <div className="relative flex items-center bg-surface-variant/30 rounded-2xl px-2">
                <button 
                  className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  onClick={() => setPersons(Math.max(1, persons - 1))}
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input 
                  type="number" 
                  min={1} max={10} 
                  value={persons}
                  readOnly
                  className="w-full bg-transparent border-none text-center text-lg font-bold focus:ring-0 text-on-surface" 
                />
                <button 
                  className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  onClick={() => setPersons(Math.min(10, persons + 1))}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-3xl">payments</span>
              Payment Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setPayMethod('wallet')}
                className={`glass-card p-6 rounded-3xl flex items-center gap-4 transition-all hover:border-primary/50 ${payMethod === 'wallet' ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]' : 'border-white/50 bg-white/40'}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-on-surface">Lumina Wallet</h3>
                  <p className="text-on-surface-variant text-sm">Balance: ₹{walletData?.balance || 0}</p>
                </div>
                {payMethod === 'wallet' && (
                  <span className="material-symbols-outlined ml-auto text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
              
              <button 
                onClick={() => setPayMethod('razorpay')}
                className={`glass-card p-6 rounded-3xl flex items-center gap-4 transition-all hover:border-primary/50 ${payMethod === 'razorpay' ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]' : 'border-white/50 bg-white/40'}`}
              >
                <div className="w-12 h-12 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-on-surface">Razorpay</h3>
                  <p className="text-on-surface-variant text-sm">Cards, UPI, Netbanking</p>
                </div>
                {payMethod === 'razorpay' && (
                  <span className="material-symbols-outlined ml-auto text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Summary Sidebar */}
        <aside className="w-full lg:w-96 lg:sticky lg:top-28">
          <div className="glass-card p-8 rounded-3xl space-y-6 shadow-xl border-white/40 bg-white/50 backdrop-blur-3xl">
            <h2 className="text-2xl font-bold text-on-surface">Order Summary</h2>
            <div className="space-y-4 py-4 border-y border-outline/20">
              <div className="flex justify-between font-medium">
                <span className="text-on-surface-variant max-w-[200px] truncate">{selectedMessName || 'No Mess Selected'}</span>
                <span className="text-on-surface">₹{total}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-on-surface-variant capitalize">{selectedMeal || 'No Meal'} × {persons}</span>
                <span className="text-on-surface">Included</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-on-surface-variant">Convenience Fee</span>
                <span className="text-on-surface">₹0</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xl font-bold text-on-surface">Total</span>
              <span className="text-4xl font-bold text-primary">₹{total}</span>
            </div>
            <div className="p-4 bg-primary/10 rounded-2xl flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-sm text-on-surface-variant">Cancel up to 2 hours before the meal for a full refund to your wallet.</p>
            </div>
            <button 
              onClick={handleBook}
              disabled={loading || !selectedMess || !selectedMeal}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-tertiary text-white font-bold text-lg shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
