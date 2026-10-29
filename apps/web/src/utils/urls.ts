export function isMerchantHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.startsWith('merchant') || host.includes('dev-merchant') || host.includes('merchant.');
}

export function isDemoHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.startsWith('demo') || host.includes('dev-demo') || host.includes('demo.');
}

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
