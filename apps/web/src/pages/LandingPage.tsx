import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  ShieldCheck,
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
  Heart,
  Menu,
  X,
  Coffee,
} from 'lucide-react';

export function LandingPage() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-[#4A3525] selection:text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="h-9 w-9 rounded-lg object-cover border border-stone-200 shadow-2xs"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
              Alpacard
            </span>
            <span className="hidden lg:inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200">
              {t.landing.badge}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition">
              {t.nav.features}
            </a>
            <a href="#visual-tour" className="hover:text-stone-900 transition">
              {t.nav.visualTour}
            </a>
            <a href="#how-it-works" className="hover:text-stone-900 transition">
              {t.nav.howItWorks}
            </a>
            <Link
              to="/demo"
              className="text-[#5C4028] hover:text-[#3D2B1F] transition flex items-center gap-1.5 font-semibold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {t.nav.liveDemo}
            </Link>
            <Link to="/docs" className="hover:text-stone-900 transition">
              {t.nav.docs}
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <LanguageSwitcher variant="light" />

            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100 transition"
            >
              {t.nav.signIn}
            </Link>
            <Link
              to="/login?mode=register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D2B1F] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition active:scale-[0.99]"
            >
              <span>{t.nav.getStarted}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex sm:hidden items-center gap-2">
            <LanguageSwitcher variant="light" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-1 text-sm font-medium text-stone-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-stone-100"
              >
                {t.nav.features}
              </a>
              <a
                href="#visual-tour"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-stone-100"
              >
                {t.nav.visualTour}
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-stone-100"
              >
                {t.nav.howItWorks}
              </a>
              <Link
                to="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 font-semibold text-[#5C4028] hover:bg-stone-100 flex items-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {t.nav.liveDemo}
              </Link>
              <Link
                to="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-stone-100"
              >
                {t.nav.docs}
              </Link>
            </div>

            <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full rounded-lg border border-stone-300 bg-white py-2.5 text-center text-xs font-semibold text-stone-800 hover:bg-stone-50"
              >
                {t.nav.signIn}
              </Link>
              <Link
                to="/login?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3D2B1F] py-2.5 text-center text-xs font-semibold text-white hover:bg-[#2C1F16]"
              >
                <span>{t.nav.getStarted}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 py-1 text-xs font-medium text-stone-700 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#5C4028]" />
                <span>{t.landing.heroPill}</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl lg:text-[54px] leading-[1.12]">
                {t.landing.heroTitlePart1}{' '}
                <span className="text-[#5C4028] underline decoration-stone-300 decoration-2 underline-offset-8">
                  {t.landing.heroTitleGradient}
                </span>
              </h1>

              <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-stone-600 mx-auto lg:mx-0 leading-relaxed">
                {t.landing.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/login?mode=register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D2B1F] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2C1F16] transition active:scale-[0.99]"
                >
                  <Coffee className="h-4 w-4" />
                  {t.landing.launchMerchantBtn}
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition shadow-2xs"
                >
                  <Play className="h-4 w-4 text-[#5C4028]" />
                  {t.landing.tryDemoBtn}
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-3.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 transition"
                >
                  <BookOpen className="h-4 w-4" />
                  {t.landing.docsBtn}
                </Link>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200 text-center sm:text-left">
                <div className="rounded-xl bg-white p-3.5 border border-stone-200/70 sm:bg-transparent sm:p-0 sm:border-0">
                  <h4 className="text-lg sm:text-xl font-bold text-stone-900">
                    {t.landing.metricOpenSource}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{t.landing.metricOpenSourceSub}</p>
                </div>
                <div className="rounded-xl bg-white p-3.5 border border-stone-200/70 sm:bg-transparent sm:p-0 sm:border-0">
                  <h4 className="text-lg sm:text-xl font-bold text-stone-900">
                    {t.landing.metricRam}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{t.landing.metricRamSub}</p>
                </div>
                <div className="rounded-xl bg-white p-3.5 border border-stone-200/70 sm:bg-transparent sm:p-0 sm:border-0">
                  <h4 className="text-lg sm:text-xl font-bold text-stone-900">
                    {t.landing.metricAppStore}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">{t.landing.metricAppStoreSub}</p>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Interactive Card Widget */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-md relative">
                <div className="absolute -top-3 right-5 rounded-full bg-[#F5EFE6] border border-[#DFD3C3] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C4028]">
                  {t.landing.interactiveDemoBadge}
                </div>

                {/* Card Header */}
                <div className="rounded-xl bg-[#3D2B1F] p-5 text-white text-center shadow-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                    {t.landing.demoStoreName}
                  </span>
                  <h3 className="text-xl font-bold mt-0.5">{t.landing.demoCardTitle}</h3>
                  <p className="text-xs text-stone-200 mt-1">{t.landing.demoCardSubtitle}</p>
                </div>

                {/* Stamp Circles */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-3">
                    <span>{t.landing.demoProgressLabel}</span>
                    <span className="text-[#5C4028] font-bold">
                      {stamps} / {maxStamps}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                    {Array.from({ length: maxStamps }).map((_, i) => {
                      const isStamped = i < stamps;
                      const isLast = i === maxStamps - 1;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-200 ${
                            isStamped
                              ? 'border-[#4A3525] bg-[#4A3525] text-white shadow-2xs'
                              : isLast
                              ? 'border-dashed border-amber-700/60 bg-amber-50/70 text-amber-800'
                              : 'border-stone-200 bg-stone-50 text-stone-400'
                          }`}
                        >
                          {isStamped ? (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          ) : isLast ? (
                            <Gift className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-semibold">{i + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Box */}
                <div className="mt-5 rounded-xl bg-stone-50 border border-stone-200/80 p-3.5 text-center">
                  {isRewardReady ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />{' '}
                        {t.landing.demoRewardReady}
                      </div>
                      <p className="text-[11px] text-stone-600">{t.landing.demoRewardDesc}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600">
                      {maxStamps - stamps} {t.landing.demoRemainingStamps}
                    </p>
                  )}
                </div>

                {/* Interactive Controls */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleAddStamp}
                    disabled={isRewardReady}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-40 transition active:scale-[0.99]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t.landing.demoSimulateBtn}
                  </button>
                  <button
                    onClick={handleResetDemo}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition"
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
      <section id="features" className="border-t border-stone-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#785233]">
              {t.landing.featuresPreTitle}
            </h2>
            <h3 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">
              {t.landing.featuresTitle}
            </h3>
            <p className="text-sm text-stone-600">{t.landing.featuresSubtitle}</p>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: t.landing.feat1Title,
                desc: t.landing.feat1Desc,
              },
              {
                icon: ShieldCheck,
                title: t.landing.feat2Title,
                desc: t.landing.feat2Desc,
              },
              {
                icon: Server,
                title: t.landing.feat3Title,
                desc: t.landing.feat3Desc,
              },
              {
                icon: QrCode,
                title: t.landing.feat4Title,
                desc: t.landing.feat4Desc,
              },
              {
                icon: Layers,
                title: t.landing.feat5Title,
                desc: t.landing.feat5Desc,
              },
              {
                icon: Heart,
                title: t.landing.feat6Title,
                desc: t.landing.feat6Desc,
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 bg-[#FAF8F5]/60 p-6 transition hover:border-stone-300 hover:bg-white hover:shadow-xs"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#5C4028] border border-[#E6D9C6] mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900">{feat.title}</h4>
                  <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visual Product Showcase */}
      <section id="visual-tour" className="py-16 sm:py-20 border-t border-stone-200 bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#785233]">
              {t.landing.visualTourPreTitle}
            </h2>
            <h3 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">
              {t.landing.visualTourTitle}
            </h3>
            <p className="text-sm text-stone-600">{t.landing.visualTourSubtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-stretch">
            {/* Visual 1: Counter Experience */}
            <div className="group rounded-2xl border border-stone-200 bg-white p-5 sm:p-7 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <img
                    src="/hero-loyalty.jpg"
                    alt="Café Cashier Scanning Customer Punch Card"
                    className="w-full h-56 sm:h-72 object-cover group-hover:scale-102 transition duration-500"
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800 border border-stone-200">
                    {t.landing.visual1Badge}
                  </span>
                  <span className="text-xs text-stone-500">{t.landing.visual1Sub}</span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-stone-900 mt-3">
                  {t.landing.visual1Title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {t.landing.visual1Desc}
                </p>
              </div>
            </div>

            {/* Visual 2: Customer PWA & Stamps */}
            <div className="group rounded-2xl border border-stone-200 bg-white p-5 sm:p-7 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <img
                    src="/feature-stamps.jpg"
                    alt="Customer Digital Loyalty Card with 10 Stamps and Reward"
                    className="w-full h-56 sm:h-72 object-cover group-hover:scale-102 transition duration-500"
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#F5EFE6] px-2.5 py-1 text-xs font-semibold text-[#5C4028] border border-[#E6D9C6]">
                    {t.landing.visual2Badge}
                  </span>
                  <span className="text-xs text-stone-500">{t.landing.visual2Sub}</span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-stone-900 mt-3">
                  {t.landing.visual2Title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {t.landing.visual2Desc}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#3D2B1F] px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-[#2C1F16] transition active:scale-[0.99]"
            >
              <Play className="h-4 w-4" />
              {t.landing.visualCtaBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-t border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#785233]">
              {t.landing.howPreTitle}
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {t.landing.howTitle}
            </h3>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 md:grid-cols-3">
            {[
              { num: '1', title: t.landing.step1Title, desc: t.landing.step1Desc },
              { num: '2', title: t.landing.step2Title, desc: t.landing.step2Desc },
              { num: '3', title: t.landing.step3Title, desc: t.landing.step3Desc },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-6 sm:p-8 text-center"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D2B1F] font-bold text-white mb-4">
                  {step.num}
                </div>
                <h4 className="text-base font-bold text-stone-900">{step.title}</h4>
                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-[#F3EFEA] py-10 text-stone-600 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="h-7 w-7 rounded-md object-cover border border-stone-300"
            />
            <span className="text-sm font-bold text-stone-900">Alpacard</span>
            <span>&bull;</span>
            <span>Digital Loyalty Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
            <Link to="/docs" className="hover:text-stone-900 transition">
              {t.nav.docs}
            </Link>
            <Link to="/demo" className="hover:text-stone-900 transition">
              {t.nav.liveDemo}
            </Link>
            <a
              href="https://github.com/Gabmetal/alpacard-web"
              target="_blank"
              rel="noreferrer"
              className="hover:text-stone-900 transition"
            >
              GitHub
            </a>
            <LanguageSwitcher variant="light" />
          </div>

          <div className="text-stone-500 text-center sm:text-right">{t.landing.footerDesc}</div>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
