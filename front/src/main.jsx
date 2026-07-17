import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('vite-reload-attempted')) {
    sessionStorage.setItem('vite-reload-attempted', '1');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider
      defaultTheme="system"
      storageKey="smartbudget-ui-theme"
      attribute="class"
    >
      <App />
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  </StrictMode>
);
