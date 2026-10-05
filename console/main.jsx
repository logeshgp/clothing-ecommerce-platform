import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConsoleApp } from './AdminConsole';
import { GitHubOnlyAdmin } from './GitHubOnlyAdmin';
import { ToastProvider } from '@store/context/ToastContext';
import { ConsoleAuthProvider } from './context/ConsoleAuthContext';
import '@store/index.css';
import './console.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {import.meta.env.VITE_GITHUB_ONLY !== 'false' ? (
        <GitHubOnlyAdmin />
      ) : (
        <ToastProvider>
          <ConsoleAuthProvider>
            <ConsoleApp />
          </ConsoleAuthProvider>
        </ToastProvider>
      )}
    </BrowserRouter>
  </StrictMode>,
);
