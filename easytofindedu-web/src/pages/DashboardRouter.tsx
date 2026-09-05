import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * DashboardRouter - Routes users to the correct dashboard based on their role
 *
 * Prevents Institute Owners from accessing Hostel Owner dashboard
 * Prevents Hostel Owners from accessing Institute Owner dashboard
 */
export default function DashboardRouter() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Route based on user role
    switch (user.role) {
      case 'institute_owner':
        navigate('/institute-dashboard', { replace: true });
        break;
      case 'owner': // hostel owner
        navigate('/hostel-dashboard', { replace: true });
        break;
      default:
        navigate('/login');
    }
  }, [user, navigate]);

  // Show loading state while routing
  return (
    <div className="min-h-screen bg-night-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
        <p className="text-cream-100/60">Loading dashboard...</p>
      </div>
    </div>
  );
}
