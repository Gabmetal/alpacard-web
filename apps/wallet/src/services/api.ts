import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const API_BASE = '/api/v1';

const TOKEN_KEY = 'alpacard_wallet_token';
const USER_KEY = 'alpacard_wallet_user';
const CARDS_CACHE_KEY = 'alpacard_wallet_cards_cache';

export interface WalletUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isAnonymous: boolean;
  emailVerified?: boolean;
}

export function getToken(): string | null {
  // Check cookie first (or localStorage fallback)
  const cookieToken = getCookie(TOKEN_KEY);
  if (cookieToken) {
    // Keep localStorage in sync
    try {
      if (localStorage.getItem(TOKEN_KEY) !== cookieToken) {
        localStorage.setItem(TOKEN_KEY, cookieToken);
      }
    } catch {
      // Ignore localStorage access errors
    }
    return cookieToken;
  }

  try {
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) {
      // Sync back to cookie so future requests & reloads persist
      setCookie(TOKEN_KEY, localToken);
      return localToken;
    }
  } catch {
    // Ignore localStorage access errors
  }

  return null;
}

export function setToken(token: string) {
  setCookie(TOKEN_KEY, token);
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore
  }
}

export function getStoredUser(): WalletUser | null {
  let raw = getCookie(USER_KEY);
  if (!raw) {
    try {
      raw = localStorage.getItem(USER_KEY);
      if (raw) {
        setCookie(USER_KEY, raw);
      }
    } catch {
      // Ignore
    }
  }

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function setStoredUser(user: WalletUser | null) {
  if (user) {
    const str = JSON.stringify(user);
    setCookie(USER_KEY, str);
    try {
      localStorage.setItem(USER_KEY, str);
    } catch {
      // Ignore
    }
  } else {
    removeCookie(USER_KEY);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
  }
}

export function clearToken() {
  removeCookie(TOKEN_KEY);
  removeCookie(USER_KEY);
  removeCookie(CARDS_CACHE_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CARDS_CACHE_KEY);
  } catch {
    // Ignore
  }
}

// Stores cards in cookies & localStorage to preserve cards across page reloads
export function getCachedCards<T>(): T[] | null {
  let raw = getCookie(CARDS_CACHE_KEY);
  if (!raw) {
    try {
      raw = localStorage.getItem(CARDS_CACHE_KEY);
      if (raw) {
        setCookie(CARDS_CACHE_KEY, raw);
      }
    } catch {
      // Ignore
    }
  }

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function setCachedCards<T>(cards: T[]) {
  try {
    const str = JSON.stringify(cards);
    setCookie(CARDS_CACHE_KEY, str);
    localStorage.setItem(CARDS_CACHE_KEY, str);
  } catch {
    // If cards payload is large for cookie limit, at least localStorage stores it
    try {
      localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(cards));
    } catch {
      // Ignore
    }
  }
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

  updateProfile: async (data: { name: string }): Promise<WalletUser> => {
    const user = await fetchWithAuth('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setStoredUser(user);
    return user;
  },

  deleteAccount: async (): Promise<void> => {
    await fetchWithAuth('/auth/account', {
      method: 'DELETE',
    });
    clearToken();
  },

  resendVerification: async (email?: string): Promise<{ success: boolean; message: string }> => {
    return fetchWithAuth('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
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
