// src/store/slices/securitySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/client';

// Types
export interface SecurityIssue {
  id: string;
  resourceId: string;
  resourceType: string;
  platform: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  remediation: string;
  compliance?: string[];
  status: 'open' | 'remediated' | 'accepted';
  details?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface SecurityState {
  issues: SecurityIssue[];
  loading: boolean;
  error: string | null;
  scanning: boolean;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastScanTime?: string;
}

interface SecurityResponse {
  status: string;
  results: number;
  data: SecurityIssue[];
}

interface ScanResponse {
  status: string;
  message: string;
  scan_id: string;
}

// Initial state
const initialState: SecurityState = {
  issues: [],
  loading: false,
  error: null,
  scanning: false,
  issuesBySeverity: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  }
};

// Helper function to count issues by severity
const countIssuesBySeverity = (issues: SecurityIssue[]): { critical: number; high: number; medium: number; low: number } => {
  return issues.reduce(
    (counts, issue) => {
      if (issue.status === 'open') {
        counts[issue.severity]++;
      }
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
};

// Async thunks
export const fetchSecurityIssues = createAsyncThunk<
  SecurityResponse,
  { severity?: string; platform?: string; status?: string } | undefined,
  { rejectValue: string }
>(
  'security/fetchIssues',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.status) params.append('status', filters.status);
      
      const url = `/security/issues${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<SecurityResponse>(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch security issues'
      );
    }
  }
);

export const scanSecurity = createAsyncThunk<
  ScanResponse,
  void,
  { rejectValue: string }
>(
  'security/scanSecurity',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post<ScanResponse>('/security/scan');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to run security scan'
      );
    }
  }
);

export const remediateIssue = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>(
  'security/remediateIssue',
  async (issueId, { rejectWithValue }) => {
    try {
      await api.post(`/security/issues/${issueId}/remediate`);
      return { id: issueId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remediate security issue'
      );
    }
  }
);

// Slice
const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    clearSecurityError: (state) => {
      state.error = null;
    },
    acceptRisk: (state, action: PayloadAction<string>) => {
      const issueId = action.payload;
      
      // Update the status of the specific issue
      state.issues = state.issues.map(issue => 
        issue.id === issueId 
          ? { ...issue, status: 'accepted', updatedAt: new Date().toISOString() } 
          : issue
      );
      
      // Recalculate counts
      state.issuesBySeverity = countIssuesBySeverity(state.issues);
    }
  },
  extraReducers: (builder) => {
    // Fetch security issues
    builder
      .addCase(fetchSecurityIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecurityIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload.data;
        
        // Count issues by severity
        state.issuesBySeverity = countIssuesBySeverity(action.payload.data);
      })
      .addCase(fetchSecurityIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch security issues';
      });

    // Run security scan
    builder
      .addCase(scanSecurity.pending, (state) => {
        state.scanning = true;
        state.error = null;
      })
      .addCase(scanSecurity.fulfilled, (state) => {
        state.scanning = false;
        state.lastScanTime = new Date().toISOString();
      })
      .addCase(scanSecurity.rejected, (state, action) => {
        state.scanning = false;
        state.error = action.payload ?? 'Failed to run security scan';
      });

    // Remediate security issue
    builder
      .addCase(remediateIssue.fulfilled, (state, action) => {
        const issueId = action.payload.id;
        
        // Update the status of the remediated issue
        state.issues = state.issues.map(issue => 
          issue.id === issueId 
            ? { ...issue, status: 'remediated', updatedAt: new Date().toISOString() } 
            : issue
        );
        
        // Recalculate counts
        state.issuesBySeverity = countIssuesBySeverity(state.issues);
      })
      .addCase(remediateIssue.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to remediate security issue';
      });
  },
});

export const { clearSecurityError, acceptRisk } = securitySlice.actions;
export default securitySlice.reducer;