export function getMerchantUrl(path = ''): string {
  if (typeof window === 'undefined') return path;
  const host = window.location.hostname;
  if (host.startsWith('dev') || host.includes('dev.alpacard')) {
    return `https://dev-merchant.alpacard.app${path}`;
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://localhost:5173${path}`;
  }
  return `https://merchant.alpacard.app${path}`;
}
