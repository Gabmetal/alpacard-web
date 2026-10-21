import { useState, useEffect } from 'react';
import { Play, X, Volume2, Download } from 'lucide-react';
import { TUTORIAL_VIDEOS } from '../config/videoConfig';

interface VideoTutorialModalProps {
  open: boolean;
  onClose: () => void;
  defaultLang: 'es' | 'en';
}

export function VideoTutorialModal({ open, onClose, defaultLang }: VideoTutorialModalProps) {
  const [videoLang, setVideoLang] = useState<'es' | 'en'>(defaultLang);

  useEffect(() => {
    setVideoLang(defaultLang);
  }, [defaultLang]);

  if (!open) return null;

  const activeVideo = TUTORIAL_VIDEOS[videoLang];
  const isEs = videoLang === 'es';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-[#1C1613] shadow-2xl border border-stone-800 text-white flex flex-col">
        {/* Enterprise Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#261E1A] px-5 sm:px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-300/30 text-amber-300 shrink-0">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                {isEs ? 'Demostración de la Plataforma Alpacard' : 'Alpacard Platform Walkthrough'}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isEs
                  ? 'Modo Comercio y Billetera Digital de Clientes'
                  : 'Merchant Console & Customer Digital Wallet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Audio Language Switcher Pill */}
            <div className="inline-flex items-center rounded-xl bg-stone-900/80 p-1 border border-stone-700/80 text-xs font-semibold">
              <Volume2 className="h-3.5 w-3.5 text-amber-300 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => setVideoLang('es')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  isEs
                    ? 'bg-[#D4A373] text-[#1C1613] font-bold shadow-2xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setVideoLang('en')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  !isEs
                    ? 'bg-[#D4A373] text-[#1C1613] font-bold shadow-2xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-stone-800/80 p-2 text-stone-300 hover:bg-stone-700 hover:text-white transition"
              aria-label="Cerrar reproductor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="bg-black aspect-video w-full relative flex items-center justify-center">
          <video
            key={activeVideo.url}
            src={activeVideo.url}
            controls
            autoPlay
            playsInline
            preload="auto"
            poster="/hero-loyalty.jpg"
            className="w-full h-full object-contain"
          >
            Tu navegador no soporta la reproducción de video HTML5.
          </video>
        </div>

        {/* Enterprise Footer with Chapters & Direct Download */}
        <div className="px-5 py-4 bg-[#261E1A] border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="font-semibold text-amber-200">
              {isEs ? 'Capítulos:' : 'Chapters:'}
            </span>
            <span>1. {isEs ? 'Marca y Diseño' : 'Store Branding'}</span>
            <span className="text-stone-600">•</span>
            <span>2. {isEs ? 'Mostrador y Menú QR' : 'QR Menus & Stand'}</span>
            <span className="text-stone-600">•</span>
            <span>3. {isEs ? 'Billetera Móvil PWA' : 'Mobile PWA Wallet'}</span>
            <span className="text-stone-600">•</span>
            <span>4. {isEs ? 'Escaneo de Sellos' : 'Camera Stamping'}</span>
          </div>

          <a
            href={activeVideo.url}
            download={`alpacard-tutorial-${videoLang}.mp4`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-200 hover:underline transition ml-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>
              {isEs ? 'Descargar Video HD (1080p)' : 'Download HD Video (1080p)'}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
