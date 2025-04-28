// Updated settingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: boolean;
  defaultDashboard: string;
  cloudProviders: {
    aws: boolean;
    azure: boolean;
    gcp: boolean;
  };
}

// Get settings from localStorage or use defaults
const getInitialSettings = (): SettingsState => {
  const savedSettings = localStorage.getItem('settings');
  
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
  }
  
  // Default settings
  return {
    theme: 'system',
    sidebarCollapsed: false,
    notifications: true,
    defaultDashboard: 'overview',
    cloudProviders: {
      aws: true,
      azure: true,
      gcp: true,
    },
  };
};

const initialState: SettingsState = getInitialSettings();

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      if (state.theme === 'light') {
        state.theme = 'dark';
      } else if (state.theme === 'dark') {
        state.theme = 'system';
      } else {
        state.theme = 'light';
      }
      localStorage.setItem('settings', JSON.stringify(state));
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('settings', JSON.stringify(state));
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('settings', JSON.stringify(state));
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
      localStorage.setItem('settings', JSON.stringify(state));
    },
    setDefaultDashboard: (state, action: PayloadAction<string>) => {
      state.defaultDashboard = action.payload;
      localStorage.setItem('settings', JSON.stringify(state));
    },
    toggleCloudProvider: (state, action: PayloadAction<'aws' | 'azure' | 'gcp'>) => {
      state.cloudProviders[action.payload] = !state.cloudProviders[action.payload];
      localStorage.setItem('settings', JSON.stringify(state));
    },
    resetSettings: (state, action: PayloadAction<{ resetAll: boolean }>) => {
      state.theme = 'system';
      state.sidebarCollapsed = false;
      state.notifications = true;
      state.defaultDashboard = 'overview';
      state.cloudProviders = {
        aws: true,
        azure: true,
        gcp: true,
      };
      localStorage.setItem('settings', JSON.stringify(state));
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  toggleNotifications,
  setDefaultDashboard,
  toggleCloudProvider,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;