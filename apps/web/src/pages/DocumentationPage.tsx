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
  Check
} from 'lucide-react';

export function DocumentationPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'getting-started' | 'architecture' | 'security' | 'k3s' | 'api'>('getting-started');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isEs = language === 'es';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">{isEs ? 'Documentación Alpacard' : 'Alpacard Docs'}</span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/30">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dark" />
            <Link
              to="/demo"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              {t.nav.liveDemo}
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow"
            >
              {t.nav.console}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('getting-started')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition text-left ${
                activeTab === 'getting-started'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              {isEs ? 'Primeros Pasos' : 'Getting Started'}
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition text-left ${
                activeTab === 'architecture'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              {isEs ? 'Arquitectura y Stack' : 'Architecture & Stack'}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition text-left ${
                activeTab === 'security'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {isEs ? 'Seguridad y Anti-Replay' : 'Security & Replay Guard'}
            </button>
            <button
              onClick={() => setActiveTab('k3s')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition text-left ${
                activeTab === 'k3s'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Server className="h-4 w-4" />
              {isEs ? 'Despliegue k3s y Helm' : 'Homelab k3s & Helm'}
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition text-left ${
                activeTab === 'api'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Terminal className="h-4 w-4" />
              {isEs ? 'Referencia API REST' : 'REST API Reference'}
            </button>
          </nav>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              Cluster Health
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              API, Worker, Postgres, and RabbitMQ are running healthy in the <code>alpacard</code> namespace.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 max-w-4xl space-y-8">
          {/* Mobile Tab Selector */}
          <div className="lg:hidden flex overflow-x-auto gap-2 border-b border-slate-800 pb-3">
            {(['getting-started', 'architecture', 'security', 'k3s', 'api'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Tab 1: Getting Started */}
          {activeTab === 'getting-started' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Getting Started with Alpacard</h2>
                <p className="text-sm text-slate-400 mt-1">
                  How merchants create campaigns, acquire customers, and issue stamps in seconds.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <h3 className="text-base font-bold text-white">1. Create a Merchant Account</h3>
                <p>
                  Register your business store at <Link to="/login?mode=register" className="text-indigo-400 font-bold hover:underline">Alpacard Console</Link>. You can set your business name and avatar. All data is stored in your private PostgreSQL instance.
                </p>

                <h3 className="text-base font-bold text-white mt-6">2. Define a Loyalty Campaign</h3>
                <p>
                  Navigate to <strong>Campaigns &rarr; New Campaign</strong>. Set the required stamp count (e.g., 10 stamps) and specify the customer reward (e.g., &ldquo;Free Artisan Latte&rdquo;).
                </p>

                <h3 className="text-base font-bold text-white mt-6">3. Print Your Counter QR Stand</h3>
                <p>
                  Click <strong>&ldquo;Print QR Poster&rdquo;</strong> to display or print the acquisition QR. Place this poster on your store checkout counter.
                </p>

                <h3 className="text-base font-bold text-white mt-6">4. Frictionless Customer Experience</h3>
                <p>
                  When a customer points their phone camera at your stand, they are routed to <code>https://alpacard.gabo.lat/claim/[campaignId]</code>. The app automatically provisions an anonymous customer wallet with zero registration forms, adding the card to their device in under 1 second.
                </p>

                <h3 className="text-base font-bold text-white mt-6">5. Stamping with Staff Permissions</h3>
                <p>
                  The cashier or barista opens <strong>Scanner</strong> on their mobile device or tablet. The customer shows their expiring 5-minute QR code. The scanner plays an audible confirmation chime and vibrates, recording the audit ledger transaction.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">System Architecture & Tech Stack</h2>
                <p className="text-sm text-slate-400 mt-1">
                  High-performance, low-memory footprint design decoupled for extreme reliability.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-base font-bold text-white">Core Technology Choices</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-indigo-400">Backend API</span>
                    <p className="mt-1 text-slate-300">Go 1.26 + Chi Router. Compiled static binary running on &lt; 25MB RAM with sub-millisecond route execution.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-indigo-400">Database Layer</span>
                    <p className="mt-1 text-slate-300">PostgreSQL 16 with GORM ORM. Strict foreign keys, ACID transactions, and zero-config SQLite driver support.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-indigo-400">Message Broker</span>
                    <p className="mt-1 text-slate-300">RabbitMQ 3.13. Topic exchange (<code>alpacard.events</code>) emitting asynchronous stamp event streams.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-indigo-400">Frontend Apps</span>
                    <p className="mt-1 text-slate-300">Vite + React + Tailwind CSS. Split into Merchant Backoffice & Customer Mobile-first PWA with Service Worker.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Security & Anti-Fraud Mechanisms</h2>
                <p className="text-sm text-slate-400 mt-1">
                  How Alpacard prevents QR code screenshots, forgery, and replay attacks.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Single-Use JTI Replay Protection
                  </h4>
                  <p className="text-xs text-indigo-100 mt-1.5 leading-relaxed">
                    Every dynamic QR generated by the customer wallet contains a cryptographic JWT with a unique <code>jti</code> UUID and a 5-minute expiration timestamp. When staff scans the QR, the <code>jti</code> is atomically inserted into the <code>scanned_tokens</code> table. If the same QR is scanned again, the API returns a <code>409 Conflict</code>.
                  </p>
                </div>

                <h3 className="text-base font-bold text-white mt-6">Role-Based Access Control (RBAC)</h3>
                <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400">
                  <li><strong className="text-white">CONSUMER:</strong> Can only claim and view cards belonging to their account/wallet. Cannot scan cards.</li>
                  <li><strong className="text-white">STAFF:</strong> Authorized to operate the camera scanner for campaigns belonging strictly to their assigned business.</li>
                  <li><strong className="text-white">OWNER:</strong> Full privileges to manage business campaigns, invite/remove staff, and review financial statistics.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 4: Homelab k3s */}
          {activeTab === 'k3s' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Homelab Kubernetes & Helm Deployment</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Deploying on k3s clusters with Traefik, Cert-Manager, and automated backups.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <p>Deploy the production Helm chart with a single command:</p>
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-indigo-300 flex items-center justify-between">
                  <code>helm upgrade --install alpacard deploy/helm/alpacard -n alpacard --create-namespace</code>
                  <button
                    onClick={() => copyToClipboard('helm upgrade --install alpacard deploy/helm/alpacard -n alpacard --create-namespace', 1)}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedIndex === 1 ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-white pt-4">Automated Nightly Backups</h3>
                <p className="text-slate-400 leading-relaxed">
                  The homelab systemd backup service (<code>/usr/local/bin/homelab-backup.py</code>) runs nightly at 03:00 AM Cordoba time. It automatically executes a PostgreSQL database dump (<code>pg_dump</code>), snapshots storage PVCs under <code>/var/lib/rancher/k3s/storage/*_alpacard_*</code>, uploads the archive to Cloudflare R2, and reports health via Telegram.
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: REST API */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">REST API Reference</h2>
                <p className="text-sm text-slate-400 mt-1">
                  JSON REST endpoints served on <code>/api/v1/</code>.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Endpoint 1 */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono font-bold text-emerald-400">POST</span>
                    <code className="text-white font-semibold">/api/v1/scan</code>
                  </div>
                  <p className="text-slate-400">Verifies a customer QR token, checks single-use JTI replay protection, updates stamps, and logs transactions.</p>
                  <pre className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
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
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono font-bold text-emerald-400">POST</span>
                    <code className="text-white font-semibold">/api/v1/auth/guest</code>
                  </div>
                  <p className="text-slate-400">Instantly registers an anonymous consumer wallet account for frictionless checkout line claiming.</p>
                </div>

                {/* Endpoint 3 */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono font-bold text-blue-400">GET</span>
                    <code className="text-white font-semibold">/api/v1/cards/:id/qr</code>
                  </div>
                  <p className="text-slate-400">Generates a fresh 5-minute signed cryptographic QR token for customer presentation.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
