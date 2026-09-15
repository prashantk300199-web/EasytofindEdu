import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InstituteApplications from './pages/InstituteApplications.jsx';
import InstituteApplicationReview from './pages/InstituteApplicationReview.jsx';

const API_BASE = 'https://api.easytofindedu.com/api/v1';

const ADMIN_CREDENTIALS = {
  username: 'admin@easytofindedu.com',
  password: 'Admin@2024!Secure',
};

async function apiCall(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'API call failed');
  }
  return res.json();
}

/* ─── Utilities ────────────────────────────────────────────── */

function Spinner() {
  return (
    <div className="flex items-center justify-center p-20">
      <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-gold-50 text-gold-700 border border-gold-300',
    rejected: 'bg-wine/10 text-wine border border-wine/20',
  };
  return (
    <span className={`inline-block px-3 py-1 text-[10px] uppercase tracking-overline font-medium ${styles[status] || 'bg-cream-200 text-ink-500'}`}>
      {status}
    </span>
  );
}

/* ─── Login Screen ─────────────────────────────────────────── */

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      setError('Invalid admin credentials');
      setLoading(false);
      return;
    }

    try {
      const data = await apiCall('/admin/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email: username, password }),
      });
      const token = data.data?.token || data.token;
      if (token) {
        localStorage.setItem('admin_token', token);
        onLogin(token);
      } else {
        setError('Authentication failed — no token received');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cream-50 w-full max-w-md border border-cream-300 p-12"
      >
        <div className="text-center mb-10">
          <div className="inline-block w-16 h-16 border-2 border-gold-500 mb-6 flex items-center justify-center">
            <span className="font-display text-gold-600 text-xl">EA</span>
          </div>
          <h1 className="font-display text-[32px] text-night-800 mb-2">Admin Portal</h1>
          <p className="text-[11px] uppercase tracking-overline text-gold-600">EasyToFindEdu</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 border-l-2 border-wine bg-cream-200 px-5 py-3 text-sm text-wine"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-overline text-gold-600 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-0 border-b border-cream-300 bg-transparent py-3 text-[15px] text-night-800 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
              placeholder="admin@easytofindedu.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-overline text-gold-600 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-0 border-b border-cream-300 bg-transparent py-3 text-[15px] text-night-800 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-night-800 py-4 text-[12px] uppercase tracking-wide2 text-cream-100 transition-colors duration-300 hover:bg-gold-600 disabled:opacity-60 mt-8"
          >
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Top Header Bar ───────────────────────────────────────── */

function TopBar({ onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="bg-cream-50 border-b border-cream-300 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <div>
        <p className="text-[11px] uppercase tracking-overline text-gold-600">Admin Dashboard</p>
        <p className="text-sm text-ink-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 border border-cream-300 bg-cream-50 flex items-center justify-center hover:border-gold-500 transition-colors"
          >
            <svg className="w-5 h-5 text-night-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-wine text-white text-[9px] flex items-center justify-center rounded-full px-1">
              3
            </span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white border border-cream-300 shadow-lg z-50"
              >
                <div className="p-4 border-b border-cream-300">
                  <p className="text-[11px] uppercase tracking-overline text-gold-600">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-8 text-center">
                    <p className="text-sm text-night-800 mb-1">All Caught Up!</p>
                    <p className="text-xs text-ink-400">No pending notifications</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 px-4 py-2 border border-cream-300 bg-cream-50 hover:border-gold-500 transition-colors"
          >
            <div className="w-8 h-8 bg-gold-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">AD</span>
            </div>
            <span className="text-sm text-night-800">Admin</span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-64 bg-white border border-cream-300 shadow-lg z-50"
              >
                <div className="p-4 border-b border-cream-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gold-500 flex items-center justify-center">
                      <span className="text-white font-medium">AD</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-night-800">Administrator</p>
                      <p className="text-xs text-ink-400">admin@easytofindedu.com</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-night-800 hover:bg-cream-50">
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-night-800 hover:bg-cream-50">
                    Activity Log
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-wine hover:bg-wine/5"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ──────────────────────────────────────────────── */

function Sidebar({ view, setView, stats }) {
  const counts = stats?.counts || {};
  const hostelStatus = stats?.distribution?.hostelStatus || [];
  const instituteStatus = stats?.distribution?.instituteStatus || [];
  const pendingHostels = hostelStatus.find(s => String(s._id) === 'PENDING')?.count ?? 0;
  const pendingInstitutes = instituteStatus.find(s => String(s._id) === 'PENDING' || s._id === false)?.count ?? 0;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', count: null },
    { id: 'approvals', label: 'Pending Approvals', count: pendingHostels },
    { id: 'hostels', label: 'All Hostels', count: counts.hostels ?? 0 },
    { id: 'institute-applications', label: 'Institute Applications', count: pendingInstitutes },
    { id: 'inquiries', label: 'Inquiries', count: null },
    { id: 'owners', label: 'Owners', count: counts.hostelOwners ?? 0 },
    { id: 'students', label: 'Students', count: counts.students ?? 0 },
    { id: 'analytics', label: 'Analytics', count: null },
  ];

  return (
    <aside className="w-72 bg-night-800 text-cream-100 flex flex-col min-h-screen border-r border-gold-500/20">
      {/* Header */}
      <div className="p-8 border-b border-gold-500/20">
        <div className="w-12 h-12 border-2 border-gold-500 mb-4 flex items-center justify-center">
          <span className="font-display text-gold-400 text-lg">EA</span>
        </div>
        <h1 className="font-display text-[20px] text-cream-100 mb-1">Admin Panel</h1>
        <p className="text-[10px] uppercase tracking-overline text-gold-400">EasyToFindEdu</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full text-left px-5 py-3.5 text-[13px] transition-all duration-300 flex items-center justify-between group ${
              view === item.id
                ? 'bg-gold-500 text-night-900 font-medium'
                : 'text-cream-100/70 hover:bg-cream-100/5 hover:text-cream-100'
            }`}
          >
            <span>{item.label}</span>
            {item.count !== null && item.count > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                view === item.id
                  ? 'bg-night-800 text-gold-400'
                  : 'bg-gold-500/20 text-gold-400'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gold-500/20">
        <p className="text-[10px] text-ink-400">Admin Panel v2.1</p>
        <p className="text-[10px] text-ink-500 mt-1">© 2026 EasyToFindEdu</p>
      </div>
    </aside>
  );
}

/* ─── Simple Line Chart Component ──────────────────────────── */

function LineChart({ data, label, labels }) {
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (val / max) * 80
  }));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-cream-50 border border-cream-300 p-6">
      <p className="text-[11px] uppercase tracking-overline text-gold-600 mb-4">{label}</p>
      <svg className="w-full h-32" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={pathData} fill="none" stroke="#C9A96A" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#C9A96A" />
        ))}
      </svg>
      {labels && (
        <div className="flex justify-between text-[10px] text-ink-400 mt-2">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* ─── Bar Chart Component ─────────────────────────────────── */

function BarChart({ data, labels, title }) {
  // Support both old format {data: number[], labels: string[]} and new {data: {label,value,color}[]}
  const isNewFormat = data && data.length > 0 && typeof data[0] === 'object' && 'label' in data[0];
  const items = isNewFormat ? data : data.map((value, i) => ({ label: labels?.[i] || '', value, color: 'bg-gold-500' }));
  const max = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="bg-cream-50 border border-cream-300 p-6">
      {title && <p className="text-[11px] uppercase tracking-overline text-gold-600 mb-4">{title}</p>}
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-night-800">{item.label}</span>
              <span className="text-xs text-ink-400">{item.value}</span>
            </div>
            <div className="w-full h-2 bg-cream-200">
              <div className={`h-full ${item.color}`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard View ───────────────────────────────────────── */

function Dashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = () => {
    setLoading(true);
    setError('');
    apiCall('/admin/dashboard/overview', token)
      .then((d) => setStats(d.data || d))
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, [token]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-10 bg-cream min-h-screen">
        <div className="bg-wine/10 border border-wine/30 rounded-lg p-6 text-center">
          <p className="text-wine font-medium mb-3">Failed to load dashboard</p>
          <p className="text-sm text-wine/70 mb-4">{error}</p>
          <button onClick={loadStats} className="px-6 py-2 bg-wine text-white text-sm hover:bg-wine/90 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const counts = stats?.counts || {};
  const growth = stats?.growth || {};
  const distribution = stats?.distribution || {};
  const hostelDist = distribution.hostelStatus || [];
  const instituteDist = distribution.instituteStatus || [];

  const getCount = (key, fallback = 0) => counts[key] ?? fallback;
  const getStatusCount = (arr, status) => {
    const found = arr.find((s) => String(s._id) === String(status));
    return found?.count ?? 0;
  };

  const hostelApproved = getStatusCount(hostelDist, 'APPROVED');
  const hostelPending = getStatusCount(hostelDist, 'PENDING');
  const hostelRejected = getStatusCount(hostelDist, 'REJECTED');

  const cards = [
    { label: 'Total Hostels', value: getCount('hostels'), sub: 'Active listings', color: 'border-l-4 border-l-gold-500' },
    { label: 'Pending Hostels', value: hostelPending, sub: 'Awaiting review', color: 'border-l-4 border-l-wine' },
    { label: 'Hostel Owners', value: getCount('hostelOwners'), sub: 'Registered owners', color: 'border-l-4 border-l-emerald-600' },
    { label: 'Students', value: getCount('students'), sub: 'Active students', color: 'border-l-4 border-l-blue-600' },
    { label: 'Institutes', value: getCount('institutes'), sub: 'Listed institutes', color: 'border-l-4 border-l-purple-600' },
    { label: 'Institute Owners', value: getCount('instituteOwners'), sub: 'Registered owners', color: 'border-l-4 border-l-teal-600' },
  ];

  // Build growth chart from real monthly data
  const hostelGrowth = growth.hostels || [];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentMonth = new Date().getMonth() + 1;
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const m = ((currentMonth - 5 + i - 1) % 12) + 1;
    const found = hostelGrowth.find(g => g._id === m);
    return found?.count ?? 0;
  });

  // Institute growth
  const instituteGrowth = growth.institutes || [];
  const last6Inst = Array.from({ length: 6 }, (_, i) => {
    const m = ((currentMonth - 5 + i - 1) % 12) + 1;
    const found = instituteGrowth.find(g => g._id === m);
    return found?.count ?? 0;
  });

  // Last 6 month labels
  const last6Labels = Array.from({ length: 6 }, (_, i) => {
    const m = ((currentMonth - 5 + i - 1) % 12) + 1;
    return MONTHS[m - 1];
  });

  return (
    <div className="p-10 bg-cream min-h-screen">
      {/* Header + Refresh */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-2">Dashboard Overview</h2>
          <p className="text-sm text-ink-500">Platform statistics and activity</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 border border-cream-300 bg-cream-50 text-sm text-night-800 hover:border-gold-500 hover:bg-gold-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-cream-50 border border-cream-300 p-5 ${card.color}`}
          >
            <p className="text-[10px] uppercase tracking-overline text-gold-600 mb-2">
              {card.label}
            </p>
            <p className="font-display text-[32px] text-night-800 mb-1">{card.value}</p>
            <p className="text-[10px] text-ink-400">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart title="Hostel Status Distribution" data={[
          { label: 'Approved', value: hostelApproved, color: 'bg-emerald-500' },
          { label: 'Pending', value: hostelPending, color: 'bg-gold-500' },
          { label: 'Rejected', value: hostelRejected, color: 'bg-wine' },
        ]} />
        <LineChart label="Hostel Registrations (Last 6 Months)" data={last6} labels={last6Labels} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream-50 border border-cream-300 p-8">
          <h3 className="font-display text-[24px] text-night-800 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-4 p-4 border border-cream-300 hover:border-gold-500 hover:bg-cream-100 transition-colors text-left">
              <div className="w-10 h-10 bg-gold-500 flex items-center justify-center text-night-900 text-xl shrink-0">+</div>
              <div>
                <p className="text-sm font-medium text-night-800">Review Pending Hostels</p>
                <p className="text-xs text-ink-400">{hostelPending} awaiting approval</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-4 p-4 border border-cream-300 hover:border-gold-500 hover:bg-cream-100 transition-colors text-left">
              <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-night-800">View All Hostels</p>
                <p className="text-xs text-ink-400">{getCount('hostels')} total listings</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-4 p-4 border border-cream-300 hover:border-gold-500 hover:bg-cream-100 transition-colors text-left">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-night-800">Manage Students</p>
                <p className="text-xs text-ink-400">{getCount('students')} registered</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 p-8">
          <h3 className="font-display text-[24px] text-night-800 mb-6">Institute Growth</h3>
          {last6Inst.some(v => v > 0) ? (
            <BarChart title="" data={[
              { label: 'Jan', value: last6Inst[0] || 0, color: 'bg-blue-500' },
              { label: 'Feb', value: last6Inst[1] || 0, color: 'bg-blue-500' },
              { label: 'Mar', value: last6Inst[2] || 0, color: 'bg-blue-500' },
              { label: 'Apr', value: last6Inst[3] || 0, color: 'bg-blue-500' },
              { label: 'May', value: last6Inst[4] || 0, color: 'bg-blue-500' },
              { label: 'Jun', value: last6Inst[5] || 0, color: 'bg-blue-500' },
            ]} />
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-ink-400">
              No institute growth data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Approvals View ───────────────────────────────────────── */

function Approvals({ token }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const loadPending = () => {
    setLoading(true);
    setError('');
    apiCall('/admin/hostels?status=pending', token)
      .then((d) => setHostels(d.data?.hostels || d.hostels || []))
      .catch((err) => setError(err.message || 'Failed to load pending hostels'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPending(); }, [token]);

  const approve = async (id) => {
    if (!window.confirm('Approve this hostel?')) return;
    setActionLoading(id);
    try {
      await apiCall(`/admin/hostels/${id}/approve`, token, { method: 'PATCH' });
      setHostels((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to approve hostel');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm('Reject this hostel?')) return;
    setActionLoading(id);
    try {
      await apiCall(`/admin/hostels/${id}/reject`, token, { method: 'PATCH' });
      setHostels((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to reject hostel');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-10 bg-cream min-h-screen">
      {/* Header + Refresh */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-2">Pending Approvals</h2>
          <p className="text-sm text-ink-500">{hostels.length} hostels awaiting review</p>
        </div>
        <button onClick={loadPending} className="flex items-center gap-2 px-4 py-2 border border-cream-300 bg-cream-50 text-sm text-night-800 hover:border-gold-500 hover:bg-gold-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-wine/10 border border-wine/30 px-6 py-4 rounded-lg text-wine text-sm">
          {error} <button onClick={loadPending} className="underline ml-2">Retry</button>
        </div>
      )}

      {hostels.length === 0 && !error ? (
        <div className="bg-cream-50 border border-cream-300 p-20 text-center">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl text-emerald-600">✓</span>
          </div>
          <h3 className="font-display text-[24px] text-night-800 mb-2">All Caught Up!</h3>
          <p className="text-sm text-ink-500">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {hostels.map((h) => (
            <motion.div
              key={h._id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-50 border border-cream-300 p-8"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Hostel Image */}
                {h.photos && h.photos[0] && (
                  <div className="w-full lg:w-64 h-48 border border-cream-300 overflow-hidden flex-shrink-0">
                    <img src={h.photos[0]} alt={h.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="font-display text-[24px] text-night-800 mb-1">
                        {h.masked_name || h.name}
                      </h3>
                      <p className="text-sm text-ink-500">
                        {h.hostel_type} · {h.address?.city}, {h.address?.state}
                      </p>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="border-l-2 border-gold-500 pl-3">
                      <p className="text-[10px] uppercase tracking-overline text-ink-400 mb-1">Owner</p>
                      <p className="text-sm text-night-800">{h.owner?.name || 'N/A'}</p>
                    </div>
                    <div className="border-l-2 border-gold-500 pl-3">
                      <p className="text-[10px] uppercase tracking-overline text-ink-400 mb-1">Contact</p>
                      <p className="text-sm text-night-800">{h.owner?.phone || 'N/A'}</p>
                    </div>
                    <div className="border-l-2 border-gold-500 pl-3">
                      <p className="text-[10px] uppercase tracking-overline text-ink-400 mb-1">Submitted</p>
                      <p className="text-sm text-night-800">
                        {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="border-l-2 border-gold-500 pl-3">
                      <p className="text-[10px] uppercase tracking-overline text-ink-400 mb-1">Type</p>
                      <p className="text-sm text-night-800 capitalize">{h.hostel_type}</p>
                    </div>
                  </div>

                  {/* Social Media */}
                  {(h.social_media?.youtube || h.social_media?.instagram || h.social_media?.facebook) && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {h.social_media?.youtube && (
                        <a href={h.social_media.youtube} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 rounded px-2 py-1 bg-red-50">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          YouTube
                        </a>
                      )}
                      {h.social_media?.instagram && (
                        <a href={h.social_media.instagram} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-pink-600 hover:text-pink-700 font-medium border border-pink-200 rounded px-2 py-1 bg-pink-50">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg>
                          Instagram
                        </a>
                      )}
                      {h.social_media?.facebook && (
                        <a href={h.social_media.facebook} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded px-2 py-1 bg-blue-50">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          Facebook
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => approve(h._id)}
                      disabled={actionLoading === h._id}
                      className="px-8 py-3 bg-emerald-600 text-white text-[12px] uppercase tracking-wide2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === h._id ? 'Processing…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => reject(h._id)}
                      disabled={actionLoading === h._id}
                      className="px-8 py-3 bg-wine text-white text-[12px] uppercase tracking-wide2 hover:bg-wine/90 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── All Hostels View ─────────────────────────────────────── */

function AllHostels({ token }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHostels = () => {
    setLoading(true);
    setError('');
    apiCall('/admin/hostels', token)
      .then((d) => setHostels(d.data?.hostels || d.hostels || []))
      .catch((err) => setError(err.message || 'Failed to load hostels'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHostels(); }, [token]);

  if (loading) return <Spinner />;

  return (
    <div className="p-10 bg-cream min-h-screen">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-2">All Hostels</h2>
          <p className="text-sm text-ink-500">{hostels.length} hostels in the system</p>
        </div>
        <button onClick={loadHostels} className="flex items-center gap-2 px-4 py-2 border border-cream-300 bg-cream-50 text-sm text-night-800 hover:border-gold-500 hover:bg-gold-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-wine/10 border border-wine/30 px-6 py-4 rounded-lg text-wine text-sm">
          {error} <button onClick={loadHostels} className="underline ml-2">Retry</button>
        </div>
      )}

      {hostels.length === 0 && !error ? (
        <div className="bg-cream-50 border border-cream-300 p-16 text-center">
          <p className="text-ink-400">No hostels found in the system.</p>
        </div>
      ) : (
        <div className="bg-cream-50 border border-cream-300 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-100">
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Name</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Location</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Type</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Status</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Verified</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Social</th>
              </tr>
            </thead>
            <tbody>
              {hostels.map((h) => (
                <tr key={h._id} className="border-b border-cream-300 hover:bg-cream-100 transition-colors">
                  <td className="p-4">
                    <span className="text-sm text-night-800 font-medium">{h.masked_name || h.name}</span>
                  </td>
                  <td className="p-4 text-sm text-night-800">{h.address?.city || 'N/A'}, {h.address?.state || ''}</td>
                  <td className="p-4 text-sm text-night-800 capitalize">{h.hostel_type || 'N/A'}</td>
                  <td className="p-4"><StatusBadge status={h.status} /></td>
                  <td className="p-4">
                    <span className={`text-sm ${h.verification_status === 'verified' ? 'text-emerald-600' : 'text-ink-400'}`}>
                      {h.verification_status === 'verified' ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      {h.social_media?.youtube && (
                        <span title="YouTube" className="text-red-500 text-sm">▶</span>
                      )}
                      {h.social_media?.instagram && (
                        <span title="Instagram" className="text-pink-500 text-sm">●</span>
                      )}
                      {h.social_media?.facebook && (
                        <span title="Facebook" className="text-blue-600 text-sm">f</span>
                      )}
                      {!h.social_media?.youtube && !h.social_media?.instagram && !h.social_media?.facebook && (
                        <span className="text-ink-300 text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Inquiries View ───────────────────────────────────────── */

function Inquiries({ token }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInquiries = () => {
    setLoading(true);
    setError('');
    apiCall('/admin/hostels/inquiries/all', token)
      .then((d) => setInquiries(d.data?.inquiries || d.inquiries || []))
      .catch((err) => setError(err.message || 'Failed to load inquiries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInquiries(); }, [token]);

  if (loading) return <Spinner />;

  return (
    <div className="p-10 bg-cream min-h-screen">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-2">Inquiries</h2>
          <p className="text-sm text-ink-500">{inquiries.length} total inquiries</p>
        </div>
        <button onClick={loadInquiries} className="flex items-center gap-2 px-4 py-2 border border-cream-300 bg-cream-50 text-sm text-night-800 hover:border-gold-500 hover:bg-gold-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-wine/10 border border-wine/30 px-6 py-4 rounded-lg text-wine text-sm">
          {error} <button onClick={loadInquiries} className="underline ml-2">Retry</button>
        </div>
      )}

      {inquiries.length === 0 && !error ? (
        <div className="bg-cream-50 border border-cream-300 p-16 text-center">
          <p className="text-ink-400">No inquiries found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq._id} className="bg-cream-50 border border-cream-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium text-night-800 mb-1">{inq.name || 'N/A'}</p>
                  <p className="text-sm text-ink-500">{inq.email || 'N/A'} · {inq.phone || 'N/A'}</p>
                </div>
                <p className="text-xs text-ink-400">
                  {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {inq.message && <p className="text-sm text-night-800">{inq.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Owners/Students Views ────────────────────────────────── */

function Owners({ token }) {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOwners = () => {
    setLoading(true);
    setError('');
    apiCall('/admin/owners', token)
      .then((d) => setOwners(d.data?.owners || d.owners || []))
      .catch((err) => setError(err.message || 'Failed to load owners'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOwners(); }, [token]);

  if (loading) return <Spinner />;

  return (
    <div className="p-10 bg-cream min-h-screen">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-2">Hostel Owners</h2>
          <p className="text-sm text-ink-500">{owners.length} registered owners</p>
        </div>
        <button onClick={loadOwners} className="flex items-center gap-2 px-4 py-2 border border-cream-300 bg-cream-50 text-sm text-night-800 hover:border-gold-500 hover:bg-gold-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-wine/10 border border-wine/30 px-6 py-4 rounded-lg text-wine text-sm">
          {error} <button onClick={loadOwners} className="underline ml-2">Retry</button>
        </div>
      )}

      {owners.length === 0 && !error ? (
        <div className="bg-cream-50 border border-cream-300 p-16 text-center">
          <p className="text-ink-400">No hostel owners found.</p>
        </div>
      ) : (
        <div className="bg-cream-50 border border-cream-300 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-100">
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Name</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Email</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Phone</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o) => (
                <tr key={o._id} className="border-b border-cream-300 hover:bg-cream-100 transition-colors">
                  <td className="p-4 text-sm text-night-800 font-medium">{o.name || 'N/A'}</td>
                  <td className="p-4 text-sm text-night-800">{o.email || 'N/A'}</td>
                  <td className="p-4 text-sm text-night-800">{o.phone || 'N/A'}</td>
                  <td className="p-4"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Students({ token }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCoins, setEditingCoins] = useState(null);
  const [newCoins, setNewCoins] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadStudents = () => {
    setLoading(true);
    setError('');
    apiCall('/student/auth/admin/students', token)
      .then((d) => setStudents(d.data?.data || d.data?.students || d.students || []))
      .catch((err) => setError(err.message || 'Failed to load students'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, [token]);

  const handleEditCoins = (student) => {
    setEditingCoins(student._id);
    setNewCoins(String(student.wallet?.coins || 0));
  };

  const handleSaveCoins = async (studentId) => {
    setUpdating(true);
    try {
      await apiCall(`/student/auth/admin/students/${studentId}/coins`, token, {
        method: 'PUT',
        body: JSON.stringify({ coins: parseInt(newCoins) || 0 }),
      });
      setStudents((prev) =>
        prev.map((s) =>
          s._id === studentId
            ? { ...s, wallet: { ...s.wallet, coins: parseInt(newCoins) || 0 } }
            : s
        )
      );
      setEditingCoins(null);
      setNewCoins('');
    } catch (err) {
      alert(err.message || 'Failed to update coins');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-10 bg-cream min-h-screen">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-display text-[36px] text-night-800 mb-2">Students</h2>
          <p className="text-sm text-ink-500">{students.length} registered students</p>
        </div>
        <button onClick={loadStudents} className="flex items-center gap-2 px-4 py-2 border border-cream-300 bg-cream-50 text-sm text-night-800 hover:border-gold-500 hover:bg-gold-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-wine/10 border border-wine/30 px-6 py-4 rounded-lg text-wine text-sm">
          {error} <button onClick={loadStudents} className="underline ml-2">Retry</button>
        </div>
      )}

      {students.length === 0 && !error ? (
        <div className="bg-cream-50 border border-cream-300 p-16 text-center">
          <p className="text-ink-400">No students found.</p>
        </div>
      ) : (
        <div className="bg-cream-50 border border-cream-300 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-100">
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Name</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Email</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Phone</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Coins</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Referral Code</th>
                <th className="text-left p-4 text-[10px] uppercase tracking-overline text-ink-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b border-cream-300 hover:bg-cream-100 transition-colors">
                  <td className="p-4 text-sm text-night-800 font-medium">{s.name || 'N/A'}</td>
                  <td className="p-4 text-sm text-night-800">{s.email || 'N/A'}</td>
                  <td className="p-4 text-sm text-night-800">{s.phone || 'N/A'}</td>
                  <td className="p-4">
                    {editingCoins === s._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newCoins}
                          onChange={(e) => setNewCoins(e.target.value)}
                          className="w-24 border border-cream-300 bg-white px-2 py-1 text-sm text-night-800 focus:border-gold-500 focus:outline-none"
                          disabled={updating}
                        />
                        <button
                          onClick={() => handleSaveCoins(s._id)}
                          disabled={updating}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingCoins(null); setNewCoins(''); }}
                          disabled={updating}
                          className="px-3 py-1 bg-cream-300 text-night-800 text-xs hover:bg-cream-400 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-night-800 font-medium">
                        💰 {s.wallet?.coins ?? 0}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <code className="text-xs bg-cream-200 px-2 py-1 text-night-800 font-mono">
                      {s.referralCode || 'N/A'}
                    </code>
                  </td>
                  <td className="p-4">
                    {editingCoins !== s._id && (
                      <button
                        onClick={() => handleEditCoins(s)}
                        className="px-4 py-2 bg-gold-500 text-night-900 text-xs uppercase tracking-wide hover:bg-gold-600 transition-colors"
                      >
                        Edit Coins
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Analytics({ token }) {
  const [loading, setLoading] = useState(true);

  if (loading) return <Spinner />;

  return (
    <div className="p-10 bg-cream min-h-screen">
      <div className="mb-10">
        <h2 className="font-display text-[36px] text-night-800 mb-2">Analytics</h2>
        <p className="text-sm text-ink-500">Platform insights and metrics</p>
      </div>
      <div className="bg-cream-50 border border-cream-300 p-16 text-center">
        <div className="w-20 h-20 bg-cream-200 border border-cream-300 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-display text-[24px] text-night-800 mb-2">Analytics Coming Soon</h3>
        <p className="text-sm text-ink-500 mb-4">Detailed analytics and reporting will be available soon.</p>
        <p className="text-xs text-ink-400">Use the Dashboard overview for current platform statistics.</p>
      </div>
    </div>
  );
}

/* ─── Main App ─────────────────────────────────────────────── */

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  useEffect(() => {
    if (token) {
      apiCall('/admin/dashboard/overview', token)
        .then((d) => setStats(d.data || d))
        .catch(() => {});
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const handleViewApplication = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setView('institute-application-review');
  };

  const handleBackToApplications = () => {
    setSelectedApplicationId(null);
    setView('institute-applications');
  };

  const counts = stats?.counts || {};
  const hostelStatus = stats?.distribution?.hostelStatus || [];
  const pendingHostels = hostelStatus.find(s => String(s._id) === 'PENDING')?.count ?? 0;
  const pendingCount = pendingHostels;

  if (!token) return <Login onLogin={setToken} />;

  return (
    <div className="flex bg-cream min-h-screen">
      <Sidebar view={view} setView={setView} stats={stats} />
      <div className="flex-1 flex flex-col">
        <TopBar onLogout={logout} pendingCount={pendingCount} />
        <main className="flex-1">
          {view === 'dashboard' && <Dashboard token={token} />}
          {view === 'approvals' && <Approvals token={token} />}
          {view === 'hostels' && <AllHostels token={token} />}
          {view === 'institute-applications' && <InstituteApplications token={token} onViewApplication={handleViewApplication} />}
          {view === 'institute-application-review' && <InstituteApplicationReview token={token} applicationId={selectedApplicationId} onBack={handleBackToApplications} />}
          {view === 'inquiries' && <Inquiries token={token} />}
          {view === 'owners' && <Owners token={token} />}
          {view === 'students' && <Students token={token} />}
          {view === 'analytics' && <Analytics token={token} />}
        </main>
      </div>
    </div>
  );
}
