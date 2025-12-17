import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug: log whether Vite injected Supabase env vars (do not log full anon key)
try {
  const url = import.meta.env.VITE_SUPABASE_URL || '(none)';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ? '***masked***' : '(none)';
  // eslint-disable-next-line no-console
  console.log('Supabase env:', { url, key });
} catch (e) {
  // ignore in non-Vite environments
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
