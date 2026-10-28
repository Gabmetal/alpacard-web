export function getWalletUrl(path = ''): string {
  if (typeof window === 'undefined') return path;
  const host = window.location.hostname;
  if (host.startsWith('dev') || host.includes('dev.alpacard')) {
    return `https://dev-wallet.alpacard.app${path}`;
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://localhost:5174${path}`;
  }
  return `https://wallet.alpacard.app${path}`;
}

export function getDemoUrl(): string {
  if (typeof window === 'undefined') return '/';
  const host = window.location.hostname;
  if (host.startsWith('dev') || host.includes('dev.alpacard')) {
    return 'https://dev-demo.alpacard.app';
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return '/demo';
  }
  return 'https://demo.alpacard.app';
}

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
