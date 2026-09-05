import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfferBanner } from './components/OfferBanner';
import { HomePage } from './pages/HomePage';
import { InstitutesPage } from './pages/InstitutesPage';
import { InstituteDetailPage } from './pages/InstituteDetailPage';
import { CollegesPage } from './pages/CollegesPage';
import { CollegeDetailPage } from './pages/CollegeDetailPage';
import { HostelsPage } from './pages/HostelsPage';
import { HostelDetailPage } from './pages/HostelDetailPage';
import { AddHostelPage } from './pages/AddHostelPage';
import { CareerGuidancePage } from './pages/CareerGuidancePage';
import { ProspectPage } from './pages/ProspectPage';
import { JournalPage } from './pages/JournalPage';
import { LoginPage } from './pages/LoginPage';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import InstituteOwnerDashboard from './pages/InstituteOwnerDashboard';
import DashboardRouter from './pages/DashboardRouter';
import InstituteRegistration from './pages/InstituteRegistration';
import { NotFoundPage } from './pages/NotFoundPage';
import { WishlistPage } from './components/WishlistButton';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Routes that open with a full-bleed dark hero — no top offset needed.
const HERO_ROUTES = ['/hostels', '/institutes', '/colleges', '/journal', '/abroad', '/online-courses'];
// Pages with their own full-screen layout — no navbar/footer.
const STANDALONE_ROUTES = ['/login'];
const DASHBOARD_ROUTES_PREFIX = ['/dashboard', '/hostel-dashboard', '/institute-dashboard', '/institute-registration', '/institute-owner', '/admin'];

function AnimatedRoutes() {
  const location = useLocation();
  const isStandalone = STANDALONE_ROUTES.includes(location.pathname);
  const isDashboard = DASHBOARD_ROUTES_PREFIX.some(p => location.pathname.startsWith(p));
  const hasHero = location.pathname === '/' || HERO_ROUTES.includes(location.pathname);
  const offset = (isStandalone || hasHero || isDashboard) ? '' : 'pt-[76px]';

  // Dashboard — full-screen layout, no navbar/footer
  if (isDashboard) {
    return (
      <Routes location={location}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/hostel-dashboard/*" element={<OwnerDashboard />} />
        <Route path="/institute-dashboard" element={<InstituteOwnerDashboard />} />
        <Route path="/institute-registration" element={<InstituteRegistration />} />
        <Route path="/institute-owner/register" element={<InstituteRegistration />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    );
  }

  if (isStandalone) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        className={`relative z-10 flex-grow ${offset}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/institutes" element={<InstitutesPage />} />
          <Route path="/institutes/:id" element={<InstituteDetailPage />} />
          <Route path="/colleges" element={<CollegesPage />} />
          <Route path="/colleges/:id" element={<CollegeDetailPage />} />
          <Route path="/hostels" element={<HostelsPage />} />
          <Route path="/hostels/:slug" element={<HostelDetailPage />} />
          <Route path="/hostels/add" element={<AddHostelPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/career-guidance" element={<CareerGuidancePage />} />
          <Route path="/abroad" element={<ProspectPage kind="abroad" />} />
          <Route path="/online-courses" element={<ProspectPage kind="online" />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const isStandalone = STANDALONE_ROUTES.includes(pathname);
  const isDashboard = DASHBOARD_ROUTES_PREFIX.some(p => pathname.startsWith(p));

  return (
    <div className="grain flex min-h-screen flex-col">
      {!isStandalone && !isDashboard && (
        <>
          <Navbar />
          <OfferBanner />
        </>
      )}
      <div className={!isStandalone && !isDashboard ? 'pb-20 md:pb-0' : ''}>
        <AnimatedRoutes />
      </div>
      {!isStandalone && !isDashboard && <Footer />}
      {!isStandalone && !isDashboard && <MobileBottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
