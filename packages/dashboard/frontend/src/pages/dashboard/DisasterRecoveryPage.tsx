// src/pages/dashboard/DisasterRecoveryPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Backup as BackupIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

const DisasterRecoveryPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data - in a real app, this would come from your API
  const drConfig = {
    enabled: true,
    backupSchedule: 'Daily at 2:00 AM UTC',
    retentionPeriod: '30 days',
    lastBackup: '2025-04-26T02:00:00Z',
    regions: {
      primary: 'us-east-1',
      secondary: 'us-west-2'
    },
    services: [
      { name: 'Production Database', status: 'healthy', rpo: '1 hour', rto: '4 hours' },
      { name: 'Application Servers', status: 'warning', rpo: '6 hours', rto: '12 hours' },
      { name: 'Storage Buckets', status: 'healthy', rpo: '24 hours', rto: '24 hours' },
      { name: 'Authentication Service', status: 'critical', rpo: '15 minutes', rto: '1 hour' }
    ],
    backupStatus: {
      lastStatus: 'success',
      successRate: 98.5,
      totalSize: '256 GB',
      avgDuration: '45 minutes'
    }
  };

  const testDrPlan = () => {
    setIsLoading(true);
    
    // In a real app, you would call your API
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Disaster Recovery
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This module helps you set up and monitor disaster recovery configurations across your cloud environments.
      </Alert>
      
      {/* DR Overview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            Disaster Recovery Overview
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={drConfig.enabled}
                onChange={() => {}}
                color="primary"
              />
            }
            label="DR Enabled"
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom display="flex" alignItems="center">
                  <BackupIcon sx={{ mr: 1 }} />
                  Backup Configuration
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <SyncIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Backup Schedule"
                      secondary={drConfig.backupSchedule}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <StorageIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Retention Period"
                      secondary={drConfig.retentionPeriod}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Successful Backup"
                      secondary={formatDate(drConfig.lastBackup)}
                    />
                  </ListItem>
                </List>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<SettingsIcon />}>
                  Configure
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom display="flex" alignItems="center">
                  <StorageIcon sx={{ mr: 1 }} />
                  Region Configuration
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Primary Region"
                      secondary={drConfig.regions.primary}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <SyncIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Secondary Region"
                      secondary={drConfig.regions.secondary}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Cross-Region Replication"
                      secondary="Enabled"
                    />
                  </ListItem>
                </List>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary" 
                  variant="contained" 
                  startIcon={<PlayArrowIcon />}
                  onClick={testDrPlan}
                  disabled={isLoading}
                >
                  {isLoading ? 'Testing...' : 'Test DR Plan'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Service Health */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Service Recovery Status
        </Typography>
        
        <Grid container spacing={2}>
          {drConfig.services.map((service, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">
                      {service.name}
                    </Typography>
                    {getStatusIcon(service.status)}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Recovery Point Objective (RPO)
                      </Typography>
                      <Typography variant="body1">
                        {service.rpo}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Recovery Time Objective (RTO)
                      </Typography>
                      <Typography variant="body1">
                        {service.rto}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Recovery Readiness
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={service.status === 'healthy' ? 100 : service.status === 'warning' ? 70 : 30} 
                        color={service.status === 'healthy' ? 'success' : service.status === 'warning' ? 'warning' : 'error'}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button size="small">Test Recovery</Button>
                  <Button size="small">View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Backup Statistics */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Backup Statistics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Success Rate
              </Typography>
              <Typography variant="h5" color="success.main">
                {drConfig.backupStatus.successRate}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Total Backup Size
              </Typography>
              <Typography variant="h5">
                {drConfig.backupStatus.totalSize}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Average Duration
              </Typography>
              <Typography variant="h5">
                {drConfig.backupStatus.avgDuration}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Last Backup Status
              </Typography>
              <Typography variant="h5" display="flex" alignItems="center">
                {drConfig.backupStatus.lastStatus === 'success' ? (
                  <>
                    <CheckIcon color="success" sx={{ mr: 1 }} />
                    Success
                  </>
                ) : (
                  <>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    Failed
                  </>
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DisasterRecoveryPage;