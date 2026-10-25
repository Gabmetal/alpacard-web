import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { WalletPage } from './pages/WalletPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { ClaimPage } from './pages/ClaimPage';

export function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WalletPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/card/:id" element={<CardDetailPage />} />
            <Route path="/claim/:id" element={<ClaimPage />} />
            <Route path="*" element={<WalletPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;