import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { GoogleOAuthProvider } from '@react-oauth/google';

window.addEventListener('vite:preloadError', () => {
  const lastReload = sessionStorage.getItem('vite-reload-timestamp');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('vite-reload-timestamp', now.toString());
    window.location.reload();
  }
});

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider
        defaultTheme="system"
        storageKey="smartbudget-ui-theme"
        attribute="class"
      >
        <App />
        <Analytics />
        <SpeedInsights />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
