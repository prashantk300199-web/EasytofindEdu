import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as api from '../services/instituteApplicationService.js';
import StatusBadge from '../components/instituteApplications/StatusBadge.jsx';

export default function InstituteApplications({ token, onViewApplication }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadApplications();
  }, [pagination.page, statusFilter, categoryFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search,
        status: statusFilter,
        category: categoryFilter
      };

      const response = await api.getApplications(token, params);

      if (response.success) {
        setApplications(response.data.applications || []);
        setPagination(response.data.pagination || pagination);
      } else {
        setError(response.message || 'Failed to load applications');
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadApplications();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-ink-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-[32px] text-night-800 mb-2">Institute Applications</h1>
        <p className="text-sm text-ink-400">Review and manage institute registration applications</p>
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

      {/* Filters */}
      <div className="mb-6 bg-white border border-cream-300 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-[11px] uppercase tracking-overline text-gold-600 mb-2">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Institute name, owner, email, phone, city..."
                className="flex-1 border border-cream-300 bg-white px-4 py-2 text-sm text-night-800 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gold-500 text-night-900 text-xs uppercase tracking-wide hover:bg-gold-600 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-overline text-gold-600 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-cream-300 bg-white px-4 py-2 text-sm text-night-800 focus:border-gold-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="changes_requested">Changes Requested</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-overline text-gold-600 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-cream-300 bg-white px-4 py-2 text-sm text-night-800 focus:border-gold-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Education & Academic">Education & Academic</option>
                <option value="Professional & Technology">Professional & Technology</option>
                <option value="Arts & Creative">Arts & Creative</option>
                <option value="Beauty & Fashion">Beauty & Fashion</option>
                <option value="Languages">Languages</option>
                <option value="Finance">Finance</option>
                <option value="Vocational & Skill Development">Vocational & Skill Development</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-cream-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-50">
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">Institute Name</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">Category</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">City</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">Owner</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">Submitted</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">Status</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-overline text-gold-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-sm text-ink-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="border-b border-cream-200 hover:bg-cream-50">
                    <td className="px-4 py-3 text-sm text-night-800 font-medium">
                      {app.step1InstituteInfo?.instituteName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {app.step2Category?.primaryCategory || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {app.step3LocationContact?.city || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {app.ownerId?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.verificationStatus || app.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewApplication(app._id)}
                        className="px-4 py-2 bg-gold-500 text-night-900 text-xs uppercase tracking-wide hover:bg-gold-600 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="border-t border-cream-300 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-ink-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-cream-300 text-xs uppercase tracking-wide text-night-800 hover:bg-cream-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-cream-300 text-xs uppercase tracking-wide text-night-800 hover:bg-cream-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
