// src/store/slices/resourcesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/client';

// Types
export interface CloudResource {
  id: string;
  name?: string;
  type: string;
  platform: 'aws' | 'azure' | 'gcp';
  region?: string;
  zone?: string;
  tags?: Record<string, string>;
  createdAt?: string;
  resourceGroup?: string;
}

interface ResourcesState {
  resources: CloudResource[];
  loading: boolean;
  error: string | null;
  scanning: boolean;
  lastScanId?: string;
  lastScanTime?: string;
}

interface ResourcesResponse {
  status: string;
  results: number;
  data: CloudResource[];
}

interface ScanResponse {
  status: string;
  message: string;
  scan_id: string;
}

// Initial state
const initialState: ResourcesState = {
  resources: [],
  loading: false,
  error: null,
  scanning: false
};

// Async thunks
export const fetchResources = createAsyncThunk<
  ResourcesResponse,
  { platform?: string; region?: string; type?: string } | undefined,
  { rejectValue: string }
>(
  'resources/fetchResources',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.region) params.append('region', filters.region);
      if (filters.type) params.append('type', filters.type);
      
      const url = `/resources${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ResourcesResponse>(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch resources'
      );
    }
  }
);

export const scanResources = createAsyncThunk<
  ScanResponse,
  void,
  { rejectValue: string }
>(
  'resources/scanResources',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<ScanResponse>('/resources/scan');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to scan resources'
      );
    }
  }
);

// Slice
const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    clearResourcesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch resources
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload.data;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch resources';
      });

    // Scan resources
    builder
      .addCase(scanResources.pending, (state) => {
        state.scanning = true;
        state.error = null;
      })
      .addCase(scanResources.fulfilled, (state, action) => {
        state.scanning = false;
        state.lastScanId = action.payload.scan_id;
        state.lastScanTime = new Date().toISOString();
      })
      .addCase(scanResources.rejected, (state, action) => {
        state.scanning = false;
        state.error = action.payload ?? 'Failed to scan resources';
      });
  },
});

export const { clearResourcesError } = resourcesSlice.actions;
export default resourcesSlice.reducer;