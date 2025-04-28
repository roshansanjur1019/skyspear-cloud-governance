import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App'; // TypeScript resolves the extension automatically
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

// Add event listener for unauthorized events
// This breaks the circular dependency between store and api client
window.addEventListener('auth:unauthorized', () => {
  try {
    store.dispatch(logout());
  } catch (error) {
    console.error('Error dispatching logout:', error);
    // Handle error gracefully - you could redirect to login page if needed
    window.location.href = '/login';
  }
});

// Safe rendering with error handling
const renderApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </Provider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render application:', error);
    
    // Render a basic error page if the main app fails to load
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>Application Error</h2>
          <p>The application failed to load. Please refresh the page or try again later.</p>
          <button onclick="window.location.reload()">Refresh Page</button>
        </div>
      `;
    }
  }
};

// Initialize application
renderApp();