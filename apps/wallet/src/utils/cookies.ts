// Cookie and LocalStorage persistence helpers for Alpacard Wallet
// Storing wallet credentials and card cache in both cookies (with 1-year persistence)
// and localStorage ensures cards are never lost across page reloads, browser restarts,
// or WebView storage resets before an account is formally registered.

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + date.toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  // SameSite=Lax and Path=/ so cookie is shared across /wallet, /card/:id, /claim/:id, etc.
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax${secure}`;
}

export function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secure}`;
}
