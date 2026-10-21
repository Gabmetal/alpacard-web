/**
 * Alpacard Video Tutorial Configuration
 * Google Drive native streaming with zero host server load.
 */

export interface TutorialVideoConfig {
  driveId: string;
  previewUrl: string;
  viewUrl: string;
  downloadUrl: string;
  title: string;
}

export const TUTORIAL_VIDEOS: Record<'es' | 'en', TutorialVideoConfig> = {
  es: {
    driveId: '1IDkZxNoGlb0M58-paz1mISXQMRzbAbmV',
    previewUrl: 'https://drive.google.com/file/d/1IDkZxNoGlb0M58-paz1mISXQMRzbAbmV/preview',
    viewUrl: 'https://drive.google.com/file/d/1IDkZxNoGlb0M58-paz1mISXQMRzbAbmV/view?usp=sharing',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1IDkZxNoGlb0M58-paz1mISXQMRzbAbmV',
    title: 'Tutorial Alpacard (Español)',
  },
  en: {
    driveId: '1JcFBTG3aMp17qiknnO_USik5ddH4AsIm',
    previewUrl: 'https://drive.google.com/file/d/1JcFBTG3aMp17qiknnO_USik5ddH4AsIm/preview',
    viewUrl: 'https://drive.google.com/file/d/1JcFBTG3aMp17qiknnO_USik5ddH4AsIm/view?usp=sharing',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1JcFBTG3aMp17qiknnO_USik5ddH4AsIm',
    title: 'Alpacard Walkthrough (English)',
  },
};
