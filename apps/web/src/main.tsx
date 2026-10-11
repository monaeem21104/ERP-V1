import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import en from './i18n/en.json';
import ar from './i18n/ar.json';

const saved = localStorage.getItem('locale') ?? 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = saved;
document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
