import { useState, useEffect } from 'react';
import { Play, X, Volume2, Cloud, Link2, Check, RotateCcw } from 'lucide-react';
import {
  getSavedVideoUrl,
  setSavedVideoUrl,
  resolveVideoEmbed,
  DEFAULT_EXTERNAL_VIDEOS,
} from '../config/videoConfig';

interface VideoTutorialModalProps {
  open: boolean;
  onClose: () => void;
  defaultLang: 'es' | 'en';
}

export function VideoTutorialModal({ open, onClose, defaultLang }: VideoTutorialModalProps) {
  const [videoLang, setVideoLang] = useState<'es' | 'en'>(defaultLang);
  const [showDriveConfig, setShowDriveConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string>(() => getSavedVideoUrl(defaultLang));

  useEffect(() => {
    setVideoLang(defaultLang);
  }, [defaultLang]);

  useEffect(() => {
    const current = getSavedVideoUrl(videoLang);
    setActiveUrl(current);
    setCustomUrlInput(current === DEFAULT_EXTERNAL_VIDEOS[videoLang] ? '' : current);
  }, [videoLang, open]);

  if (!open) return null;

  const resolved = resolveVideoEmbed(activeUrl);

  const handleSaveDriveLink = () => {
    setSavedVideoUrl(videoLang, customUrlInput);
    const updated = getSavedVideoUrl(videoLang);
    setActiveUrl(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetDefault = () => {
    setSavedVideoUrl(videoLang, '');
    setCustomUrlInput('');
    setActiveUrl(DEFAULT_EXTERNAL_VIDEOS[videoLang]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2C221E] px-5 sm:px-6 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <Play className="h-4 w-4 text-amber-300 fill-current shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">
                {videoLang === 'es'
                  ? 'Tutorial con Voz IA (ES): Modo Comercio y Billetera de Clientes'
                  : 'AI Voice-Over Tutorial (EN): Merchant & Consumer Walkthrough'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-300 mt-0.5">
                <Cloud className="h-3 w-3 text-emerald-400" />
                <span>
                  {resolved.providerLabel} •{' '}
                  {videoLang === 'es'
                    ? '0 MB en servidor k3s (Streaming Externo)'
                    : '0 MB on k3s server (External Cloud Stream)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* ES / EN Voice Switcher */}
            <div className="inline-flex items-center rounded-xl bg-white/10 p-0.5 border border-white/15 text-xs font-semibold">
              <Volume2 className="h-3.5 w-3.5 text-amber-300 ml-2 mr-1.5" />
              <button
                type="button"
                onClick={() => setVideoLang('es')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  videoLang === 'es'
                    ? 'bg-[#D4A373] text-[#1C1613] font-bold shadow-2xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                ES Voz
              </button>
              <button
                type="button"
                onClick={() => setVideoLang('en')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  videoLang === 'en'
                    ? 'bg-[#D4A373] text-[#1C1613] font-bold shadow-2xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                EN Voice
              </button>
            </div>

            {/* Google Drive Link Config Toggle */}
            <button
              type="button"
              onClick={() => setShowDriveConfig(!showDriveConfig)}
              title={
                videoLang === 'es'
                  ? 'Vincular enlace de Google Drive'
                  : 'Connect Google Drive Link'
              }
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                showDriveConfig
                  ? 'border-amber-300/60 bg-amber-400/20 text-amber-200'
                  : 'border-white/15 bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Google Drive</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-full bg-white/15 p-1.5 text-white/80 hover:bg-white/25 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Optional Google Drive Link Configuration Bar */}
        {showDriveConfig && (
          <div className="bg-[#F5EFE6] border-b border-[#E6D9C6] px-5 py-3 text-xs text-stone-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-[#3D2B1F]">
                {videoLang === 'es'
                  ? `Enlace de Google Drive o CDN externo (${videoLang.toUpperCase()}):`
                  : `Google Drive Share Link or External CDN URL (${videoLang.toUpperCase()}):`}
              </span>
              <span className="text-[11px] text-stone-600">
                {videoLang === 'es'
                  ? 'Pega cualquier link de Google Drive (ej. https://drive.google.com/file/d/.../view) y se incrustará automáticamente.'
                  : 'Paste any Google Drive share link (e.g. https://drive.google.com/file/d/.../view) to auto-embed.'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#4A3525] focus:outline-hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDriveLink}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2C1F16] transition"
                >
                  {savedNotice ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  <span>
                    {savedNotice
                      ? videoLang === 'es'
                        ? '¡Guardado!'
                        : 'Saved!'
                      : videoLang === 'es'
                      ? 'Incrustar Drive'
                      : 'Embed Drive'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  title="Restore default cloud stream"
                  className="inline-flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{videoLang === 'es' ? ' Por defecto' : 'Default CDN'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player Area (Google Drive iframe OR External Cloud HTML5 video) */}
        <div className="bg-black aspect-video w-full relative">
          {resolved.type === 'gdrive-iframe' ? (
            <iframe
              key={resolved.src}
              src={resolved.src}
              title="Alpacard Google Drive Video Tutorial"
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              key={resolved.src}
              src={resolved.src}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Footer Info & External Download */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-semibold text-stone-800">
              {videoLang === 'es' ? 'Capítulos:' : 'Chapters:'}
            </span>
            <span>1. {videoLang === 'es' ? 'Personalización' : 'Store Branding'}</span>
            <span>•</span>
            <span>2. {videoLang === 'es' ? 'Menús y Mostrador' : 'Menus & Stand'}</span>
            <span>•</span>
            <span>3. {videoLang === 'es' ? 'Billetera Móvil' : 'Wallet PWA'}</span>
            <span>•</span>
            <span>4. {videoLang === 'es' ? 'Escaneo Cámara' : 'Camera Stamp'}</span>
          </div>
          <a
            href={resolved.downloadUrl}
            target="_blank"
            rel="noreferrer"
            download={`alpacard-tutorial-${videoLang}.mp4`}
            className="font-bold text-[#4A3525] hover:underline"
          >
            {videoLang === 'es'
              ? 'Abrir / Descargar desde Cloud Externo ↓'
              : 'Open / Download from External Cloud ↓'}
          </a>
        </div>
      </div>
    </div>
  );
}
