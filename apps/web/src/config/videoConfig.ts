/**
 * External Tutorial Video Configuration (Zero k3s Storage & Bandwidth)
 *
 * All tutorial videos are served from external cloud storage / CDN so the k3s
 * container image and cluster network consume 0 MB of video storage or bandwidth.
 *
 * Google Drive Integration:
 * - Paste a Google Drive share link (e.g. `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`)
 *   or set `VITE_TUTORIAL_VIDEO_ES_URL` / `VITE_TUTORIAL_VIDEO_EN_URL`.
 * - The helper `resolveVideoEmbed()` automatically converts Google Drive `/view` links
 *   into embeddable `/preview` player URLs and direct download links.
 */

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const DEFAULT_EXTERNAL_VIDEOS: Record<'es' | 'en', string> = {
  es:
    metaEnv.VITE_TUTORIAL_VIDEO_ES_URL ||
    'https://github.com/Gabmetal/alpacard-web/releases/download/v0.1.0-assets/alpacard-tutorial-es.mp4',
  en:
    metaEnv.VITE_TUTORIAL_VIDEO_EN_URL ||
    'https://github.com/Gabmetal/alpacard-web/releases/download/v0.1.0-assets/alpacard-tutorial-en.mp4',
};

const STORAGE_KEY_PREFIX = 'alpacard_tutorial_drive_url_';

export function getSavedVideoUrl(lang: 'es' | 'en'): string {
  try {
    const custom = localStorage.getItem(`${STORAGE_KEY_PREFIX}${lang}`);
    if (custom && custom.trim()) {
      return custom.trim();
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_EXTERNAL_VIDEOS[lang];
}

export function setSavedVideoUrl(lang: 'es' | 'en', url: string): void {
  try {
    if (!url.trim()) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${lang}`);
    } else {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${lang}`, url.trim());
    }
  } catch {
    // Ignore storage errors
  }
}

export interface ResolvedVideoSource {
  type: 'gdrive-iframe' | 'direct-video';
  src: string;
  downloadUrl: string;
  providerLabel: string;
}

/**
 * Detects Google Drive links (`drive.google.com/file/d/<ID>/...` or `id=<ID>`)
 * and converts them into Google Drive's native `/preview` iframe player,
 * or falls back to direct HTML5 `<video>` streaming for external CDN MP4 URLs.
 */
export function resolveVideoEmbed(rawUrl: string): ResolvedVideoSource {
  const url = rawUrl.trim();

  // Match Google Drive /file/d/<FILE_ID> or ?id=<FILE_ID>
  const fileDMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const queryIdMatch = url.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  const driveId = fileDMatch?.[1] || queryIdMatch?.[1];

  if (driveId) {
    return {
      type: 'gdrive-iframe',
      src: `https://drive.google.com/file/d/${driveId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
      providerLabel: 'Google Drive Embed',
    };
  }

  return {
    type: 'direct-video',
    src: url,
    downloadUrl: url,
    providerLabel: url.includes('github.com') ? 'GitHub Releases Cloud CDN' : 'External Cloud URL',
  };
}
