import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider
      defaultTheme="system"
      storageKey="spendwise-ui-theme"
      attribute="class"
    >
      <App />
      <Analytics />
    </ThemeProvider>
  </StrictMode>
);
