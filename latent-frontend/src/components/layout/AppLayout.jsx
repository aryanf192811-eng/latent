import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Rss, Map, UtensilsCrossed, CalendarDays,
  Users, Building2, UserCheck, ShoppingBag, Search, BookOpen,
  Bell, LogOut, ChevronRight, Settings
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSSE } from '../../hooks/useSSE';
import { Avatar } from '../common/ImageWithFallback';
import { toast } from 'sonner';
import { WeatherWidget } from '../weather/WeatherWidget';
import GlobalSearch from './GlobalSearch';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/map', icon: Map, label: 'Campus Map' },
  { to: '/mess', icon: UtensilsCrossed, label: 'Mess' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  null,
  { to: '/people', icon: Users, label: 'People' },
  { to: '/clubs', icon: Building2, label: 'Clubs' },
  { to: '/seniors', icon: UserCheck, label: 'Seniors' },
  null,
  { to: '/market', icon: ShoppingBag, label: 'Market' },
  { to: '/lost-found', icon: Search, label: 'Lost & Found' },
  { to: '/study-groups', icon: BookOpen, label: 'Study Groups' },
];

export function AppLayout() {
  const [hovered, setHovered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useSSE(
    (notif) => { toast.info(notif.title || 'New notification'); setUnreadCount(c => c + 1); },
    (count) => setUnreadCount(count)
  );

  const handleLogout = () => {
    logout();
    localStorage.removeItem('latent_auth');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface overflow-x-hidden">
      {/* Background Blobs (Global) */}
      <div className="fixed top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full blur-[100px] opacity-40 z-[-1] pointer-events-none animate-pulse" style={{ background: 'radial-gradient(circle, rgba(189, 0, 255, 0.3) 0%, rgba(0, 224, 255, 0.05) 100%)' }}></div>
      <div className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full blur-[100px] opacity-40 z-[-1] pointer-events-none animate-pulse" style={{ background: 'radial-gradient(circle, rgba(231, 0, 110, 0.25) 0%, rgba(18, 18, 29, 0) 100%)', animationDelay: '2s' }}></div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container/20 backdrop-blur-2xl border-r border-outline-variant/20 z-50 p-6 flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display-lg font-bold text-xl shadow-[0_0_15px_rgba(189,0,255,0.5)]">L</div>
          <span className="font-display-lg text-[22px] font-bold text-primary">Latent</span>
        </div>
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item, i) => {
            if (!item) return <div key={`sep-${i}`} className="h-[1px] bg-white/10 my-2 mx-4" />;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex items-center gap-4 px-5 py-3 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-[0_0_15px_rgba(189,0,255,0.4)]' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                <Icon size={20} />
                <span className="font-label-md text-label-md">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button
          className="bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-full shadow-[0_0_20px_rgba(189,0,255,0.4)] hover:scale-105 transition-transform"
          onClick={() => toast('🚀 Coming Soon', { description: 'Post composer launches after presentation', duration: 3000 })}
        >
          Post Update
        </button>
      </aside>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/20 backdrop-blur-xl border-b border-outline-variant/20 z-40 px-6 lg:px-10 flex items-center justify-between">
        <div className="flex-1 max-w-xl hidden sm:block">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-4 lg:gap-6 ml-auto">
          <WeatherWidget />
          <NavLink to="/notifications" className="relative text-on-surface-variant hover:text-primary transition-colors" onClick={() => setUnreadCount(0)}>
            <Bell size={24} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-tertiary rounded-full border-2 border-surface"></span>}
          </NavLink>
          <div className="flex items-center gap-3 bg-white/5 pr-4 pl-1 py-1 rounded-full border border-outline-variant/20 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/profile/${user?.id}`)}>
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              <Avatar src={user?.avatar_url} name={user?.name} size={32} style={{ width: '100%', height: '100%' }} />
            </div>
            <span className="font-label-md text-label-md hidden sm:block">{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="lg:ml-72 pt-20 pb-20 lg:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Dock */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-container/80 backdrop-blur-xl border-t border-outline-variant/20 flex justify-around items-center h-16 z-50 px-2 pb-safe">
        {[
          { to: '/dashboard', icon: LayoutDashboard },
          { to: '/feed', icon: Rss },
          { to: '/map', icon: Map },
          { to: '/mess', icon: UtensilsCrossed },
          { to: '/events', icon: CalendarDays },
        ].map(({ to, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {({ isActive }) => (
              <>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <motion.div layoutId="mobile-nav-indicator" className="w-1 h-1 bg-primary rounded-full mt-1" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
