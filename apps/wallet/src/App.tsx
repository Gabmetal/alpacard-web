import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { WalletPage } from './pages/WalletPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { ClaimPage } from './pages/ClaimPage';

export function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WalletPage />} />
          <Route path="/card/:id" element={<CardDetailPage />} />
          <Route path="/claim/:id" element={<ClaimPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;