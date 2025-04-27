// src/pages/dashboard/CostOptimizationPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Check as CheckIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';
import api from '../../api/client';

interface CostRecommendation {
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
  createdAt?: Date;
  updatedAt?: Date;
}

const CostOptimizationPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<CostRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [impactFilter, setImpactFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selectedRecommendation, setSelectedRecommendation] = useState<CostRecommendation | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/costs/recommendations';
      const params = new URLSearchParams();
      
      if (impactFilter) params.append('impact', impactFilter);
      if (platformFilter) params.append('platform', platformFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setRecommendations(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load cost recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      setError(null);
      
      await api.post('/costs/scan');
      
      // Poll for results after a short delay
      setTimeout(() => {
        fetchRecommendations();
        setScanning(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to start scan:', err);
      setError('Failed to start cost optimization scan. Please try again.');
      setScanning(false);
    }
  };

  const applyRecommendation = async () => {
    if (!selectedRecommendation) return;
    
    try {
      setApplying(true);
      
      await api.post(`/costs/recommendations/${selectedRecommendation.id}/apply`);
      
      // Update the local state
      setRecommendations(prevRecs => 
        prevRecs.map(rec => 
          rec.id === selectedRecommendation.id 
            ? { ...rec, status: 'applied' } 
            : rec
        )
      );
      
      setApplyDialogOpen(false);
      setSelectedRecommendation(null);
    } catch (err: any) {
      console.error('Failed to apply recommendation:', err);
      setError('Failed to apply recommendation. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [impactFilter, platformFilter, statusFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApplyClick = (recommendation: CostRecommendation) => {
    setSelectedRecommendation(recommendation);
    setApplyDialogOpen(true);
  };

  const closeApplyDialog = () => {
    setApplyDialogOpen(false);
    setSelectedRecommendation(null);
  };

  // Get unique platform values for filter
  const platforms = Array.from(new Set(
    recommendations.filter(r => r.platform).map(r => r.platform as string)
  ));

  // Get impact chip color and label
  const getImpactChip = (impact: string) => {
    let color: 'error' | 'warning' | 'success';
    
    switch (impact) {
      case 'high':
        color = 'error';
        break;
      case 'medium':
        color = 'warning';
        break;
      case 'low':
        color = 'success';
        break;
      default:
        color = 'warning';
    }
    
    return <Chip 
      size="small" 
      color={color} 
      label={impact.charAt(0).toUpperCase() + impact.slice(1)} 
    />;
  };

  // Calculate total potential savings
  const totalSavings = recommendations
    .filter(r => r.status === 'open')
    .reduce((sum, rec) => sum + rec.estimatedSavings, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Cost Optimization
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={startScan}
          disabled={scanning}
        >
          {scanning ? <CircularProgress size={24} /> : 'Scan for Savings'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Potential Monthly Savings: 
              <Typography 
                component="span" 
                variant="h5" 
                color="success.main" 
                sx={{ ml: 1, fontWeight: 'bold' }}
              >
                ${totalSavings.toFixed(2)}
              </Typography>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Apply these recommendations to optimize your cloud spend.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip 
              label={`${recommendations.filter(r => r.status === 'open').length} Open Recommendations`} 
              color="primary"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <FilterIcon sx={{ mr: 1 }} />
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Impact"
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Impact Levels</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Platform"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Platforms</MenuItem>
              {platforms.map((platform) => (
                <MenuItem key={platform} value={platform}>
                  {platform.toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Recommendations Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                <TableCell>Recommendation</TableCell>
                <TableCell>Estimated Savings</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No cost recommendations found. Scan your resources to identify savings opportunities.
                  </TableCell>
                </TableRow>
              ) : (
                (rowsPerPage > 0
                  ? recommendations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : recommendations
                ).map((recommendation) => (
                  <TableRow key={recommendation.id} hover>
                    <TableCell>
                      <Typography variant="body2">{recommendation.resourceType}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ wordBreak: 'break-all' }}>
                        {recommendation.resourceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Change from <b>{recommendation.currentConfiguration}</b>
                      </Typography>
                      <Typography variant="body2">
                        to <b>{recommendation.recommendedConfiguration}</b>
                      </Typography>
                      {recommendation.justification && (
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                          {recommendation.justification}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ${recommendation.estimatedSavings.toFixed(2)}{' '}
                        {recommendation.currency && `${recommendation.currency}`}/mo
                      </Typography>
                      {recommendation.estimatedSavingsPercentage && (
                        <Typography variant="caption" color="textSecondary" display="flex" alignItems="center">
                          <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5, color: 'success.main' }} />
                          {recommendation.estimatedSavingsPercentage}% savings
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getImpactChip(recommendation.impact)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                        color={recommendation.status === 'applied' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {recommendation.status === 'open' && (
                        <Tooltip title="Apply Recommendation">
                          <IconButton 
                            color="primary"
                            size="small"
                            onClick={() => handleApplyClick(recommendation)}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={recommendations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onClose={closeApplyDialog}>
        <DialogTitle>Apply Cost Recommendation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to apply this recommendation to{' '}
            <b>{selectedRecommendation?.resourceType}</b> resource?
            This will change the configuration from{' '}
            <b>{selectedRecommendation?.currentConfiguration}</b> to{' '}
            <b>{selectedRecommendation?.recommendedConfiguration}</b>.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Estimated monthly savings:{' '}
              <Typography component="span" color="success.main" fontWeight="bold">
                ${selectedRecommendation?.estimatedSavings.toFixed(2)}
              </Typography>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeApplyDialog} disabled={applying}>
            Cancel
          </Button>
          <Button 
            onClick={applyRecommendation} 
            color="primary" 
            variant="contained"
            disabled={applying}
          >
            {applying ? <CircularProgress size={24} /> : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostOptimizationPage;