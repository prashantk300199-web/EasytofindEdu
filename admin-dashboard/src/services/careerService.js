/**
 * Career Admin API Service
 * All API calls to the EasyToFindEdu backend career guidance endpoints
 */

const API_BASE = 'https://api.easytofindedu.com/api/v1';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Career Nodes ────────────────────────────────────────────────────────────

export async function getCareerNodes(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await api(`/admin/career/nodes${qs ? `?${qs}` : ''}`);
  return data.data || data;
}

export async function getCareerNode(id) {
  const data = await api(`/admin/career/nodes/${id}`);
  return data.data || data;
}

export async function createCareerNode(payload) {
  const data = await api('/admin/career/nodes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function updateCareerNode(id, payload) {
  const data = await api(`/admin/career/nodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function deleteCareerNode(id) {
  return api(`/admin/career/nodes/${id}`, { method: 'DELETE' });
}

export async function featureCareerNode(id) {
  return api(`/admin/career/nodes/${id}/feature`, { method: 'PUT' });
}

export async function getCareerTree() {
  const data = await api('/admin/career/tree');
  return data.data || data;
}

export async function validateCareerTree() {
  return api('/admin/career/tree/validate');
}

// ─── Career Programs ────────────────────────────────────────────────────────

export async function getCareerPrograms(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await api(`/admin/careers/programs${qs ? `?${qs}` : ''}`);
  return data.data || data;
}

export async function getCareerProgram(id) {
  const data = await api(`/admin/careers/programs/${id}`);
  return data.data || data;
}

export async function createCareerProgram(payload) {
  const data = await api('/admin/careers/programs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function updateCareerProgram(id, payload) {
  const data = await api(`/admin/careers/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function publishCareerProgram(id) {
  return api(`/admin/careers/programs/${id}/publish`, { method: 'PATCH' });
}

export async function archiveCareerProgram(id) {
  return api(`/admin/careers/programs/${id}`, { method: 'DELETE' });
}

// ─── Entrance Exams ─────────────────────────────────────────────────────────

export async function getEntranceExams(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await api(`/admin/careers/exams${qs ? `?${qs}` : ''}`);
  return data.data || data;
}

export async function createEntranceExam(payload) {
  const data = await api('/admin/careers/exams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function updateEntranceExam(id, payload) {
  const data = await api(`/admin/careers/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function publishEntranceExam(id) {
  return api(`/admin/careers/exams/${id}/publish`, { method: 'PATCH' });
}

export async function archiveEntranceExam(id) {
  return api(`/admin/careers/exams/${id}`, { method: 'DELETE' });
}

// ─── Colleges ────────────────────────────────────────────────────────────────

export async function getColleges(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await api(`/admin/careers/colleges${qs ? `?${qs}` : ''}`);
  return data.data || data;
}

export async function createCollege(payload) {
  const data = await api('/admin/careers/colleges', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function updateCollege(id, payload) {
  const data = await api(`/admin/careers/colleges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.data || data;
}

export async function archiveCollege(id) {
  return api(`/admin/careers/colleges/${id}`, { method: 'DELETE' });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getCareerAnalytics() {
  const data = await api('/admin/career/analytics');
  return data.data || data;
}

export async function getCareerAuditLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await api(`/admin/career/audit-logs${qs ? `?${qs}` : ''}`);
  return data.data || data;
}
