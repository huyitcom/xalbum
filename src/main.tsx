import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Suppress cross-origin frame access errors commonly triggered inside sandboxed preview iframes
if (typeof window !== 'undefined') {
  const isCrossOriginSecurityError = (err: any, msg?: string) => {
    const text = String(msg || err?.message || err?.toString() || '');
    return (
      text.includes('cross-origin frame') ||
      text.includes('$$typeof') ||
      text.includes('Blocked a frame with origin') ||
      (err?.name === 'SecurityError' && text.includes('Window'))
    );
  };

  window.onerror = function (msg, _url, _lineNo, _columnNo, error) {
    if (isCrossOriginSecurityError(error, String(msg))) {
      return true; // suppresses the error
    }
  };

  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || (typeof event.error?.message === 'string' ? event.error.message : '');
      if (isCrossOriginSecurityError(event.error, msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || '';
      if (isCrossOriginSecurityError(reason, msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
}
