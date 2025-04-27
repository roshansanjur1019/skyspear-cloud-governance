// src/pages/dashboard/ResourcesPage.tsx
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
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../../api/client';

interface CloudResource {
  id: string;
  name?: string;
  type: string;
  platform: 'aws' | 'azure' | 'gcp';
  region?: string;
  zone?: string;
  tags?: Record<string, string>;
  createdAt?: Date;
  resourceGroup?: string;
}

const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/resources';
      const params = new URLSearchParams();
      
      if (platformFilter) params.append('platform', platformFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (regionFilter) params.append('region', regionFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setResources(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch resources:', err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      setError(null);
      
      await api.post('/resources/scan');
      
      // Poll for results after a short delay
      setTimeout(() => {
        fetchResources();
        setScanning(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to start scan:', err);
      setError('Failed to start scan. Please try again.');
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [platformFilter, typeFilter, regionFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get unique platform values for filter
  const platforms = Array.from(new Set(resources.map(r => r.platform)));
  
  // Get unique region values for filter
  const regions = Array.from(new Set(
    resources.filter(r => r.region).map(r => r.region as string)
  ));
  
  // Get unique type values for filter
  const types = Array.from(new Set(resources.map(r => r.type)));

  // Get platform display name and color
  const getPlatformChip = (platform: string) => {
    let color: 'primary' | 'secondary' | 'success' | 'info';
    let label: string;
    
    switch (platform) {
      case 'aws':
        color = 'primary';
        label = 'AWS';
        break;
      case 'azure':
        color = 'info';
        label = 'Azure';
        break;
      case 'gcp':
        color = 'success';
        label = 'GCP';
        break;
      default:
        color = 'secondary';
        label = platform;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Cloud Resources
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={startScan}
          disabled={scanning}
        >
          {scanning ? <CircularProgress size={24} /> : 'Scan Resources'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
              label="Cloud Platform"
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
              label="Resource Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              {types.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Region"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Regions</MenuItem>
              {regions.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Resources Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name/ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Region/Zone</TableCell>
                <TableCell>Tags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No resources found. Connect your cloud providers and scan to get started.
                  </TableCell>
                </TableRow>
              ) : (
                (rowsPerPage > 0
                  ? resources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : resources
                ).map((resource) => (
                  <TableRow key={resource.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{resource.name || 'Unnamed'}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ wordBreak: 'break-all' }}>
                        {resource.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{resource.type}</TableCell>
                    <TableCell>{getPlatformChip(resource.platform)}</TableCell>
                    <TableCell>{resource.region || resource.zone || '-'}</TableCell>
                    <TableCell>
                      {resource.tags ? (
                        <Box>
                          {Object.entries(resource.tags).map(([key, value]) => (
                            <Chip 
                              key={key}
                              size="small"
                              label={`${key}: ${value}`}
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">No tags</Typography>
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
          count={resources.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default ResourcesPage;