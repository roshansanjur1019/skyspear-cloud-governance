// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress, 
  Button,
  Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  AttachMoney as CostIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

// Chart components (if you're using recharts)
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DashboardSummary {
  resources: {
    total: number;
    by_platform: Record<string, number>;
  };
  security: {
    total: number;
    by_severity: Record<string, number>;
  };
  costs: {
    estimated_savings: number;
    recommendations: number;
  };
  latest_scan?: {
    scan_id: string;
    start_time: string;
    end_time: string;
    duration_ms: number;
    resource_count: number;
  };
}

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/summary');
        setSummary(response.data.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Create data for pie chart
  const getResourceChartData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.resources.by_platform).map(([key, value]) => ({
      name: key.toUpperCase(),
      value
    }));
  };

  // Create data for security issues chart
  const getSecurityChartData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.security.by_severity).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }));
  };

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Overview
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CloudIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" component="div">
                        {summary.resources.total}
                      </Typography>
                      <Typography color="textSecondary">
                        Cloud Resources
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <SecurityIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" component="div">
                        {summary.security.total}
                      </Typography>
                      <Typography color="textSecondary">
                        Security Issues
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CostIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" component="div">
                        ${summary.costs.estimated_savings.toFixed(2)}
                      </Typography>
                      <Typography color="textSecondary">
                        Potential Savings
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AssessmentIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" component="div">
                        {summary.costs.recommendations}
                      </Typography>
                      <Typography color="textSecondary">
                        Recommendations
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Resources by Cloud Provider
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getResourceChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getResourceChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Security Issues by Severity
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getSecurityChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Issues" fill="#FF5252" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Latest scan info */}
          {summary.latest_scan && (
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Latest Scan
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Scan ID
                  </Typography>
                  <Typography variant="body1">
                    {summary.latest_scan.scan_id.substring(0, 8)}...
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Start Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(summary.latest_scan.start_time).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {(summary.latest_scan.duration_ms / 1000).toFixed(2)} seconds
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="textSecondary">
                    Resources Scanned
                  </Typography>
                  <Typography variant="body1">
                    {summary.latest_scan.resource_count}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2} display="flex" alignItems="flex-end">
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => navigate('/dashboard/resources')}
                  >
                    View Resources
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
      ) : (
        <Alert severity="info">
          No dashboard data available. Connect your cloud providers to get started.
        </Alert>
      )}
    </Box>
  );
};

export default DashboardPage;