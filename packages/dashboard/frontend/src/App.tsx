import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { checkAuth } from './store/slices/authSlice';

// Import pages from the pages directory
// ... other imports

// Define a safe theme that won't cause undefined errors
const createSafeTheme = (themeMode = 'light') => {
  return createTheme({
    palette: {
      mode: themeMode as 'light' | 'dark',
      primary: {
        main: '#1976d2', // Fallback primary color
      },
      secondary: {
        main: '#dc004e', // Fallback secondary color
      },
    },
  });
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  // Add a try/catch to prevent crashes if the store is not fully initialized
  let theme = 'light';
  try {
    const settings = useSelector((state: RootState) => state.settings);
    theme = settings?.theme || 'light';
  } catch (error) {
    console.error('Error accessing theme from store:', error);
  }

  // Define application theme with fallbacks
  const appTheme = createSafeTheme(theme);

  // Check authentication status on app load
  useEffect(() => {
    try {
      dispatch(checkAuth() as any);
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  }, [dispatch]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <ErrorBoundary
        fallback={<div style={{ padding: 20 }}>Something went wrong. Please refresh the page.</div>}
      >
        <Router>
          {/* Routes here */}
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

// Add an ErrorBoundary component to catch React errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default App;