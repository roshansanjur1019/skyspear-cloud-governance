// src/pages/dashboard/SettingsPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  CloudOutlined as CloudIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  VpnKey as VpnKeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  setTheme, 
  toggleNotifications, 
  setDefaultDashboard, 
  toggleCloudProvider,
  resetSettings
} from '../../store/slices/settingsSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [tabIndex, setTabIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // API keys state (mock data)
  const [apiKeys, setApiKeys] = useState([
    { name: 'Development API Key', key: 'sppt_dev_12345678', created: '2025-01-15', lastUsed: '2025-04-25' },
    { name: 'Production API Key', key: 'sppt_prod_87654321', created: '2025-02-20', lastUsed: '2025-04-26' }
  ]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    
    // Clear password error when changing password fields
    if (['newPassword', 'confirmPassword'].includes(e.target.name)) {
      setPasswordError('');
    }
  };
  
  const saveProfile = async () => {
    // Validate passwords if trying to change password
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        setPasswordError('Current password is required');
        return;
      }
      
      if (profileData.newPassword !== profileData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (profileData.newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
      }
    }
    
    setSaving(true);
    
    try {
      // In a real app, you would call your API here
      // await api.put('/auth/profile', profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Profile updated successfully');
      
      // Reset password fields
      setProfileData({
        ...profileData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setErrorMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const theme = event.target.value as 'light' | 'dark' | 'system';
    dispatch(setTheme(theme));
    setSuccessMessage('Theme updated successfully');
  };
  
  const handleNotificationsToggle = () => {
    dispatch(toggleNotifications({ enabled: !settings.notifications }));
    setSuccessMessage('Notification settings updated');
  };
  
  const handleDefaultDashboardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDefaultDashboard(event.target.value));
    setSuccessMessage('Default dashboard updated');
  };
  
  const handleCloudProviderToggle = (provider: 'aws' | 'azure' | 'gcp') => {
    dispatch(toggleCloudProvider(provider));
    setSuccessMessage('Cloud provider settings updated');
  };
  
  const handleResetSettings = () => {
    dispatch(resetSettings({ resetAll: true })); // Pass the required payload
    setResetDialogOpen(false);
    setSuccessMessage('Settings reset to defaults');
  };
  
  const closeSuccessAlert = () => {
    setSuccessMessage(null);
  };
  
  const closeErrorAlert = () => {
    setErrorMessage(null);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
        >
          <Tab label="Profile" icon={<PersonIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="Appearance" icon={<PaletteIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" {...a11yProps(2)} />
          <Tab label="Cloud Providers" icon={<CloudIcon />} iconPosition="start" {...a11yProps(3)} />
          <Tab label="API Keys" icon={<VpnKeyIcon />} iconPosition="start" {...a11yProps(4)} />
        </Tabs>
        
        {/* Profile Settings */}
        <TabPanel value={tabIndex} index={0}>
          <Typography variant="h6" gutterBottom>
            User Profile
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {profileData.name.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  title={profileData.name}
                  subheader={profileData.email}
                />
                <CardContent>
                  <TextField
                    name="name"
                    label="Full Name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    fullWidth
                    margin="normal"
                  />
                  
                  <TextField
                    name="email"
                    label="Email Address"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    fullWidth
                    margin="normal"
                    disabled // Email changes might require verification
                  />
                  
                  <TextField
                    name="company"
                    label="Company"
                    value={profileData.company}
                    onChange={handleProfileChange}
                    fullWidth
                    margin="normal"
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                    onClick={saveProfile}
                    disabled={saving}
                    sx={{ mt: 2 }}
                  >
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Change Password"
                  subheader="Update your password"
                />
                <CardContent>
                  {passwordError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {passwordError}
                    </Alert>
                  )}
                  
                  <TextField
                    name="currentPassword"
                    label="Current Password"
                    type={showPassword ? 'text' : 'password'}
                    value={profileData.currentPassword}
                    onChange={handleProfileChange}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <TextField
                    name="newPassword"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                    fullWidth
                    margin="normal"
                  />
                  
                  <TextField
                    name="confirmPassword"
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    fullWidth
                    margin="normal"
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveProfile}
                    disabled={saving}
                    sx={{ mt: 2 }}
                  >
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Appearance Settings */}
        <TabPanel value={tabIndex} index={1}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Theme
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.theme === 'light'}
                      onChange={handleThemeChange}
                      value="light"
                      color="primary"
                    />
                  }
                  label="Light Mode"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.theme === 'dark'}
                      onChange={handleThemeChange}
                      value="dark"
                      color="primary"
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.theme === 'system'}
                      onChange={handleThemeChange}
                      value="system"
                      color="primary"
                    />
                  }
                  label="System Default"
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Layout
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.sidebarCollapsed}
                  onChange={() => dispatch(toggleNotifications({ enabled: !settings.sidebarCollapsed }))}
                  color="primary"
                />
              }
              label="Collapsed Sidebar"
            />
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Default Dashboard
            </Typography>
            <TextField
              select
              fullWidth
              label="Default Dashboard"
              value={settings.defaultDashboard}
              onChange={handleDefaultDashboardChange}
              SelectProps={{
                native: true,
              }}
            >
              <option value="overview">Overview</option>
              <option value="resources">Resources</option>
              <option value="security">Security</option>
              <option value="cost">Cost Optimization</option>
            </TextField>
          </Paper>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setResetDialogOpen(true)}
            >
              Reset to Defaults
            </Button>
          </Box>
        </TabPanel>
        
        {/* Notifications Settings */}
        <TabPanel value={tabIndex} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={handleNotificationsToggle}
                      color="primary"
                    />
                  }
                  label="Enable Notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Email Notifications
                </Typography>
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label="Security Alerts"
                  disabled={!settings.notifications}
                />
                <br />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label="Cost Alerts"
                  disabled={!settings.notifications}
                />
                <br />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label="Resource Changes"
                  disabled={!settings.notifications}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  In-App Notifications
                </Typography>
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label="Security Alerts"
                  disabled={!settings.notifications}
                />
                <br />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label="Cost Alerts"
                  disabled={!settings.notifications}
                />
                <br />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label="Resource Changes"
                  disabled={!settings.notifications}
                />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>
        
        {/* Cloud Providers Settings */}
        <TabPanel value={tabIndex} index={3}>
          <Typography variant="h6" gutterBottom>
            Cloud Provider Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="AWS" subheader="Amazon Web Services" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cloudProviders.aws}
                        onChange={() => handleCloudProviderToggle('aws')}
                        color="primary"
                      />
                    }
                    label="Enable AWS"
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <TextField
                    label="AWS Access Key"
                    placeholder="Enter your AWS access key"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.aws}
                  />
                  
                  <TextField
                    label="AWS Secret Key"
                    type="password"
                    placeholder="Enter your AWS secret key"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.aws}
                  />
                  
                  <TextField
                    label="AWS Region"
                    placeholder="Enter your preferred AWS region"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.aws}
                    defaultValue="us-east-1"
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!settings.cloudProviders.aws}
                    sx={{ mt: 2 }}
                  >
                    Connect AWS
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Azure" subheader="Microsoft Azure" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cloudProviders.azure}
                        onChange={() => handleCloudProviderToggle('azure')}
                        color="primary"
                      />
                    }
                    label="Enable Azure"
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <TextField
                    label="Azure Subscription ID"
                    placeholder="Enter your Azure subscription ID"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.azure}
                  />
                  
                  <TextField
                    label="Azure Tenant ID"
                    placeholder="Enter your Azure tenant ID"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.azure}
                  />
                  
                  <TextField
                    label="Azure Client ID"
                    placeholder="Enter your Azure client ID"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.azure}
                  />
                  
                  <TextField
                    label="Azure Client Secret"
                    type="password"
                    placeholder="Enter your Azure client secret"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.azure}
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!settings.cloudProviders.azure}
                    sx={{ mt: 2 }}
                  >
                    Connect Azure
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="GCP" subheader="Google Cloud Platform" />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cloudProviders.gcp}
                        onChange={() => handleCloudProviderToggle('gcp')}
                        color="primary"
                      />
                    }
                    label="Enable GCP"
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <TextField
                    label="GCP Project ID"
                    placeholder="Enter your GCP project ID"
                    fullWidth
                    margin="normal"
                    disabled={!settings.cloudProviders.gcp}
                  />
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Upload your GCP service account key file (JSON format)
                  </Alert>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={!settings.cloudProviders.gcp}
                    sx={{ mt: 2, display: 'block' }}
                  >
                    Upload Key File
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!settings.cloudProviders.gcp}
                    sx={{ mt: 2 }}
                  >
                    Connect GCP
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* API Keys Settings */}
        <TabPanel value={tabIndex} index={4}>
          <Typography variant="h6" gutterBottom>
            API Keys
          </Typography>
          
          {apiKeys.map((apiKey, index) => (
            <Paper key={index} sx={{ p: 3, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle1">
                    {apiKey.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Created: {new Date(apiKey.created).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    value={`${apiKey.key.substring(0, 12)}...`}
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Typography variant="caption" color="textSecondary">
                    Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    Revoke
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          <Button
            variant="contained"
            color="primary"
          >
            Generate New API Key
          </Button>
        </TabPanel>
      </Paper>
      
      {/* Success message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={closeSuccessAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSuccessAlert} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Error message */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={closeErrorAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeErrorAlert} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
      
      {/* Reset dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all settings to their default values? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleResetSettings} color="error">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;