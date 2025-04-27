// src/pages/error/NotFoundPage.tsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Warning as WarningIcon } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        p: 3
      }}
    >
      <Paper 
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          width: '100%'
        }}
      >
        <WarningIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        
        <Typography variant="h3" component="h1" gutterBottom align="center">
          404
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom align="center" fontWeight="bold">
          Page Not Found
        </Typography>
        
        <Typography variant="body1" align="center" color="textSecondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={handleGoBack}
          >
            Go Back
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleGoHome}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
        SpearPoint Cloud Governance Platform
      </Typography>
    </Box>
  );
};

export default NotFoundPage;