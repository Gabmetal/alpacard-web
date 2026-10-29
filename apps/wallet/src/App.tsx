import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { ToastProvider } from './components/Toast';
import { WalletPage } from './pages/WalletPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { ClaimPage } from './pages/ClaimPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

export function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<WalletPage />} />
              <Route path="/card/:id" element={<CardDetailPage />} />
              <Route path="/claim/:id" element={<ClaimPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<WalletPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;