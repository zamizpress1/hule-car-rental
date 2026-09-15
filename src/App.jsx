function ScrollToTop() {
  const { pathname, search, key, hash } = useLocation();
  const appState = useApp();
  const viewMode = appState?.viewMode;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const scrollables = document.querySelectorAll('main, .overflow-y-auto, .overflow-auto');
    scrollables.forEach(el => {
      el.scrollTop = 0;
    });
  }, [pathname, search, key, hash, viewMode]);

  return null;
}

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
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<MarketplacePage />} />
                  <Route path="vehicle/:id" element={<ProductDetailPage />} />
                  <Route path="list-car" element={<OwnerWizardPage />} />
                  <Route path="post-car" element={<OwnerWizardPage />} />
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
