const API_BASE = 'https://api.easytofindedu.com/api/admin';

/**
 * Get all institute applications with filters
 */
export const getApplications = async (token, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/api/admin/institute-applications${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch applications');
  }

  return res.json();
};

/**
 * Get institute application by ID
 */
export const getApplicationById = async (token, id) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch application');
  }

  return res.json();
};

/**
 * Approve institute application
 */
export const approveApplication = async (token, id) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/${id}/approve`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to approve application');
  }

  return res.json();
};

/**
 * Request changes to institute application
 */
export const requestChanges = async (token, id, feedback) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/${id}/request-changes`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ feedback })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to request changes');
  }

  return res.json();
};

/**
 * Reject institute application
 */
export const rejectApplication = async (token, id, reason) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/${id}/reject`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to reject application');
  }

  return res.json();
};

/**
 * Suspend verified institute
 */
export const suspendApplication = async (token, id, reason) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/${id}/suspend`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to suspend application');
  }

  return res.json();
};

/**
 * Get verification history
 */
export const getVerificationHistory = async (token, id) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/${id}/history`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch history');
  }

  return res.json();
};

/**
 * Get application statistics
 */
export const getApplicationStats = async (token) => {
  const res = await fetch(`${API_BASE}/api/admin/institute-applications/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch stats');
  }

  return res.json();
};
