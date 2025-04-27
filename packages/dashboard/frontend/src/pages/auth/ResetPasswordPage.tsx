// src/pages/auth/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  Box, 
  CircularProgress 
} from '@mui/material';
import api from '../../api/client';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid password reset token');
        setValidating(false);
        return;
      }
      
      try {
        await api.get(`/auth/reset-password/${token}/validate`);
        setTokenValid(true);
        setValidating(false);
      } catch (err) {
        setError('Invalid or expired password reset token');
        setValidating(false);
      }
    };
    
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Validating your reset link...
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh'
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Reset Password
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}
          
          {success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your password has been reset successfully! You will be redirected to the login page.
              </Alert>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/login">
                  <Typography component="span" variant="body2" color="primary">
                    Back to Login
                  </Typography>
                </Link>
              </Typography>
            </>
          ) : tokenValid ? (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter your new password below.
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The password reset link is invalid or has expired.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                component={Link}
                to="/forgot-password"
                sx={{ mt: 1 }}
              >
                Request a new link
              </Button>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/login">
                  <Typography component="span" variant="body2" color="primary">
                    Back to Login
                  </Typography>
                </Link>
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;