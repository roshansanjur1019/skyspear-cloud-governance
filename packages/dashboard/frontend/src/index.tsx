// Fixed index.tsx with proper App import and event listener for auth
// packages/dashboard/frontend/src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Fix 1: Correct the import path for App (relative path)
import App from './App'; // not './App.tsx' - TypeScript resolves the extension automatically
import { store } from './store';
import { logout } from './store/slices/authSlice';
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Fix 2: Add event listener for unauthorized events
// This breaks the circular dependency between store and api client
window.addEventListener('auth:unauthorized', () => {
  store.dispatch(logout());
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);