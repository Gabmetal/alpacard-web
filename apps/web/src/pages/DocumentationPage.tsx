import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  BookOpen,
  ArrowLeft,
  Server,
  ShieldCheck,
  Terminal,
  Layers,
  Database,
  Copy,
  Check,
} from 'lucide-react';

export function DocumentationPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'getting-started' | 'architecture' | 'security' | 'cloud' | 'api'
  >('getting-started');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isEs = language === 'es';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col selection:bg-[#4A3525] selection:text-white">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">{t.common.back}</span>
            </Link>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-lg font-bold text-stone-900 truncate">
                {isEs ? 'Documentación Alpacard' : 'Alpacard Docs'}
              </span>
              <span className="rounded bg-[#F5EFE6] px-2 py-0.5 text-[10px] font-semibold text-[#5C4028] border border-[#E6D9C6] shrink-0">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher variant="light" />
            <Link
              to="/demo"
              className="hidden sm:inline-flex rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              {t.nav.liveDemo}
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-[#3D2B1F] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2C1F16] shadow-2xs"
            >
              {t.nav.console}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-8">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <nav className="space-y-1">
            {[
              {
                id: 'getting-started' as const,
                icon: BookOpen,
                label: isEs ? 'Primeros Pasos' : 'Getting Started',
              },
              {
                id: 'architecture' as const,
                icon: Layers,
                label: isEs ? 'Arquitectura y Stack' : 'Architecture & Stack',
              },
              {
                id: 'security' as const,
                icon: ShieldCheck,
                label: isEs ? 'Seguridad y Anti-Replay' : 'Security & Replay Guard',
              },
              {
                id: 'cloud' as const,
                icon: Server,
                label: isEs ? 'Despliegue Cloud & Helm' : 'Production Cloud & Helm',
              },
              {
                id: 'api' as const,
                icon: Terminal,
                label: isEs ? 'Referencia API REST' : 'REST API Reference',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition text-left ${
                    activeTab === item.id
                      ? 'bg-[#F5EFE6] text-[#3D2B1F] border border-[#E6D9C6]'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs space-y-2 shadow-2xs">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#5C4028]" />
              Cluster Health
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              API, Worker, Postgres, and RabbitMQ are running healthy in the{' '}
              <code className="font-mono text-stone-800">alpacard</code> namespace.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 max-w-4xl min-w-0 space-y-6">
          {/* Mobile Tab Selector */}
          <div className="lg:hidden flex overflow-x-auto gap-2 border-b border-stone-200 pb-3 scrollbar-none">
            {(['getting-started', 'architecture', 'security', 'cloud', 'api'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  activeTab === tab
                    ? 'bg-[#3D2B1F] text-white'
                    : 'bg-white border border-stone-200 text-stone-600'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Tab 1: Getting Started */}
          {activeTab === 'getting-started' && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  Getting Started with Alpacard
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  How merchants create campaigns, acquire customers, and issue stamps in seconds.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <h3 className="text-base font-bold text-stone-900">
                  1. Create a Merchant Account
                </h3>
                <p>
                  Register your business store at{' '}
                  <Link
                    to="/login?mode=register"
                    className="text-[#5C4028] font-semibold hover:underline"
                  >
                    Alpacard Console
                  </Link>
                  . You can set your business name, brand colors, and menu. All data is stored in
                  your private PostgreSQL instance.
                </p>

                <h3 className="text-base font-bold text-stone-900 mt-6">
                  2. Define a Loyalty Campaign
                </h3>
                <p>
                  Navigate to <strong>Campaigns &rarr; New Campaign</strong>. Set the required
                  stamp count (e.g., 10 stamps) and specify the customer reward (e.g., &ldquo;Free
                  Artisan Latte&rdquo;).
                </p>

                <h3 className="text-base font-bold text-stone-900 mt-6">
                  3. Print Your Counter QR Stand
                </h3>
                <p>
                  Click <strong>&ldquo;Print QR Poster&rdquo;</strong> to display or print the
                  acquisition QR. Place this poster on your store checkout counter.
                </p>

                <h3 className="text-base font-bold text-stone-900 mt-6">
                  4. Frictionless Customer Experience
                </h3>
                <p>
                  When a customer points their phone camera at your stand, they are routed to{' '}
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-800">
                    https://alpacard.app/claim/[campaignId]
                  </code>
                  . The app automatically provisions an anonymous customer wallet with zero
                  registration forms, adding the card to their device in under 1 second.
                </p>

                <h3 className="text-base font-bold text-stone-900 mt-6">
                  5. Stamping with Staff Permissions
                </h3>
                <p>
                  The cashier or barista opens <strong>Scanner</strong> on their mobile device or
                  uses their native phone camera. The customer shows their expiring 5-minute QR
                  code. The scanner plays an audible confirmation chime and vibrates, recording the
                  audit ledger transaction.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Architecture */}
          {activeTab === 'architecture' && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  System Architecture & Tech Stack
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  High-performance, low-memory footprint design decoupled for extreme reliability.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-stone-900">Core Technology Choices</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-[#4A3525]">Backend API</span>
                    <p className="mt-1 text-stone-600">
                      Go 1.26 + Chi Router. Compiled static binary running on &lt; 25MB RAM with
                      sub-millisecond route execution.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-[#4A3525]">Database Layer</span>
                    <p className="mt-1 text-stone-600">
                      PostgreSQL 16 with GORM ORM. Strict foreign keys, ACID transactions, and
                      zero-config SQLite driver support.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-[#4A3525]">Message Broker</span>
                    <p className="mt-1 text-stone-600">
                      RabbitMQ 3.13. Topic exchange (<code>alpacard.events</code>) emitting
                      asynchronous stamp event streams.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-[#4A3525]">Frontend Apps</span>
                    <p className="mt-1 text-stone-600">
                      Vite + React + Tailwind CSS. Split into Merchant Backoffice & Customer
                      Mobile-first PWA with Service Worker.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Security */}
          {activeTab === 'security' && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  Security & Anti-Fraud Mechanisms
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  How Alpacard prevents QR code screenshots, forgery, and replay attacks.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                <div className="rounded-xl border border-[#E6D9C6] bg-[#F5EFE6]/70 p-5">
                  <h4 className="font-bold text-[#3D2B1F] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Single-Use JTI Replay Protection
                  </h4>
                  <p className="text-xs text-stone-700 mt-1.5 leading-relaxed">
                    Every dynamic QR generated by the customer wallet contains a cryptographic JWT
                    with a unique <code>jti</code> UUID and a 5-minute expiration timestamp. When
                    staff scans the QR, the <code>jti</code> is atomically inserted into the{' '}
                    <code>scanned_tokens</code> table. If the same QR is scanned again, the API
                    returns a <code>409 Conflict</code>.
                  </p>
                </div>

                <h3 className="text-base font-bold text-stone-900 mt-6">
                  Role-Based Access Control (RBAC)
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-xs text-stone-600">
                  <li>
                    <strong className="text-stone-900">CONSUMER:</strong> Can only claim and view
                    cards belonging to their account/wallet. Cannot scan cards.
                  </li>
                  <li>
                    <strong className="text-stone-900">STAFF:</strong> Authorized to operate the
                    camera scanner for campaigns belonging strictly to their assigned business.
                  </li>
                  <li>
                    <strong className="text-stone-900">OWNER:</strong> Full privileges to manage
                    business campaigns, invite/remove staff, and review statistics.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 4: Production Cloud & Helm */}
          {activeTab === 'cloud' && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {isEs ? 'Despliegue Cloud con Kubernetes y Helm' : 'Production Kubernetes & Helm Deployment'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  {isEs
                    ? 'Arquitectura cloud-native contenerizada con alta disponibilidad, ingress TLS y copias de seguridad continuas.'
                    : 'Cloud-native containerized architecture with high availability, automated TLS certificates, and resilient backups.'}
                </p>
              </div>

              <div className="space-y-4 text-xs text-stone-600">
                <p>
                  {isEs
                    ? 'Despliega el chart de Helm en producción con un único comando:'
                    : 'Deploy the production-ready Helm chart with a single command:'}
                </p>
                <div className="rounded-xl bg-stone-900 border border-stone-800 p-4 font-mono text-xs text-stone-200 flex items-center justify-between gap-2 overflow-x-auto">
                  <code className="whitespace-nowrap">
                    helm upgrade --install alpacard deploy/helm/alpacard -n alpacard --create-namespace
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'helm upgrade --install alpacard deploy/helm/alpacard -n alpacard --create-namespace',
                        1
                      )
                    }
                    className="text-stone-400 hover:text-white shrink-0"
                  >
                    {copiedIndex === 1 ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-stone-900 pt-4">
                  {isEs ? 'Copias de Seguridad Automatizadas y Recuperación ante Desastres' : 'Automated Cloud Backups & Disaster Recovery'}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {isEs
                    ? 'Alpacard incluye un pipeline automatizado que ejecuta volcados atómicos de PostgreSQL cada noche a las 03:00 UTC, gestiona la rotación de 14 días y sincroniza archivos comprimidos y cifrados directamente hacia almacenamiento de objetos S3 compatible (Cloudflare R2), con alertas proactivas ante cualquier anomalía.'
                    : 'Alpacard includes an automated Kubernetes CronJob performing atomic PostgreSQL database snapshots nightly at 03:00 UTC, rotating historical retention windows, and synchronizing encrypted archives directly to S3-compatible cloud object storage (Cloudflare R2) with proactive health alerting.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: REST API */}
          {activeTab === 'api' && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 shadow-2xs space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  REST API Reference
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  JSON REST endpoints served on <code>/api/v1/</code>.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Endpoint 1 */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono font-bold text-emerald-800">
                      POST
                    </span>
                    <code className="text-stone-900 font-semibold">/api/v1/scan</code>
                  </div>
                  <p className="text-stone-600">
                    Verifies a customer QR token, checks single-use JTI replay protection, updates
                    stamps, and logs transactions.
                  </p>
                  <pre className="rounded-xl bg-stone-900 p-3 font-mono text-[11px] text-stone-200 overflow-x-auto">
                    {`// Request Body
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Success Response (200 OK)
{
  "success": true,
  "action": "EARN",
  "message": "Stamp added successfully!",
  "newCount": 4
}`}
                  </pre>
                </div>

                {/* Endpoint 2 */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono font-bold text-emerald-800">
                      POST
                    </span>
                    <code className="text-stone-900 font-semibold">/api/v1/auth/guest</code>
                  </div>
                  <p className="text-stone-600">
                    Instantly registers an anonymous consumer wallet account for frictionless
                    checkout line claiming.
                  </p>
                </div>

                {/* Endpoint 3 */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#F5EFE6] border border-[#E6D9C6] px-2 py-0.5 font-mono font-bold text-[#4A3525]">
                      GET
                    </span>
                    <code className="text-stone-900 font-semibold">/api/v1/cards/:id/qr</code>
                  </div>
                  <p className="text-stone-600">
                    Generates a fresh 5-minute signed cryptographic QR token for customer
                    presentation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
