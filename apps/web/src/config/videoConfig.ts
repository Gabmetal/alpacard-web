/**
 * Alpacard Video Tutorial Configuration
 * Direct high-speed CDN streaming with zero host server load.
 */

export interface VideoChapter {
  title: string;
  time: number; // in seconds
}

export interface TutorialVideoConfig {
  streamUrl: string;
  downloadUrl: string;
  title: string;
  subtitle: string;
  chapters: VideoChapter[];
}

export const TUTORIAL_VIDEOS: Record<'es' | 'en', TutorialVideoConfig> = {
  es: {
    streamUrl: 'https://media.gabo.lat/alpacard-tutorial-es.mp4',
    downloadUrl: 'https://media.gabo.lat/alpacard-tutorial-es.mp4',
    title: 'Demostración de la Plataforma Alpacard',
    subtitle: 'Modo Comercio y Billetera Digital de Clientes',
    chapters: [
      { title: 'Vista General', time: 0 },
      { title: 'Marca y Diseño', time: 18 },
      { title: 'Menú y Mostrador', time: 34 },
      { title: 'Billetera Móvil PWA', time: 49 },
      { title: 'Escaneo y Sellos', time: 64 },
      { title: 'Comunidad MIT', time: 80 },
    ],
  },
  en: {
    streamUrl: 'https://media.gabo.lat/alpacard-tutorial-en.mp4',
    downloadUrl: 'https://media.gabo.lat/alpacard-tutorial-en.mp4',
    title: 'Alpacard Platform Walkthrough',
    subtitle: 'Merchant Console & Customer Digital Wallet',
    chapters: [
      { title: 'Overview', time: 0 },
      { title: 'Store Branding', time: 16 },
      { title: 'Menus & Counter Stand', time: 30 },
      { title: 'Customer Wallet', time: 45 },
      { title: 'Camera Stamping', time: 60 },
      { title: 'Open-Source Community', time: 76 },
    ],
  },
};
