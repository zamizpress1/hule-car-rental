import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider } from './context/AppContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { OwnerWizardPage } from './pages/OwnerWizardPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { BrokerConsolePage } from './pages/BrokerConsolePage';
import { MyGarage } from './pages/MyGarage';
import { AdminRoute } from './components/AdminRoute';
import { supabase } from './supabaseClient';

export function App() {
  useEffect(() => {
    console.log('Supabase Connected:', supabase);
  }, []);

  return (
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<MarketplacePage />} />
              <Route path="vehicle/:id" element={<ProductDetailPage />} />
              <Route path="list-car" element={<OwnerWizardPage />} />
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="/my-garage" element={<MyGarage />} />
              <Route path="admin" element={<AdminRoute><BrokerConsolePage /></AdminRoute>} />
              <Route path="broker-console" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}

export default App;
