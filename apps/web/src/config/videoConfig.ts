/**
 * Alpacard Video Tutorial Configuration
 * High-performance global CDN streaming with zero host server load.
 */

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const TUTORIAL_VIDEOS: Record<'es' | 'en', { url: string; title: string }> = {
  es: {
    url:
      metaEnv.VITE_TUTORIAL_VIDEO_ES_URL ||
      'https://github.com/Gabmetal/alpacard-web/releases/download/v0.1.0-assets/alpacard-tutorial-es.mp4',
    title: 'Tutorial Alpacard (Español - 1080p)',
  },
  en: {
    url:
      metaEnv.VITE_TUTORIAL_VIDEO_EN_URL ||
      'https://github.com/Gabmetal/alpacard-web/releases/download/v0.1.0-assets/alpacard-tutorial-en.mp4',
    title: 'Alpacard Walkthrough (English - 1080p)',
  },
};
