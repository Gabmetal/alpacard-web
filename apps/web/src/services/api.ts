const API_BASE = '/api/v1';

export function getMerchantToken(): string | null {
  return localStorage.getItem('alpacard_merchant_token');
}

export function setMerchantToken(token: string) {
  localStorage.setItem('alpacard_merchant_token', token);
}

export function clearMerchantToken() {
  localStorage.removeItem('alpacard_merchant_token');
}

export async function request(endpoint: string, options: RequestInit = {}) {
  const token = getMerchantToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Business
  createBusiness: (data: { name: string; logoUrl?: string }) =>
    request('/businesses', { method: 'POST', body: JSON.stringify(data) }),
  getMyBusinesses: () => request('/businesses/mine'),
  listStaff: (businessId: string) => request(`/businesses/${businessId}/staff`),
  addStaff: (businessId: string, email: string) =>
    request(`/businesses/${businessId}/staff`, { method: 'POST', body: JSON.stringify({ email }) }),
  removeStaff: (businessId: string, staffId: string) =>
    request(`/businesses/${businessId}/staff/${staffId}`, { method: 'DELETE' }),
  getStats: (businessId: string) => request(`/businesses/${businessId}/stats`),

  // Campaigns
  createCampaign: (data: {
    businessId: string;
    name: string;
    description: string;
    stampsRequired: number;
    reward: string;
  }) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  listCampaigns: (businessId: string) => request(`/campaigns?businessId=${businessId}`),
  getCampaign: (id: string) => request(`/campaigns/${id}`),

  // Scanner
  scanStamp: (token: string) =>
    request('/scan', { method: 'POST', body: JSON.stringify({ token }) }),
};
