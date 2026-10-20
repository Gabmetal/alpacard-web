import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  ShieldCheck,
  Zap,
  Server,
  ArrowRight,
  CheckCircle2,
  Gift,
  QrCode,
  Smartphone,
  BookOpen,
  Play,
  RotateCcw,
  Check,
  Layers,
  Heart
} from 'lucide-react';

export function LandingPage() {
  const { t } = useLanguage();

  // Interactive Punch Card Demo Widget State
  const [stamps, setStamps] = useState(7);
  const maxStamps = 10;
  const isRewardReady = stamps >= maxStamps;

  const handleAddStamp = () => {
    if (stamps < maxStamps) {
      setStamps((prev) => prev + 1);
    }
  };

  const handleResetDemo = () => {
    setStamps(0);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard Mascot"
              className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-indigo-500/30 border border-indigo-500/40 group-hover:scale-105 transition"
            />
            <span className="text-xl font-black tracking-tight text-white group-hover:text-indigo-300 transition">Alpacard</span>
            <span className="hidden sm:inline-flex rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              {t.landing.badge}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">{t.nav.features}</a>
            <a href="#visual-tour" className="hover:text-white transition">{t.nav.visualTour}</a>
            <a href="#how-it-works" className="hover:text-white transition">{t.nav.howItWorks}</a>
            <Link to="/demo" className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 font-bold">
              <Play className="h-3.5 w-3.5" />
              {t.nav.liveDemo}
            </Link>
            <Link to="/docs" className="hover:text-white transition">{t.nav.docs}</Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher variant="dark" />

            <Link
              to="/login"
              className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-2.5 py-2 transition"
            >
              {t.nav.signIn}
            </Link>
            <Link
              to="/login?mode=register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95"
            >
              <span>{t.nav.getStarted}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>{t.landing.heroPill}</span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                {t.landing.heroTitlePart1}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  {t.landing.heroTitleGradient}
                </span>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg text-slate-300 mx-auto lg:mx-0">
                {t.landing.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/login?mode=register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition active:scale-95"
                >
                  <Zap className="h-4 w-4" />
                  {t.landing.launchMerchantBtn}
                </Link>
                <Link
                  to="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
                >
                  <Play className="h-4 w-4 text-indigo-400" />
                  {t.landing.tryDemoBtn}
                </Link>
                <Link
                  to="/docs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3.5 text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  <BookOpen className="h-4 w-4" />
                  {t.landing.docsBtn}
                </Link>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-left">
                <div>
                  <h4 className="text-xl font-extrabold text-white">{t.landing.metricOpenSource}</h4>
                  <p className="text-xs text-slate-400">{t.landing.metricOpenSourceSub}</p>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white">{t.landing.metricRam}</h4>
                  <p className="text-xs text-slate-400">{t.landing.metricRamSub}</p>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white">{t.landing.metricAppStore}</h4>
                  <p className="text-xs text-slate-400">{t.landing.metricAppStoreSub}</p>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Interactive Card Widget */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl border border-slate-700/60 bg-slate-800/90 p-6 shadow-2xl backdrop-blur-xl relative">
                <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                  {t.landing.interactiveDemoBadge}
                </div>

                {/* Card Header */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white text-center shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                    {t.landing.demoStoreName}
                  </span>
                  <h3 className="text-xl font-black mt-0.5">{t.landing.demoCardTitle}</h3>
                  <p className="text-xs text-indigo-100 mt-1">{t.landing.demoCardSubtitle}</p>
                </div>

                {/* Stamp Circles */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-3">
                    <span>{t.landing.demoProgressLabel}</span>
                    <span className="text-indigo-400">{stamps} / {maxStamps}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2.5">
                    {Array.from({ length: maxStamps }).map((_, i) => {
                      const isStamped = i < stamps;
                      const isLast = i === maxStamps - 1;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-300 ${
                            isStamped
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-100'
                              : isLast
                              ? 'border-dashed border-amber-500/80 bg-amber-500/10 text-amber-400 animate-pulse'
                              : 'border-slate-700 bg-slate-900/60 text-slate-600'
                          }`}
                        >
                          {isStamped ? (
                            <Check className="h-4 w-4 stroke-[3]" />
                          ) : isLast ? (
                            <Gift className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Box */}
                <div className="mt-6 rounded-2xl bg-slate-900/80 border border-slate-700/50 p-4 text-center">
                  {isRewardReady ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase">
                        <Zap className="h-4 w-4" /> {t.landing.demoRewardReady}
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {t.landing.demoRewardDesc}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {maxStamps - stamps} {t.landing.demoRemainingStamps}
                    </p>
                  )}
                </div>

                {/* Interactive Controls */}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={handleAddStamp}
                    disabled={isRewardReady}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-40 transition active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t.landing.demoSimulateBtn}
                  </button>
                  <button
                    onClick={handleResetDemo}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Reset Demo"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="border-t border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-400">
              {t.landing.featuresPreTitle}
            </h2>
            <h3 className="text-3xl font-black text-white sm:text-4xl">
              {t.landing.featuresTitle}
            </h3>
            <p className="text-sm text-slate-400">
              {t.landing.featuresSubtitle}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat1Title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t.landing.feat1Desc}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat2Title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t.landing.feat2Desc}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
                <Server className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat3Title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t.landing.feat3Desc}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat4Title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t.landing.feat4Desc}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat5Title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t.landing.feat5Desc}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-800/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
                <Heart className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat6Title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                {t.landing.feat6Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Product Showcase */}
      <section id="visual-tour" className="py-20 border-t border-slate-800 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-14">
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-400">
              {t.landing.visualTourPreTitle}
            </h2>
            <h3 className="text-3xl font-black text-white sm:text-4xl">
              {t.landing.visualTourTitle}
            </h3>
            <p className="text-sm text-slate-400">
              {t.landing.visualTourSubtitle}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            {/* Visual 1: Counter Experience */}
            <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div>
                <div className="overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl">
                  <img
                    src="/hero-loyalty.jpg"
                    alt="Café Cashier Scanning Customer Punch Card"
                    className="w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    {t.landing.visual1Badge}
                  </span>
                  <span className="text-xs text-slate-400">{t.landing.visual1Sub}</span>
                </div>
                <h4 className="text-xl font-bold text-white mt-3">
                  {t.landing.visual1Title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {t.landing.visual1Desc}
                </p>
              </div>
            </div>

            {/* Visual 2: Customer PWA & Stamps */}
            <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div>
                <div className="overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl">
                  <img
                    src="/feature-stamps.jpg"
                    alt="Customer Digital Loyalty Card with 10 Stamps and Reward"
                    className="w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/30">
                    {t.landing.visual2Badge}
                  </span>
                  <span className="text-xs text-slate-400">{t.landing.visual2Sub}</span>
                </div>
                <h4 className="text-xl font-bold text-white mt-3">
                  {t.landing.visual2Title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {t.landing.visual2Desc}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition active:scale-95"
            >
              <Play className="h-4 w-4" />
              {t.landing.visualCtaBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-400">{t.landing.howPreTitle}</h2>
            <h3 className="text-3xl font-black text-white">{t.landing.howTitle}</h3>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-8 text-center relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-black text-white shadow-lg shadow-indigo-600/30 mb-5">
                1
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.step1Title}</h4>
              <p className="mt-2 text-xs text-slate-400">
                {t.landing.step1Desc}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-8 text-center relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 font-black text-white shadow-lg shadow-violet-600/30 mb-5">
                2
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.step2Title}</h4>
              <p className="mt-2 text-xs text-slate-400">
                {t.landing.step2Desc}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-8 text-center relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 font-black text-white shadow-lg shadow-purple-600/30 mb-5">
                3
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.step3Title}</h4>
              <p className="mt-2 text-xs text-slate-400">
                {t.landing.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/alpacard-logo.jpg" alt="Alpacard" className="h-8 w-8 rounded-lg object-cover border border-slate-800" />
            <span className="text-base font-black text-white">Alpacard</span>
            <span>&bull;</span>
            <span>Digital Loyalty Platform</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link to="/docs" className="hover:text-white transition">{t.nav.docs}</Link>
            <Link to="/demo" className="hover:text-white transition">{t.nav.liveDemo}</Link>
            <a href="https://github.com/Gabmetal/alpacard-web" target="_blank" rel="noreferrer" className="hover:text-white transition">
              GitHub Repository
            </a>
            <LanguageSwitcher variant="dark" />
          </div>

          <div className="text-slate-500">
            {t.landing.footerDesc}
          </div>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;