import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
// Landing Page
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'));

// App pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const MessPage = lazy(() => import('./pages/MessPage'));
const MessBookPage = lazy(() => import('./pages/MessBookPage'));
const MessTicketsPage = lazy(() => import('./pages/MessTicketsPage'));
const ClubsPage = lazy(() => import('./pages/ClubsPage'));
const ClubDetailPage = lazy(() => import('./pages/ClubDetailPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const LostFoundPage = lazy(() => import('./pages/LostFoundPage'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const StudyGroupsPage = lazy(() => import('./pages/StudyGroupsPage'));
const SeniorsPage = lazy(() => import('./pages/SeniorsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 20 }}>L</div>
        <div className="skel" style={{ width: 120, height: 8, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function AuthGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardingGuard({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function S({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/', element: <S><LandingPage /></S> },
  { path: '/login', element: <S><LoginPage /></S> },
  { path: '/register', element: <S><RegisterPage /></S> },
  { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },
  {
    path: '/onboarding',
    element: <OnboardingGuard><S><OnboardingPage /></S></OnboardingGuard>
  },
  {
    element: <AuthGuard><AppLayout /></AuthGuard>,
    children: [
      { path: '/dashboard', element: <S><DashboardPage /></S> },
      { path: '/feed', element: <S><FeedPage /></S> },
      { path: '/map', element: <S><MapPage /></S> },
      { path: '/events', element: <S><EventsPage /></S> },
      { path: '/events/:id', element: <S><EventDetailPage /></S> },
      { path: '/mess', element: <S><MessPage /></S> },
      { path: '/mess/book', element: <S><MessBookPage /></S> },
      { path: '/mess/tickets', element: <S><MessTicketsPage /></S> },
      { path: '/clubs', element: <S><ClubsPage /></S> },
      { path: '/clubs/:id', element: <S><ClubDetailPage /></S> },
      { path: '/people', element: <S><PeoplePage /></S> },
      { path: '/profile/edit', element: <S><EditProfilePage /></S> },
      { path: '/profile/:id', element: <S><ProfilePage /></S> },
      { path: '/lost-found', element: <S><LostFoundPage /></S> },
      { path: '/market', element: <S><MarketPage /></S> },
      { path: '/study-groups', element: <S><StudyGroupsPage /></S> },
      { path: '/seniors', element: <S><SeniorsPage /></S> },
      { path: '/notifications', element: <S><NotificationsPage /></S> },
    ],
  },
]);
