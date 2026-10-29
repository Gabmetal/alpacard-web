import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const API_BASE = '/api/v1';

export interface MerchantUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'CONSUMER';
  emailVerified?: boolean;
}

export function getMerchantToken(): string | null {
  const local = localStorage.getItem('alpacard_merchant_token');
  if (local) return local;
  const cookie = getCookie('alpacard_merchant_token');
  if (cookie) {
    try {
      localStorage.setItem('alpacard_merchant_token', cookie);
    } catch {
      // Ignore
    }
    return cookie;
  }
  return null;
}

export function setMerchantToken(token: string) {
  try {
    localStorage.setItem('alpacard_merchant_token', token);
  } catch {
    // Ignore
  }
  setCookie('alpacard_merchant_token', token, 365);
}

export function clearMerchantToken() {
  try {
    localStorage.removeItem('alpacard_merchant_token');
  } catch {
    // Ignore
  }
  removeCookie('alpacard_merchant_token');
}

export async function request(endpoint: string, options: RequestInit = {}) {
  const token = getMerchantToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
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
  updateProfile: (data: { name: string }) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: () =>
    request('/auth/account', { method: 'DELETE' }),
  resendVerification: (email?: string) =>
    request('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; password: string }) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Business
  createBusiness: (data: {
    name: string;
    logoUrl?: string;
    brandColor?: string;
    description?: string;
    category?: string;
    website?: string;
    instagram?: string;
    menuType?: string;
    menuUrl?: string;
    menuItems?: string;
  }) => request('/businesses', { method: 'POST', body: JSON.stringify(data) }),
  updateBusiness: (
    businessId: string,
    data: Partial<{
      name: string;
      logoUrl: string;
      brandColor: string;
      description: string;
      category: string;
      website: string;
      instagram: string;
      menuType: string;
      menuUrl: string;
      menuItems: string;
    }>
  ) => request(`/businesses/${businessId}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMyBusinesses: () => request('/businesses/mine'),
  listStaff: (businessId: string) => request(`/businesses/${businessId}/staff`),
  addStaff: (businessId: string, email: string) =>
    request(`/businesses/${businessId}/staff`, { method: 'POST', body: JSON.stringify({ email }) }),
  removeStaff: (businessId: string, staffId: string) =>
    request(`/businesses/${businessId}/staff/${staffId}`, { method: 'DELETE' }),
  getStats: (businessId: string) => request(`/businesses/${businessId}/stats`),

  // File Uploads
  uploadFile: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Campaigns
  createCampaign: (data: {
    businessId: string;
    name: string;
    description: string;
    stampsRequired: number;
    reward: string;
    logoUrl?: string;
    bgType?: string;
    bgValue?: string;
    bgImageUrl?: string;
    textColor?: string;
    stampIcon?: string;
  }) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (id: string, data: Partial<{
    name: string;
    description: string;
    stampsRequired: number;
    reward: string;
    logoUrl: string;
    bgType: string;
    bgValue: string;
    bgImageUrl: string;
    textColor: string;
    stampIcon: string;
    isActive: boolean;
  }>) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  listCampaigns: (businessId: string) => request(`/campaigns?businessId=${businessId}`),
  getCampaign: (id: string) => request(`/campaigns/${id}`),
  deleteCampaign: (id: string) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  // Scanner
  scanStamp: (token: string) =>
    request('/scan', { method: 'POST', body: JSON.stringify({ token }) }),
};
