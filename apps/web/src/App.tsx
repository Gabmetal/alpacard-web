import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getMerchantToken, api, MerchantUser } from './services/api';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { ToastProvider } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { DemoPage } from './pages/DemoPage';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './pages/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { BusinessesPage, BusinessItem } from './pages/BusinessesPage';
import { StaffPage } from './pages/StaffPage';
import { ScannerPage } from './pages/ScannerPage';
import { Plus, X } from 'lucide-react';
import { getWalletUrl } from './utils/urls';

function LoginRoute({ token, onLoginSuccess }: { token: string | null; onLoginSuccess: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (token) {
    return <Navigate to={redirect} replace />;
  }

  return (
    <LoginPage
      onLoginSuccess={() => {
        onLoginSuccess();
        navigate(redirect);
      }}
    />
  );
}

function ProtectedFallback() {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
}

export function App() {
  const [token, setToken] = useState<string | null>(getMerchantToken());
  const [currentUser, setCurrentUser] = useState<MerchantUser | null>(null);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.me()
        .then((user) => {
          if (user.role === 'CONSUMER') {
            window.location.href = getWalletUrl();
            return;
          }
          setCurrentUser(user as MerchantUser);
        })
        .catch(() => setCurrentUser(null));
    } else {
      setCurrentUser(null);
    }
  }, [token]);

  // Create Business Modal
  const [showCreateBiz, setShowCreateBiz] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizSubmitting, setBizSubmitting] = useState(false);

  const loadBusinesses = async () => {
    if (!token) {
      setBusinesses([]);
      setActiveBusiness(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getMyBusinesses();
      const allBiz = [...(res.owned || []), ...(res.staffAt || [])];
      setBusinesses(allBiz);
      if (allBiz.length > 0 && !activeBusiness) {
        setActiveBusiness(allBiz[0]);
      }
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [token]);

  const handleCreateBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName) return;
    setBizSubmitting(true);
    try {
      const newBiz = await api.createBusiness({ name: bizName });
      setShowCreateBiz(false);
      setBizName('');
      setBusinesses((prev) => [...prev, newBiz]);
      setActiveBusiness(newBiz);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to create business');
      }
    } finally {
      setBizSubmitting(false);
    }
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Marketing & Product Routes */}
              {typeof window !== 'undefined' &&
              (window.location.hostname.startsWith('demo') ||
                window.location.hostname.includes('dev-demo')) ? (
                <>
                  <Route path="/" element={<DemoPage />} />
                  <Route path="*" element={<DemoPage />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/docs" element={<DocumentationPage />} />
                </>
              )}
              <Route
                path="/login"
                element={
                  <LoginRoute
                    token={token}
                    onLoginSuccess={() => setToken(getMerchantToken())}
                  />
                }
              />

              {/* Authenticated Merchant Console Routes */}
              {token ? (
                <Route
                  element={
                    loading ? (
                      <div className="flex h-screen items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                          <p className="mt-3 text-xs font-semibold text-gray-500">Loading merchant backoffice...</p>
                        </div>
                      </div>
                    ) : (
                      <Layout
                        currentUser={currentUser}
                        onLogout={() => {
                          setToken(null);
                          setCurrentUser(null);
                          setBusinesses([]);
                          setActiveBusiness(null);
                        }}
                        businesses={businesses}
                        activeBusiness={activeBusiness}
                        onSelectBusiness={(b) => setActiveBusiness(b)}
                        onCreateBusiness={() => setShowCreateBiz(true)}
                        onUserUpdated={(u) => setCurrentUser(u)}
                      />
                    )
                  }
                >
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  businessId={activeBusiness?.id}
                  onCreateBusiness={() => setShowCreateBiz(true)}
                />
              }
            />
            <Route
              path="/campaigns"
              element={<CampaignsPage businessId={activeBusiness?.id} businessName={activeBusiness?.name} />}
            />
            <Route
              path="/businesses"
              element={
                <BusinessesPage
                  businesses={businesses}
                  activeBusinessId={activeBusiness?.id}
                  onSelectBusiness={(b) => setActiveBusiness(b)}
                  onRefreshBusinesses={loadBusinesses}
                />
              }
            />
            <Route path="/staff" element={<StaffPage businessId={activeBusiness?.id} />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          /* Protected Fallbacks when not signed in */
          <>
            <Route path="/dashboard" element={<ProtectedFallback />} />
            <Route path="/campaigns" element={<ProtectedFallback />} />
            <Route path="/businesses" element={<ProtectedFallback />} />
            <Route path="/staff" element={<ProtectedFallback />} />
            <Route path="/scanner" element={<ProtectedFallback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>

      {/* Create Business Modal */}
      {showCreateBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900">New Business Store</h3>
              <button onClick={() => setShowCreateBiz(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBusinessSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Business / Store Name</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Alpacard Coffee Roasters"
                  className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBiz(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bizSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {bizSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;