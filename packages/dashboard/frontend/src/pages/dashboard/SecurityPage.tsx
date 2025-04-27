// src/pages/dashboard/SecurityPage.tsx
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
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  SecurityOutlined as SecurityIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';
import api from '../../api/client';

interface SecurityIssue {
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

const SecurityPage: React.FC = () => {
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);
  const [remediateDialogOpen, setRemediateDialogOpen] = useState(false);
  const [remediating, setRemediating] = useState(false);

  const fetchSecurityIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/security/issues';
      const params = new URLSearchParams();
      
      if (severityFilter) params.append('severity', severityFilter);
      if (platformFilter) params.append('platform', platformFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setIssues(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch security issues:', err);
      setError('Failed to load security issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      setError(null);
      
      await api.post('/security/scan');
      
      // Poll for results after a short delay
      setTimeout(() => {
        fetchSecurityIssues();
        setScanning(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to start scan:', err);
      setError('Failed to start security scan. Please try again.');
      setScanning(false);
    }
  };

  const remediateIssue = async () => {
    if (!selectedIssue) return;
    
    try {
      setRemediating(true);
      
      await api.post(`/security/issues/${selectedIssue.id}/remediate`);
      
      // Update the local state
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === selectedIssue.id 
            ? { ...issue, status: 'remediated' } 
            : issue
        )
      );
      
      setRemediateDialogOpen(false);
      setSelectedIssue(null);
    } catch (err: any) {
      console.error('Failed to remediate issue:', err);
      setError('Failed to remediate security issue. Please try again.');
    } finally {
      setRemediating(false);
    }
  };

  useEffect(() => {
    fetchSecurityIssues();
  }, [severityFilter, platformFilter, statusFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRemediateClick = (issue: SecurityIssue) => {
    setSelectedIssue(issue);
    setRemediateDialogOpen(true);
  };

  const closeRemediateDialog = () => {
    setRemediateDialogOpen(false);
    setSelectedIssue(null);
  };

  // Get unique platform values for filter
  const platforms = Array.from(new Set(issues.map(issue => issue.platform)));

  // Get severity chip color and label
  const getSeverityChip = (severity: string) => {
    let color: 'error' | 'warning' | 'info' | 'default';
    
    switch (severity) {
      case 'critical':
        color = 'error';
        break;
      case 'high':
        color = 'error';
        break;
      case 'medium':
        color = 'warning';
        break;
      case 'low':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    
    return <Chip 
      size="small" 
      color={color} 
      label={severity.charAt(0).toUpperCase() + severity.slice(1)} 
    />;
  };

  // Calculate counts by severity
  const criticalCount = issues.filter(i => i.severity === 'critical' && i.status === 'open').length;
  const highCount = issues.filter(i => i.severity === 'high' && i.status === 'open').length;
  const mediumCount = issues.filter(i => i.severity === 'medium' && i.status === 'open').length;
  const lowCount = issues.filter(i => i.severity === 'low' && i.status === 'open').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Security Compliance
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={startScan}
          disabled={scanning}
        >
          {scanning ? <CircularProgress size={24} /> : 'Security Scan'}
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
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                borderRadius: 1,
                backgroundColor: criticalCount > 0 ? 'error.light' : 'background.paper' 
              }}
            >
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  {criticalCount}
                </Typography>
                <Typography variant="caption">Critical</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                borderRadius: 1,
                backgroundColor: highCount > 0 ? 'error.lighter' : 'background.paper'  
              }}
            >
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  {highCount}
                </Typography>
                <Typography variant="caption">High</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                borderRadius: 1,
                backgroundColor: mediumCount > 0 ? 'warning.lighter' : 'background.paper'  
              }}
            >
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  {mediumCount}
                </Typography>
                <Typography variant="caption">Medium</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                borderRadius: 1,
                backgroundColor: lowCount > 0 ? 'info.lighter' : 'background.paper'  
              }}
            >
              <WarningIcon color="info" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  {lowCount}
                </Typography>
                <Typography variant="caption">Low</Typography>
              </Box>
            </Box>
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
              label="Severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Severities</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
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
              <MenuItem value="remediated">Remediated</MenuItem>
              <MenuItem value="accepted">Accepted Risk</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Security Issues */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Compliance</TableCell>
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
              ) : issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No security issues found. Run a security scan to check your infrastructure.
                  </TableCell>
                </TableRow>
              ) : (
                (rowsPerPage > 0
                  ? issues.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : issues
                ).map((issue) => (
                  <TableRow key={issue.id} hover>
                    <TableCell>
                      <Typography variant="body2">{issue.resourceType}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ wordBreak: 'break-all' }}>
                        {issue.resourceId}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={issue.platform.toUpperCase()} 
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Accordion sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ p: 0, minHeight: 'auto !important' }}
                        >
                          <Typography variant="body2" fontWeight="medium">
                            {issue.issue}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pt: 1 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            <strong>Remediation:</strong> {issue.remediation}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                    <TableCell>{getSeverityChip(issue.severity)}</TableCell>
                    <TableCell>
                      {issue.compliance ? (
                        <Box>
                          {issue.compliance.map((standard) => (
                            <Chip 
                              key={standard}
                              size="small"
                              label={standard}
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">None specified</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        color={issue.status === 'remediated' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {issue.status === 'open' && (
                        <Tooltip title="Mark as Remediated">
                          <IconButton 
                            color="primary"
                            size="small"
                            onClick={() => handleRemediateClick(issue)}
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
          count={issues.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Remediate Dialog */}
      <Dialog open={remediateDialogOpen} onClose={closeRemediateDialog}>
        <DialogTitle>Mark Security Issue as Remediated</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you confirming that you have resolved this security issue?
          </DialogContentText>
          {selectedIssue && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {selectedIssue.issue}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Resource:</strong> {selectedIssue.resourceType} - {selectedIssue.resourceId}
              </Typography>
              <Typography variant="body2">
                <strong>Remediation action:</strong> {selectedIssue.remediation}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRemediateDialog} disabled={remediating}>
            Cancel
          </Button>
          <Button 
            onClick={remediateIssue} 
            color="primary" 
            variant="contained"
            disabled={remediating}
          >
            {remediating ? <CircularProgress size={24} /> : 'Confirm Remediation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityPage;