// src/store/slices/costSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/client';

// Types
export interface CostRecommendation {
  id: string;
  resourceId: string;
  resourceType: string;
  platform?: string;
  currentConfiguration: string;
  recommendedConfiguration: string;
  estimatedSavings: number;
  estimatedSavingsPercentage?: number;
  currency?: string;
  impact: 'high' | 'medium' | 'low';
  justification?: string;
  status: 'open' | 'applied' | 'dismissed';
  createdAt?: string;
  updatedAt?: string;
}

interface CostState {
  recommendations: CostRecommendation[];
  loading: boolean;
  error: string | null;
  scanning: boolean;
  totalPotentialSavings: number;
  lastScanTime?: string;
}

interface CostResponse {
  status: string;
  results: number;
  data: CostRecommendation[];
}

interface ScanResponse {
  status: string;
  message: string;
  scan_id: string;
}

// Initial state
const initialState: CostState = {
  recommendations: [],
  loading: false,
  error: null,
  scanning: false,
  totalPotentialSavings: 0
};

// Async thunks
export const fetchCostRecommendations = createAsyncThunk<
  CostResponse,
  { impact?: string; platform?: string; status?: string } | undefined,
  { rejectValue: string }
>(
  'cost/fetchRecommendations',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.impact) params.append('impact', filters.impact);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.status) params.append('status', filters.status);
      
      const url = `/costs/recommendations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<CostResponse>(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch cost recommendations'
      );
    }
  }
);

export const scanCosts = createAsyncThunk<
  ScanResponse,
  void,
  { rejectValue: string }
>(
  'cost/scanCosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<ScanResponse>('/costs/scan');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to scan for cost optimizations'
      );
    }
  }
);

export const applyRecommendation = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>(
  'cost/applyRecommendation',
  async (recommendationId, { rejectWithValue }) => {
    try {
      await api.post(`/costs/recommendations/${recommendationId}/apply`);
      return { id: recommendationId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to apply recommendation'
      );
    }
  }
);

// Slice
const costSlice = createSlice({
  name: 'cost',
  initialState,
  reducers: {
    clearCostError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cost recommendations
    builder
      .addCase(fetchCostRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCostRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendations = action.payload.data;
        
        // Calculate total potential savings for open recommendations
        state.totalPotentialSavings = action.payload.data
          .filter(rec => rec.status === 'open')
          .reduce((sum, rec) => sum + rec.estimatedSavings, 0);
      })
      .addCase(fetchCostRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch cost recommendations';
      });

    // Scan for cost optimizations
    builder
      .addCase(scanCosts.pending, (state) => {
        state.scanning = true;
        state.error = null;
      })
      .addCase(scanCosts.fulfilled, (state) => {
        state.scanning = false;
        state.lastScanTime = new Date().toISOString();
      })
      .addCase(scanCosts.rejected, (state, action) => {
        state.scanning = false;
        state.error = action.payload ?? 'Failed to scan for cost optimizations';
      });

    // Apply recommendation
    builder
      .addCase(applyRecommendation.fulfilled, (state, action) => {
        const recommendationId = action.payload.id;
        
        // Update the status of the applied recommendation
        state.recommendations = state.recommendations.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, status: 'applied', updatedAt: new Date().toISOString() } 
            : rec
        );
        
        // Recalculate total potential savings (exclude applied recommendation)
        state.totalPotentialSavings = state.recommendations
          .filter(rec => rec.status === 'open')
          .reduce((sum, rec) => sum + rec.estimatedSavings, 0);
      })
      .addCase(applyRecommendation.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to apply recommendation';
      });
  },
});

export const { clearCostError } = costSlice.actions;
export default costSlice.reducer;