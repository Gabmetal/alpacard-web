import { useState, useEffect, useRef } from 'react';
import { Play, X, Volume2, Download, CheckCircle2 } from 'lucide-react';
import { TUTORIAL_VIDEOS } from '../config/videoConfig';

interface VideoTutorialModalProps {
  open: boolean;
  onClose: () => void;
  defaultLang: 'es' | 'en';
}

export function VideoTutorialModal({ open, onClose, defaultLang }: VideoTutorialModalProps) {
  const [videoLang, setVideoLang] = useState<'es' | 'en'>(defaultLang);
  const [currentTime, setCurrentTime] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoLang(defaultLang);
  }, [defaultLang]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeVideo = TUTORIAL_VIDEOS[videoLang];
  const isEs = videoLang === 'es';

  const handleLanguageChange = (newLang: 'es' | 'en') => {
    if (newLang === videoLang) return;
    const preservedTime = videoRef.current?.currentTime || 0;
    const wasPlaying = videoRef.current && !videoRef.current.paused;
    setVideoLang(newLang);

    // After state update, preserve playback position
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = preservedTime;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    }, 50);
  };

  const handleSeekChapter = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleCopyStreamLink = () => {
    navigator.clipboard.writeText(activeVideo.streamUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-[#1C1613] shadow-2xl border border-stone-800 text-white flex flex-col max-h-[92vh]">
        {/* Enterprise Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#261E1A] px-5 sm:px-6 py-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-300/30 text-amber-300 shrink-0">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                {activeVideo.title}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {activeVideo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {/* Audio Language Switcher */}
            <div className="inline-flex items-center rounded-xl bg-stone-900/90 p-1 border border-stone-700/80 text-xs font-semibold">
              <Volume2 className="h-3.5 w-3.5 text-amber-300 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
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
                onClick={() => handleLanguageChange('en')}
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

        {/* Video Player Display Container (High Performance Native HTML5 Player) */}
        <div className="bg-black aspect-video w-full relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            key={activeVideo.streamUrl}
            src={activeVideo.streamUrl}
            controls
            playsInline
            preload="metadata"
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            className="w-full h-full object-contain bg-black"
          >
            Tu navegador no soporta reproducción de video HTML5.
          </video>
        </div>

        {/* Enterprise Interactive Chapters Bar */}
        <div className="px-5 py-3.5 bg-[#211A16] border-t border-stone-800 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-max">
            <span className="font-bold text-amber-300 text-xs mr-1 uppercase tracking-wider">
              {isEs ? 'Capítulos:' : 'Chapters:'}
            </span>
            {activeVideo.chapters.map((ch, idx) => {
              const nextCh = activeVideo.chapters[idx + 1];
              const isActive =
                currentTime >= ch.time && (!nextCh || currentTime < nextCh.time);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSeekChapter(ch.time)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-300/40 font-bold'
                      : 'bg-stone-800/60 text-stone-300 border border-stone-700/50 hover:bg-stone-700 hover:text-white'
                  }`}
                >
                  <span className="opacity-70">{idx + 1}.</span>
                  <span>{ch.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enterprise Footer with Direct Access */}
        <div className="px-5 py-3 bg-[#1C1613] border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-stone-300">
              {isEs
                ? 'Streaming HD • 1080p 60fps'
                : 'HD Streaming • 1080p 60fps'}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={handleCopyStreamLink}
              className="inline-flex items-center gap-1 text-stone-300 hover:text-white transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">
                    {isEs ? 'Enlace copiado' : 'Link copied'}
                  </span>
                </>
              ) : (
                <span>{isEs ? 'Copiar enlace directo' : 'Copy direct link'}</span>
              )}
            </button>

            <a
              href={activeVideo.downloadUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-200 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isEs ? 'Descargar Video' : 'Download Video'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
