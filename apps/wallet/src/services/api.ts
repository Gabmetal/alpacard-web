const API_BASE = '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('alpacard_wallet_token');
}

export function setToken(token: string) {
  localStorage.setItem('alpacard_wallet_token', token);
}

// Ensures an anonymous guest token exists for 1-tap card claiming
export async function ensureAuthToken(): Promise<string> {
  let token = getToken();
  if (token) return token;

  const res = await fetch(`${API_BASE}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Failed to create guest wallet');
  const data = await res.json();
  setToken(data.token);
  return data.token;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await ensureAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
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

export const walletApi = {
  getMyCards: () => fetchWithAuth('/cards/mine'),
  getCard: (id: string) => fetchWithAuth(`/cards/${id}`),
  getCardQR: (id: string) => fetchWithAuth(`/cards/${id}/qr`),
  claimCard: (campaignId: string) =>
    fetchWithAuth('/cards/claim', {
      method: 'POST',
      body: JSON.stringify({ campaignId }),
    }),
  getCampaign: (id: string) =>
    fetch(`${API_BASE}/campaigns/${id}`).then((res) => {
      if (!res.ok) throw new Error('Campaign not found');
      return res.json();
    }),
};
