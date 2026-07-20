import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppProviders from './components/AppProviders';
import App from './App';

if (typeof window !== 'undefined') {
  document.addEventListener('wheel', function (e) {
    if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
