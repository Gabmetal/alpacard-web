const API_BASE = '/api/v1';

export interface WalletUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isAnonymous: boolean;
}

export function getToken(): string | null {
  return localStorage.getItem('alpacard_wallet_token');
}

export function setToken(token: string) {
  localStorage.setItem('alpacard_wallet_token', token);
}

export function getStoredUser(): WalletUser | null {
  try {
    const raw = localStorage.getItem('alpacard_wallet_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: WalletUser | null) {
  if (user) {
    localStorage.setItem('alpacard_wallet_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('alpacard_wallet_user');
  }
}

export function clearToken() {
  localStorage.removeItem('alpacard_wallet_token');
  localStorage.removeItem('alpacard_wallet_user');
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
  if (data.user) {
    setStoredUser(data.user);
  }
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
  login: async (req: { email: string; password: string }) => {
    const currentToken = getToken();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to login');
    }

    const data = await res.json();
    if (currentToken && currentToken !== data.token) {
      try {
        await fetch(`${API_BASE}/auth/link-guest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ guestToken: currentToken }),
        });
      } catch {
        // Continue even if linking had no cards
      }
    }

    setToken(data.token);
    if (data.user) {
      setStoredUser(data.user);
    }
    return data;
  },

  register: async (req: { email: string; password: string; name: string }) => {
    const currentToken = getToken();
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req, role: 'CONSUMER' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register');
    }

    const data = await res.json();
    if (currentToken && currentToken !== data.token) {
      try {
        await fetch(`${API_BASE}/auth/link-guest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ guestToken: currentToken }),
        });
      } catch {
        // Continue
      }
    }

    setToken(data.token);
    if (data.user) {
      setStoredUser(data.user);
    }
    return data;
  },

  getMe: async (): Promise<WalletUser> => {
    const user = await fetchWithAuth('/auth/me');
    setStoredUser(user);
    return user;
  },

  logout: () => {
    clearToken();
  },

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
