import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { PostCard } from '../components/common/PostCard';
import { PostSkeleton } from '../components/common/Skeletons';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: pulseData, isLoading: pulseLoading } = useQuery({
    queryKey: qk.pulse(),
    queryFn: () => api.get('/api/pulse').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['dashboard-posts'],
    queryFn: () => api.get('/api/posts?tab=for_you&page=1&limit=5').then(r => r.data),
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: qk.events('upcoming'),
    queryFn: () => api.get('/api/events?page=1&limit=3').then(r => r.data),
  });

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden mb-12 group shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80" 
            alt="Campus" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-12">
          <div className="flex items-center gap-4 mb-2">
            <span className="px-4 py-1 bg-primary/20 backdrop-blur-md rounded-full text-primary font-label-sm text-label-sm border border-primary/30">
              LATEST NEWS
            </span>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-white/80">
              <span className="material-symbols-outlined text-sm">schedule</span> Updated 2m ago
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-white mb-4">{greeting}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="font-body-lg text-body-lg text-white/80 max-w-2xl">
            The Student Commons is buzzing today! 14 of your friends are currently at the "Sunset Vibes" festival in the Quad. Don't miss the 6 PM keynote at the Engineering hall.
          </p>
          <div className="mt-8 flex gap-6">
            <Link to="/explore" className="px-8 py-3 bg-primary text-on-primary rounded-full font-title-md text-title-md hover:shadow-[0_0_30px_rgba(189,0,255,0.6)] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">explore</span> Explore Now
            </Link>
            <button className="px-8 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-title-md text-title-md hover:bg-white/20 transition-all">
              My Schedule
            </button>
          </div>
        </div>
        
        {/* Dynamic Glass Accents */}
        <div className="absolute top-10 right-10 flex gap-4 pointer-events-none hidden md:flex">
          <div className="glass-card rounded-full p-4 float-anim flex items-center justify-center pulse-glow" style={{ animationDelay: '-1s' }}>
            <span className="material-symbols-outlined text-secondary-fixed-dim" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <div className="glass-card rounded-full p-4 float-anim flex items-center justify-center" style={{ animationDelay: '-2.5s' }}>
            <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        
        {/* Pulse Waves & Stats (Left Column) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Quick Access */}
          <div className="glass-card rounded-3xl p-6 inner-glow hover:shadow-primary/10 transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-md text-[20px] font-semibold">Quick Access</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/map" className="bg-surface-variant/30 hover:bg-surface-variant/60 hover:scale-[1.02] active:scale-95 p-4 rounded-2xl transition-all cursor-pointer border border-outline-variant/20 group">
                <span className="material-symbols-outlined text-secondary block mb-2 group-hover:text-primary transition-colors" style={{ fontSize: '32px' }}>map</span>
                <p className="font-label-sm text-label-sm text-on-surface">Map</p>
              </Link>
              <Link to="/mess" className="bg-surface-variant/30 hover:bg-surface-variant/60 hover:scale-[1.02] active:scale-95 p-4 rounded-2xl transition-all cursor-pointer border border-outline-variant/20 group">
                <span className="material-symbols-outlined text-tertiary block mb-2 group-hover:text-primary transition-colors" style={{ fontSize: '32px' }}>restaurant</span>
                <p className="font-label-sm text-label-sm text-on-surface">Menus</p>
              </Link>
              <Link to="/people" className="bg-surface-variant/30 hover:bg-surface-variant/60 hover:scale-[1.02] active:scale-95 p-4 rounded-2xl transition-all cursor-pointer border border-outline-variant/20 group">
                <span className="material-symbols-outlined text-primary block mb-2 group-hover:text-secondary transition-colors" style={{ fontSize: '32px' }}>groups</span>
                <p className="font-label-sm text-label-sm text-on-surface">Groups</p>
              </Link>
              <Link to="/events" className="bg-surface-variant/30 hover:bg-surface-variant/60 hover:scale-[1.02] active:scale-95 p-4 rounded-2xl transition-all cursor-pointer border border-outline-variant/20 group">
                <span className="material-symbols-outlined text-secondary block mb-2 group-hover:text-tertiary transition-colors" style={{ fontSize: '32px' }}>event_seat</span>
                <p className="font-label-sm text-label-sm text-on-surface">Booking</p>
              </Link>
            </div>
          </div>

          {/* Campus Energy */}
          <div className="glass-card rounded-3xl p-6 inner-glow relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-title-md text-[20px] flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary animate-pulse">graphic_eq</span>
                Campus Energy
              </h3>
              <p className="text-xs text-outline mb-6">Real-time social density</p>
              
              {pulseLoading ? (
                 <div className="space-y-4 animate-pulse">
                   <div className="h-4 bg-white/10 rounded w-full"></div>
                   <div className="h-4 bg-white/10 rounded w-3/4"></div>
                 </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Online Now</span>
                      <span className="text-primary">{pulseData?.online_now ?? '—'}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-primary h-full rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Events Today</span>
                      <span className="text-secondary-fixed-dim">{pulseData?.events_today ?? '—'}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-secondary-fixed-dim h-full rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>New Posts (1h)</span>
                      <span className="text-tertiary">{pulseData?.new_posts_1h ?? '—'}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-tertiary h-full rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Social Feed (Right Column) */}
        <div className="md:col-span-8 flex flex-col gap-6">
           {postsLoading 
              ? [1, 2].map(i => <PostSkeleton key={i} />)
              : postsData?.items?.map(post => <PostCard key={post.id} post={post} />)
            }
        </div>
        
      </div>
    </div>
  );
}

